import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Hand,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MousePointerClick,
  Users,
} from "lucide-react";
import SiteHeader, { Logo } from "../components/SiteHeader";
import { useAuth } from "../lib/auth-context";
import { loadRequests } from "../lib/requests";

const display = { fontFamily: "'Fraunces', serif" };

const SLIDE_NUMBERS = ["slide 7?", "slide 12?", "slide 3?", "slide 21?"];

const courses = [
  "Operating Systems",
  "Calculus II",
  "Data Structures",
  "Organic Chem",
  "Stats 101",
  "Networks",
];

// Interactive preview: picking an option changes the tutor's reply.
const demoChoices = {
  choosing: {
    label: "Choosing a process",
    reply:
      'Look for a process whose Need fits in Available. If none fits, the state isn\'t safe. That\'s the whole "safe state" check.',
  },
  releasing: {
    label: "What it releases",
    reply:
      'I got stuck on this too. Start with what "safe state" means, then the release step makes sense.',
  },
};

const steps = [
  {
    n: "01",
    title: "Tap the slide",
    text: "Upload your lecture PDF and mark the slide that lost you.",
    to: "/stuck",
    cta: "Upload slides",
  },
  {
    n: "02",
    title: "Sharpen the question",
    text: 'A quick AI follow-up turns "I don\'t get this" into a request a tutor can answer.',
    to: "/stuck",
    cta: "Try the AI",
  },
  {
    n: "03",
    title: "Meet your tutor",
    text: "A classmate who knows the course accepts, sees your slide, and replies.",
    to: "/board",
    cta: "Open the board",
  },
];

function usePrefersReducedMotion() {
  const [reduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
  return reduced;
}

export default function Home() {
  const { user, displayName } = useAuth();
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();

  const [slideIndex, setSlideIndex] = useState(0);
  const [demoChoice, setDemoChoice] = useState("releasing");
  const [openCount] = useState(
    () => loadRequests().filter((request) => request.status === "open").length
  );

  // Rotate the slide number in the headline.
  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = setInterval(
      () => setSlideIndex((i) => (i + 1) % SLIDE_NUMBERS.length),
      2600
    );
    return () => clearInterval(timer);
  }, [reducedMotion]);

  // Scroll to #how / #tutors when arriving from another page.
  useEffect(() => {
    if (!location.hash) return;
    document
      .getElementById(location.hash.slice(1))
      ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }, [location.hash, location.key, reducedMotion]);

  const card =
    "transition duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[8px_8px_0_#1F1B16]";

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

      {/* Hero */}
      <main className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[1.05fr_1fr]">
        <section>
          <p className="mb-5 inline-block -rotate-1 rounded-full border-2 border-[#1F1B16] bg-[#BFE3C0] px-3 py-1 text-sm font-bold">
            {user ? `Welcome back, ${displayName}!` : "Made at TRU, for TRU students"}
          </p>

          <h1
            className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
            style={display}
          >
            Stuck on{" "}
            <span
              className="bg-[linear-gradient(transparent_62%,#F5B82E_62%)] px-1"
              aria-live="off"
            >
              <span key={slideIndex} className="animate-word-in">
                {SLIDE_NUMBERS[slideIndex]}
              </span>
            </span>
            <br />
            Someone in your class got it.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#4a4338]">
            Tap the slide you're confused by. Our AI helps you say exactly
            what's tripping you up, then a peer tutor who aced the course
            picks it up. No awkward group-chat post.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              to="/stuck"
              className="flex min-h-12 items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-6 text-lg font-bold text-white shadow-[4px_4px_0_#1F1B16] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1F1B16] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Hand size={20} />
              I'm stuck
            </Link>

            <Link
              to="/board"
              className="group flex min-h-12 items-center gap-1 text-lg font-bold underline decoration-2 underline-offset-4"
            >
              I want to tutor
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-sm text-[#4a4338]">
            <Link
              to="/board"
              className="flex w-fit items-center gap-2 font-semibold hover:underline"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B4A] opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FF6B4A]" />
              </span>
              {openCount} open {openCount === 1 ? "request" : "requests"} on
              the board right now
            </Link>
            <p className="flex items-center gap-2">
              <ShieldCheck size={16} />
              Requests are anonymous until you choose otherwise.
            </p>
          </div>
        </section>

        {/* Interactive product preview */}
        <section
          className="relative mx-auto h-[460px] w-full max-w-md"
          aria-label="Try an example of how StudyHive works"
        >
          {/* Slide */}
          <Link
            to="/stuck"
            className={`absolute left-0 top-0 block w-[78%] -rotate-2 rounded-xl border-2 border-[#1F1B16] bg-white p-4 shadow-[6px_6px_0_#1F1B16] ${card}`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#8a7f6d]">
              Operating Systems · Slide 7
            </p>
            <h3 className="mt-1 text-xl font-extrabold" style={display}>
              Banker's Algorithm
            </h3>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full rounded bg-[#EFE7D3]" />
              <div className="h-2 w-5/6 rounded bg-[#EFE7D3]" />
              <div className="h-2 w-2/3 rounded bg-[#EFE7D3]" />
            </div>
            <span className="absolute -right-3 -top-3 rotate-6 rounded-md border-2 border-[#1F1B16] bg-[#FF6B4A] px-2 py-1 text-xs font-bold text-white">
              stuck here
            </span>
          </Link>

          {/* AI follow-up (clickable) */}
          <div
            className={`absolute right-0 top-[150px] w-[82%] rotate-1 rounded-xl border-2 border-[#1F1B16] bg-[#FFF1C7] p-4 shadow-[6px_6px_0_#1F1B16] ${card}`}
          >
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Quick question
            </p>
            <p className="mt-1 font-medium">
              Which part is confusing: choosing which process runs, or what
              it releases afterward?
            </p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Pick an answer">
              {Object.entries(demoChoices).map(([key, choice]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={demoChoice === key}
                  onClick={() => setDemoChoice(key)}
                  className={`rounded-full border-2 border-[#1F1B16] px-3 py-1 text-sm font-medium transition hover:-translate-y-0.5 ${
                    demoChoice === key
                      ? "bg-[#1F1B16] text-white"
                      : "bg-white hover:bg-[#FBF6EA]"
                  }`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#665A43]">
              <MousePointerClick size={13} /> Tap an option to see how a tutor replies
            </p>
          </div>

          {/* Tutor reply (changes with the choice) */}
          <div
            className={`absolute bottom-0 left-4 w-[78%] -rotate-1 rounded-xl border-2 border-[#1F1B16] bg-[#BFE3C0] p-4 shadow-[6px_6px_0_#1F1B16] ${card}`}
            aria-live="polite"
          >
            <p className="text-xs font-bold uppercase tracking-wider">
              Tutor accepted · Maya, CS 3rd year
            </p>
            <p key={demoChoice} className="animate-word-in mt-1 font-medium">
              {demoChoices[demoChoice].reply}
            </p>
          </div>
        </section>
      </main>

      {/* How it works */}
      <section
        id="how"
        className="scroll-mt-4 border-y-2 border-[#1F1B16] bg-[#1F1B16] text-[#FBF6EA]"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-extrabold" style={display}>
            How it works
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <Link
                key={step.n}
                to={step.to}
                className="group rounded-xl border-2 border-[#FBF6EA]/20 p-5 transition hover:-translate-y-1 hover:border-[#F5B82E] hover:bg-[#2a251f]"
              >
                <span
                  className="text-5xl font-extrabold text-[#F5B82E]"
                  style={display}
                >
                  {step.n}
                </span>
                <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-[#d8cfb9]">{step.text}</p>
                <span className="mt-4 flex items-center gap-1 font-bold text-[#F5B82E]">
                  {step.cta}
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="tutors" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-extrabold" style={display}>
          Tutors are waiting in
        </h2>
        <p className="mt-2 text-[#4a4338]">
          Pick a course to see requests from your classmates.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {courses.map((course, i) => (
            <Link
              key={course}
              to={`/board?q=${encodeURIComponent(course)}`}
              className={`flex min-h-11 items-center rounded-full border-2 border-[#1F1B16] px-4 font-bold shadow-[3px_3px_0_#1F1B16] transition hover:-translate-y-1 hover:rotate-0 hover:shadow-[5px_5px_0_#1F1B16] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                i % 3 === 0
                  ? "bg-[#F5B82E]"
                  : i % 3 === 1
                    ? "bg-[#BFE3C0]"
                    : "bg-white"
              } ${i % 2 ? "rotate-1" : "-rotate-1"}`}
            >
              {course}
            </Link>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border-2 border-[#1F1B16] bg-[#FFF1C7] p-6 shadow-[6px_6px_0_#1F1B16] sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl" style={display}>
              {user ? "Ready when you are." : "Know a course well? Help someone out."}
            </h2>
            <p className="mt-2 text-[#4a4338]">
              {user
                ? "Post a slide you're stuck on, or answer a classmate's request."
                : "Create a free account to reply under your name."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link
                to="/stuck"
                className="flex min-h-12 items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-5 font-bold text-white shadow-[3px_3px_0_#1F1B16]"
              >
                <Hand size={18} /> I'm stuck
              </Link>
            ) : (
              <Link
                to="/signin"
                className="flex min-h-12 items-center rounded-lg border-2 border-[#1F1B16] bg-[#F5B82E] px-5 font-bold shadow-[3px_3px_0_#1F1B16]"
              >
                Create account
              </Link>
            )}
            <Link
              to="/board"
              className="flex min-h-12 items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-white px-5 font-bold shadow-[3px_3px_0_#1F1B16]"
            >
              <Users size={18} /> Tutor board
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-[#1F1B16] bg-[#FBF6EA]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap gap-5 font-semibold">
            <a href="#how" className="hover:underline">How it works</a>
            <Link to="/stuck" className="hover:underline">Ask for help</Link>
            <Link to="/board" className="hover:underline">Tutor board</Link>
            <Link to="/signin" className="hover:underline">
              {user ? "Account" : "Sign in"}
            </Link>
          </nav>
          <p className="text-[#665A43]">Made at TRU, for TRU students.</p>
        </div>
      </footer>
    </div>
  );
}
