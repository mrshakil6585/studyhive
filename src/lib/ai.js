
import { supabase } from "./supabase";
import { ensureSession } from "./session";

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

// Slide fields sent with every AI request.
// `slide` is { slideText, slideNumber, slideImage? } from SlideViewer.
function slidePayload(slide) {
  const text = slide.slideText?.trim();
  const slideText = (
    text ||
    (slide.slideImage
      ? "(No text could be extracted. Use the attached slide image.)"
      : `This slide (number ${slide.slideNumber}) has no readable text.`)
  ).slice(0, 15000);

  return slide.slideImage
    ? { slideText, slideImage: slide.slideImage }
    : { slideText };
}

// Default "stuck" description. Worded so the AI offers concepts the
// student might be confused about, not answers to the slide's exercise.
export const STUCK_CONFUSION =
  "I'm stuck on this slide but I can't name exactly what I don't get. " +
  "I don't want the answer to any exercise on the slide. I'd like to choose " +
  "from the specific concepts or steps on this slide that I might not " +
  "understand, each described as what I'm confused about (for example: " +
  '"What X means", "Why Y happens", "How to do Z").';

// AI Action 1: Clarification -> { question, options: [3 strings] }
export const clarify = (slide, confusion = STUCK_CONFUSION) =>
  callAI({ action: "clarify", ...slidePayload(slide), confusion });

// Brief slide summary (uses the "explain" action) -> { explanation, example }
export const summarize = (slide) =>
  callAI({
    action: "explain",
    ...slidePayload(slide),
    question:
      "In 2-3 short sentences, summarize what this slide covers and what " +
      "the student is expected to understand or do. Do not solve any exercise.",
  });

// AI Action 2: Tutoring request draft -> { draft }
export const draft = (slide, confusion, selectedOption) =>
  callAI({ action: "draft", ...slidePayload(slide), confusion, selectedOption });

// AI Action 3: AI Study Companion -> { explanation, example }
export const explain = (slide, question = "") =>
  callAI({ action: "explain", ...slidePayload(slide), question });
