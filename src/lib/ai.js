
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

  const { data, error } =
    await supabase.functions.invoke("studyhive-ai", {
      body: payload,
    });

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

// AI Action 1: Clarification
export const clarify = (
  slideText,
  slideNumber,
  confusion
) =>
  callAI({
    action: "clarify",
    slideText: safe(slideText, slideNumber),
    confusion,
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
