import { Hand, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

const INK = "#1F1B16";
const display = { fontFamily: "'Fraunces', serif" };

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
        <polygon
          points="12,2 21,7 21,17 12,22 3,17 3,7"
          fill="#F5B82E"
          stroke={INK}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <polygon
          points="12,8 16,10.3 16,14.7 12,17 8,14.7 8,10.3"
          fill="#FBF6EA"
          stroke={INK}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-2xl font-extrabold tracking-tight" style={display}>
        StudyHive
      </span>
    </div>
  );
}

function App() {
  const courses = ["Operating Systems", "Calculus II", "Data Structures", "Organic Chem", "Stats 101", "Networks"];

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
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-6 text-base font-medium">
          <a href="#how" className="hidden hover:underline sm:block">How it works</a>
          <a href="#tutors" className="hidden hover:underline sm:block">Find a tutor</a>
          <button className="min-h-11 rounded-lg border-2 border-[#1F1B16] bg-[#F5B82E] px-4 font-bold shadow-[3px_3px_0_#1F1B16] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            Sign in
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr]">
        <section>
          <p className="mb-5 inline-block -rotate-1 rounded-full border-2 border-[#1F1B16] bg-[#BFE3C0] px-3 py-1 text-sm font-bold">
            Made at TRU, for TRU students
          </p>

          <h1
            className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
            style={display}
          >
            Stuck on{" "}
            <span className="bg-[linear-gradient(transparent_62%,#F5B82E_62%)] px-1">
              slide 7?
            </span>
            <br />
            Someone in your class got it.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#4a4338]">
            Tap the slide you're confused by. Our AI helps you say exactly what's
            tripping you up, then a peer tutor who aced the course picks it up.
            No awkward group-chat post.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button className="flex min-h-12 items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-6 text-lg font-bold text-white shadow-[4px_4px_0_#1F1B16] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              <Hand size={20} /> I'm stuck
            </button>
            <button className="flex min-h-12 items-center gap-1 text-lg font-bold underline decoration-2 underline-offset-4">
              I want to tutor <ArrowRight size={18} />
            </button>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-[#4a4338]">
            <ShieldCheck size={16} /> Requests are anonymous until you choose otherwise.
          </p>
        </section>

        {/* Product preview collage */}
        <section className="relative mx-auto h-[440px] w-full max-w-md" aria-label="Example of how StudyHive works">
          {/* Slide */}
          <div className="absolute left-0 top-0 w-[78%] -rotate-2 rounded-xl border-2 border-[#1F1B16] bg-white p-4 shadow-[6px_6px_0_#1F1B16]">
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
          </div>

          {/* AI follow-up */}
          <div className="absolute right-0 top-[150px] w-[82%] rotate-1 rounded-xl border-2 border-[#1F1B16] bg-[#FFF1C7] p-4 shadow-[6px_6px_0_#1F1B16]">
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Quick question
            </p>
            <p className="mt-1 font-medium">
              Which part is confusing: choosing which process runs, or what it
              releases afterward?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-[#1F1B16] bg-white px-3 py-1 text-sm font-medium">
                Choosing a process
              </span>
              <span className="rounded-full border-2 border-[#1F1B16] bg-[#1F1B16] px-3 py-1 text-sm font-medium text-white">
                What it releases
              </span>
            </div>
          </div>

          {/* Tutor reply */}
          <div className="absolute bottom-0 left-4 w-[78%] -rotate-1 rounded-xl border-2 border-[#1F1B16] bg-[#BFE3C0] p-4 shadow-[6px_6px_0_#1F1B16]">
            <p className="text-xs font-bold uppercase tracking-wider">Tutor accepted · Maya, CS 3rd year</p>
            <p className="mt-1 font-medium">
              I got stuck on this too. Start with what "safe state" means, then the
              release step makes sense.
            </p>
          </div>
        </section>
      </main>

      {/* How it works */}
      <section id="how" className="border-y-2 border-[#1F1B16] bg-[#1F1B16] text-[#FBF6EA]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
          {[
            ["01", "Tap the slide", "Upload your lecture PDF and mark the slide that lost you."],
            ["02", "Sharpen the question", "One short AI follow-up turns \"I don't get this\" into a request a tutor can answer."],
            ["03", "Meet your tutor", "A classmate who knows the course accepts, and you chat privately."],
          ].map(([n, title, text]) => (
            <div key={n}>
              <span className="text-5xl font-extrabold text-[#F5B82E]" style={display}>{n}</span>
              <h3 className="mt-2 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-[#d8cfb9]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="tutors" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-3xl font-extrabold" style={display}>
          Tutors are waiting in
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {courses.map((c, i) => (
            <button
              key={c}
              className={`min-h-11 rounded-full border-2 border-[#1F1B16] px-4 font-bold shadow-[3px_3px_0_#1F1B16] ${
                i % 3 === 0 ? "bg-[#F5B82E]" : i % 3 === 1 ? "bg-[#BFE3C0]" : "bg-white"
              } ${i % 2 ? "rotate-1" : "-rotate-1"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;