// Calls Mahi's Supabase Edge Function (supabase/functions/studyhive-ai).
// Needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (in .env AND in Vercel).
const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/studyhive-ai`;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callAI(payload) {
  if (!import.meta.env.VITE_SUPABASE_URL || !KEY) {
    throw new Error("AI is not configured yet.");
  }

  let res;
  try {
    res = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    throw new Error("Can't reach the AI helper. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "The AI helper had a problem. Please try again.");
  }
  return data;
}

const safe = (text, n) =>
  (text && text.trim() ? text : `This slide (number ${n}) has no readable text.`).slice(0, 15000);

// -> { question, options: [2-3 strings] }
export const clarify = (slideText, slideNumber, confusion) =>
  callAI({ action: "clarify", slideText: safe(slideText, slideNumber), confusion });

// -> { draft }
export const draft = (slideText, slideNumber, confusion, selectedOption) =>
  callAI({ action: "draft", slideText: safe(slideText, slideNumber), confusion, selectedOption });

// -> { explanation, example }
export const explain = (slideText, slideNumber, question = "") =>
  callAI({ action: "explain", slideText: safe(slideText, slideNumber), question });