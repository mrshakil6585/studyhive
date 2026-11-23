

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function callAI(body) {
  const { data, error } = await supabase.functions.invoke(
    "studyhive-ai",
    { body }
  );

  if (error) {
    let details = error.message;

    if (error.context instanceof Response) {
      const raw = await error.context.text();
      details += ` | HTTP ${error.context.status}: ${raw}`;
    }

    throw new Error(details);
  }

  return data;
}

async function main() {
  console.log("STUDYHIVE AI INTEGRATION TEST");
  console.log("----------------------------");

  console.log("1. Signing in anonymously...");

  const { data: authData, error: authError } =
    await supabase.auth.signInAnonymously();

  if (authError) {
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  if (!authData.session?.access_token) {
    throw new Error("No authenticated session returned.");
  }

  console.log("Anonymous authentication passed.");

  const slideText =
    "Banker's Algorithm avoids deadlocks by checking " +
    "whether resources can be allocated safely. " +
    "Need = Max - Allocation.";

  const confusion = "I don't understand the Need Matrix.";

  console.log("\n2. Testing CLARIFY...");

  const clarify = await callAI({
    action: "clarify",
    slideText,
    confusion,
  });

  console.log(JSON.stringify(clarify, null, 2));

  if (
    typeof clarify?.question !== "string" ||
    !Array.isArray(clarify.options) ||
    clarify.options.length !== 3
  ) {
    throw new Error("CLARIFY returned an invalid response.");
  }

  console.log("CLARIFY PASSED");

  console.log("\n3. Testing DRAFT...");

  const draft = await callAI({
    action: "draft",
    slideText,
    confusion,
    selectedOption: clarify.options[0],
  });

  console.log(JSON.stringify(draft, null, 2));

  if (typeof draft?.draft !== "string" || !draft.draft.trim()) {
    throw new Error("DRAFT returned an invalid response.");
  }

  console.log("DRAFT PASSED");

  console.log("\n4. Testing EXPLAIN...");

  const explain = await callAI({
    action: "explain",
    slideText,
    question: "Explain the Need Matrix with an example.",
  });

  console.log(JSON.stringify(explain, null, 2));

  if (
    typeof explain?.explanation !== "string" ||
    typeof explain?.example !== "string"
  ) {
    throw new Error("EXPLAIN returned an invalid response.");
  }

  console.log("EXPLAIN PASSED");
  console.log("\nALL THREE STUDYHIVE AI TESTS PASSED!");
}

main().catch((error) => {
  console.error("\nTEST FAILED:", error.message);
  process.exitCode = 1;
});
