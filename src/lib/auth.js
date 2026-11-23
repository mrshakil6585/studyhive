
import { supabase } from "./supabase";

// Get an existing session or create an anonymous session
export async function ensureStudentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  if (data.session?.user) {
    return data.session.user;
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInAnonymously();

  if (signInError) throw signInError;

  return signInData.user;
}
