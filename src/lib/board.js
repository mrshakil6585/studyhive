
import { supabase } from "./supabase";

// Create a new tutoring request
export async function postRequest(title, description, subject) {
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Please sign in first.");

  const { data, error } = await supabase
    .from("requests")
    .insert({
      student_id: user.id,
      title,
      description,
      subject,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all tutoring requests
export async function listRequests() {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Accept an open tutoring request
export async function acceptRequest(requestId) {
  const { data, error } = await supabase.rpc(
    "accept_request",
    { p_request_id: requestId }
  );

  if (error) throw error;
  return data;
}

// Get messages for a request
export async function listMessages(requestId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

// Send a chat message
export async function sendMessage(requestId, content) {
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Please sign in first.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      request_id: requestId,
      sender_id: user.id,
      content: content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Subscribe to new messages
export function subscribeToMessages(requestId, onMessage) {
  const channel = supabase
    .channel(`messages:${requestId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `request_id=eq.${requestId}`,
      },
      (payload) => onMessage(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
