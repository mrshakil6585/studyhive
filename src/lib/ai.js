
import { supabase } from "./supabase";

// Authenticate before calling Mahi's AI backend.
async function ensureSession() {
  if (!supabase) {
    throw new Error("AI is not configured yet. Add the Supabase key to .env.");
  }

  const { data, error } =
    await supabase.auth.getSession();

  if (error) throw error;

  if (data.session) {
    return data.session;
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInAnonymously();

  if (authError) throw authError;

  return authData.session;
}

// Call Mahi's studyhive-ai Edge Function.
async function callAI(payload) {
  const session = await ensureSession();

  if (!session?.access_token) {
    throw new Error("Could not authenticate student.");
  }

  let { data, error } =
    await supabase.functions.invoke("studyhive-ai", {
      body: payload,
    });

  // Gemini is sometimes briefly overloaded (503/504); retry once.
  const status = error?.context?.status;
  if (status === 503 || status === 504) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    ({ data, error } = await supabase.functions.invoke("studyhive-ai", {
      body: payload,
    }));
  }

  if (error) {
    let message = error.message;

    if (error.context instanceof Response) {
      try {
        const result = await error.context.clone().json();
        message = result.error || message;
      } catch {
        // Keep the original error.
      }
    }

    throw new Error(message);
  }

  return data;
}

// Prepare slide text.
const safe = (text, n) =>
  (
    text && text.trim()
      ? text
      : `This slide (number ${n}) has no readable text.`
  ).slice(0, 15000);

// Default "stuck" description. Worded so the AI offers concepts the
// student might be confused about, not answers to the slide's exercise.
export const STUCK_CONFUSION =
  "I'm stuck on this slide but I can't name exactly what I don't get. " +
  "I don't want the answer to any exercise on the slide. I'd like to choose " +
  "from the specific concepts or steps on this slide that I might not " +
  "understand, each described as what I'm confused about (for example: " +
  '"What X means", "Why Y happens", "How to do Z").';

// AI Action 1: Clarification
export const clarify = (
  slideText,
  slideNumber,
  confusion = STUCK_CONFUSION
) =>
  callAI({
    action: "clarify",
    slideText: safe(slideText, slideNumber),
    confusion,
  });

// Brief slide summary (uses the "explain" action) -> { explanation, example }
export const summarize = (slideText, slideNumber) =>
  callAI({
    action: "explain",
    slideText: safe(slideText, slideNumber),
    question:
      "In 2-3 short sentences, summarize what this slide covers and what " +
      "the student is expected to understand or do. Do not solve any exercise.",
  });

// AI Action 2: Tutoring request draft
export const draft = (
  slideText,
  slideNumber,
  confusion,
  selectedOption
) =>
  callAI({
    action: "draft",
    slideText: safe(slideText, slideNumber),
    confusion,
    selectedOption,
  });

// AI Action 3: AI Study Companion
export const explain = (
  slideText,
  slideNumber,
  question = ""
) =>
  callAI({
    action: "explain",
    slideText: safe(slideText, slideNumber),
    question,
  });
