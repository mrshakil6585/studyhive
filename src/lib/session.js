import { supabase } from "./supabase";

let pending = null;

// Returns the current session, signing in anonymously if there is none.
// Concurrent callers share one sign-in so only one anonymous user is created.
export async function ensureSession() {
  if (!supabase) {
    throw new Error("StudyHive is not configured yet. Add the Supabase key to .env.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session) return data.session;

  if (!pending) {
    pending = supabase.auth
      .signInAnonymously()
      .then(({ data: authData, error: authError }) => {
        if (authError) throw authError;
        return authData.session;
      })
      .finally(() => {
        pending = null;
      });
  }

  return pending;
}
