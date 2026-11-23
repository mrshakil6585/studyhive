// Tutoring requests and messages, stored in Supabase.
// Tables: public.requests, public.messages. Images: storage bucket "slide-images".
import { supabase } from "./supabase";
import { ensureSession } from "./session";

const BUCKET = "slide-images";

const REQUEST_COLUMNS =
  "id, student_id, tutor_id, title, description, subject, status, created_at, " +
  "slide_number, pdf_title, slide_summary, slide_text, slide_image_path, topics, " +
  "author_name, tutor_name, accepted_at, message_count";

function check(error, fallback) {
  if (error) {
    console.error(error);
    throw new Error(error.message || fallback);
  }
}

function imageUrl(path) {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Database row -> shape used by the UI.
function fromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    tutorId: row.tutor_id,
    title: row.title,
    question: row.description,
    course: row.subject || "General",
    status: row.status,
    createdAt: row.created_at,
    slideNumber: row.slide_number,
    pdfTitle: row.pdf_title,
    slideSummary: row.slide_summary,
    slideText: row.slide_text,
    slideImagePath: row.slide_image_path,
    slideImage: imageUrl(row.slide_image_path),
    topics: row.topics ?? [],
    authorName: row.author_name,
    tutorName: row.tutor_name,
    acceptedAt: row.accepted_at,
    messageCount: row.message_count ?? 0,
  };
}

function fromMessageRow(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    senderId: row.sender_id,
    author: row.sender_name || "Student",
    text: row.content,
    createdAt: row.created_at,
  };
}

export async function listRequests() {
  await ensureSession();
  const { data, error } = await supabase
    .from("requests")
    .select(REQUEST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);
  check(error, "Couldn't load requests.");
  return data.map(fromRow);
}

export async function countOpenRequests() {
  await ensureSession();
  const { count, error } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  check(error, "Couldn't count requests.");
  return count ?? 0;
}

// Uploads a data-URL slide image into the user's folder. Returns the storage path or null.
async function uploadSlideImage(userId, dataUrl) {
  if (!dataUrl) return null;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type || "image/jpeg" });
    if (error) throw error;
    return path;
  } catch (err) {
    // The request is still useful without the picture.
    console.warn("Couldn't upload slide image:", err);
    return null;
  }
}

// request: { title, course, question, slideNumber, pdfTitle, slideSummary,
//            slideText, slideImage (data URL), topics, showName }
export async function createRequest(request) {
  const session = await ensureSession();
  const imagePath = await uploadSlideImage(session.user.id, request.slideImage);

  const { data, error } = await supabase
    .from("requests")
    .insert({
      student_id: session.user.id,
      title: request.title,
      description: request.question,
      subject: request.course || null,
      slide_number: request.slideNumber ?? null,
      pdf_title: request.pdfTitle ?? null,
      slide_summary: request.slideSummary || null,
      slide_text: request.slideText ? request.slideText.slice(0, 15000) : null,
      slide_image_path: imagePath,
      topics: (request.topics ?? []).slice(0, 12),
      // The server replaces this with the account's real name, or null.
      author_name: request.showName ? "me" : null,
    })
    .select(REQUEST_COLUMNS)
    .single();

  if (error && imagePath) {
    await supabase.storage.from(BUCKET).remove([imagePath]);
  }
  check(error, "Couldn't post your request.");
  return fromRow(data);
}

export async function deleteRequest(request) {
  await ensureSession();
  const { error } = await supabase.from("requests").delete().eq("id", request.id);
  check(error, "Couldn't delete the request.");
  if (request.slideImagePath) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([request.slideImagePath]);
    if (storageError) console.warn("Couldn't delete slide image:", storageError);
  }
}

export async function acceptRequest(requestId) {
  await ensureSession();
  const { data, error } = await supabase.rpc("accept_request", {
    p_request_id: requestId,
  });
  check(error, "Couldn't accept the request.");
  return fromRow(data);
}

export async function listMessages(requestId) {
  await ensureSession();
  const { data, error } = await supabase
    .from("messages")
    .select("id, request_id, sender_id, sender_name, content, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  check(error, "Couldn't load replies.");
  return data.map(fromMessageRow);
}

export async function sendMessage(requestId, text) {
  const session = await ensureSession();
  const { data, error } = await supabase
    .from("messages")
    .insert({ request_id: requestId, sender_id: session.user.id, content: text })
    .select("id, request_id, sender_id, sender_name, content, created_at")
    .single();
  check(error, "Couldn't send your reply.");
  return fromMessageRow(data);
}

// Calls onChange() whenever requests or messages change. Returns an unsubscribe function.
export function subscribeToChanges(onChange) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`board-${crypto.randomUUID()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, onChange)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
