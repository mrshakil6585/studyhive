import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, MailCheck, CheckCircle2 } from "lucide-react";
import SiteHeader from "../components/SiteHeader";
import { useAuth } from "../lib/auth-context";

const display = { fontFamily: "'Fraunces', serif" };

const inputClass =
  "mt-2 w-full rounded-lg border-2 border-[#1F1B16] bg-white p-3 focus:outline-none focus:ring-4 focus:ring-[#F5B82E]/60";

function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mt-4">
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={6}
          required
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 mt-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md hover:bg-[#FBF6EA]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function SignIn() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from && location.state.from !== "/signin"
    ? location.state.from
    : "/";

  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (auth.recovering) {
        await auth.updatePassword(password);
        setPassword("");
        setNotice("Your password was updated. You're signed in.");
      } else if (mode === "signin") {
        await auth.signIn(email.trim(), password);
        navigate(from, { replace: true });
      } else if (mode === "signup") {
        const { needsConfirmation } = await auth.signUp(
          name.trim(),
          email.trim(),
          password
        );
        if (needsConfirmation) {
          setNotice(
            `We sent a confirmation link to ${email.trim()}. Open it to finish creating your account, then sign in.`
          );
          setPassword("");
        } else {
          navigate(from, { replace: true });
        }
      } else {
        await auth.sendPasswordReset(email.trim());
        setNotice(
          `If an account exists for ${email.trim()}, we sent a link to reset your password.`
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const title = auth.recovering
    ? "Choose a new password"
    : mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : "Welcome back";

  const submitLabel = auth.recovering
    ? "Save new password"
    : mode === "signup"
      ? "Create account"
      : mode === "forgot"
        ? "Send reset link"
        : "Sign in";

  return (
    <div
      className="min-h-screen text-[#1F1B16]"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        backgroundColor: "#FBF6EA",
        backgroundImage: "radial-gradient(#1F1B1618 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <SiteHeader />

      <main className="mx-auto max-w-md px-4 pb-16 pt-6 sm:px-6">
        {auth.user && !auth.recovering ? (
          <section className="rounded-xl border-2 border-[#1F1B16] bg-white p-6 text-center shadow-[5px_5px_0_#1F1B16]">
            <CheckCircle2 size={40} className="mx-auto text-[#2f7a3a]" />
            <h1 className="mt-3 text-3xl font-extrabold" style={display}>
              You're signed in
            </h1>
            <p className="mt-2 text-[#4a4338]">
              Signed in as <strong>{auth.displayName}</strong> ({auth.user.email}).
            </p>
            {notice && (
              <p role="status" className="mt-4 rounded-lg bg-[#BFE3C0] p-3 font-medium">
                {notice}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/stuck"
                className="rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-5 py-3 font-bold text-white shadow-[3px_3px_0_#1F1B16]"
              >
                I'm stuck
              </Link>
              <Link
                to="/board"
                className="rounded-lg border-2 border-[#1F1B16] bg-white px-5 py-3 font-bold shadow-[3px_3px_0_#1F1B16]"
              >
                Tutor board
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border-2 border-[#1F1B16] bg-white p-6 shadow-[5px_5px_0_#1F1B16] sm:p-8">
            {!auth.recovering && mode !== "forgot" && (
              <div
                role="tablist"
                aria-label="Sign in or create an account"
                className="mb-6 grid grid-cols-2 gap-1 rounded-lg border-2 border-[#1F1B16] bg-[#FBF6EA] p-1"
              >
                {[
                  ["signin", "Sign in"],
                  ["signup", "Create account"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => switchMode(value)}
                    className={`rounded-md py-2 font-bold transition ${
                      mode === value
                        ? "bg-[#F5B82E] shadow-[2px_2px_0_#1F1B16]"
                        : "hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-extrabold" style={display}>
              {title}
            </h1>
            <p className="mt-2 text-[#4a4338]">
              {auth.recovering
                ? "Enter a new password for your account."
                : mode === "signup"
                  ? "Post requests under your name and reply to classmates as a tutor."
                  : mode === "forgot"
                    ? "We'll email you a link to choose a new password."
                    : "Sign in to keep track of your requests and replies."}
            </p>

            {!auth.configured && (
              <p role="alert" className="mt-4 font-medium text-red-700">
                Sign-in is not configured yet. Add the Supabase key to .env.
              </p>
            )}

            {notice && (
              <p
                role="status"
                className="mt-5 flex gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#BFE3C0] p-3 font-medium"
              >
                <MailCheck size={20} className="mt-0.5 shrink-0" />
                {notice}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-2">
              {mode === "signup" && !auth.recovering && (
                <div className="mt-4">
                  <label htmlFor="name" className="block font-semibold">
                    Your name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    maxLength={40}
                    required
                    placeholder="e.g. Maya"
                    className={inputClass}
                  />
                </div>
              )}

              {!auth.recovering && (
                <div className="mt-4">
                  <label htmlFor="email" className="block font-semibold">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    placeholder="you@mytru.ca"
                    className={inputClass}
                  />
                </div>
              )}

              {(mode !== "forgot" || auth.recovering) && (
                <PasswordField
                  id="password"
                  label={auth.recovering ? "New password" : "Password"}
                  value={password}
                  onChange={setPassword}
                  autoComplete={
                    mode === "signin" && !auth.recovering
                      ? "current-password"
                      : "new-password"
                  }
                />
              )}

              {mode === "signup" && !auth.recovering && (
                <p className="mt-2 text-sm text-[#665A43]">At least 6 characters.</p>
              )}

              {mode === "signin" && !auth.recovering && (
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="mt-3 text-sm font-semibold underline"
                >
                  Forgot password?
                </button>
              )}

              {error && (
                <p role="alert" className="mt-4 font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy || !auth.configured}
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#F5B82E] px-5 font-bold shadow-[3px_3px_0_#1F1B16] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                {busy && <Loader2 className="animate-spin" size={18} />}
                {submitLabel}
              </button>

              {mode === "forgot" && !auth.recovering && (
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="mt-4 w-full text-center text-sm font-semibold underline"
                >
                  Back to sign in
                </button>
              )}
            </form>
          </section>
        )}

        <p className="mt-6 text-center text-sm text-[#665A43]">
          You can still ask for help and use the AI without an account.
        </p>
      </main>
    </div>
  );
}
