import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { AuthContext } from "../lib/auth-context";

// Turn Supabase error messages into plain language.
function friendlyError(error) {
  const message = error?.message || "Something went wrong. Please try again.";
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Wrong email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email first. Check your inbox for the link.";
  }
  if (lower.includes("already registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (lower.includes("rate limit")) {
    return "Too many emails were sent recently. Please wait a few minutes and try again.";
  }
  if (lower.includes("password should be")) {
    return "Password must be at least 6 characters.";
  }
  return message;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Sign-in is not configured yet. Add the Supabase key to .env.");
  }
  return supabase;
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => {
    // Anonymous sessions (used for the AI) don't count as signed in.
    const user =
      session?.user && !session.user.is_anonymous ? session.user : null;

    const displayName = user
      ? user.user_metadata?.display_name || user.email?.split("@")[0] || "Student"
      : null;

    const redirectTo = `${window.location.origin}/signin`;

    async function run(promise) {
      const { data, error } = await promise;
      if (error) throw new Error(friendlyError(error));
      return data;
    }

    return {
      configured: isSupabaseConfigured,
      ready,
      user,
      displayName,
      recovering,

      signIn: (email, password) =>
        run(requireSupabase().auth.signInWithPassword({ email, password })),

      // Returns { needsConfirmation } when Supabase requires an email check.
      signUp: async (name, email, password) => {
        const data = await run(
          requireSupabase().auth.signUp({
            email,
            password,
            options: {
              data: { display_name: name },
              emailRedirectTo: redirectTo,
            },
          })
        );
        // Supabase hides "already registered" by returning a user with no identities.
        if (data.user && data.user.identities?.length === 0) {
          throw new Error(friendlyError({ message: "already registered" }));
        }
        return { needsConfirmation: !data.session };
      },

      signOut: () => run(requireSupabase().auth.signOut()),

      sendPasswordReset: (email) =>
        run(requireSupabase().auth.resetPasswordForEmail(email, { redirectTo })),

      updatePassword: async (password) => {
        await run(requireSupabase().auth.updateUser({ password }));
        setRecovering(false);
      },

      finishRecovery: () => setRecovering(false),
    };
  }, [session, ready, recovering]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
