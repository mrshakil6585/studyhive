import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = !supabaseKey || supabaseKey.startsWith("your-");

export const isSupabaseConfigured = Boolean(supabaseUrl) && !isPlaceholder;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env, then restart the dev server."
  );
}

// Null when not configured, so the rest of the app still loads.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
