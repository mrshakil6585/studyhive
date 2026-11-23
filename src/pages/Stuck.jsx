import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Pencil,
  Plus,
  Send,
  Loader2,
  FileText,
  X,
} from "lucide-react";
import SlideViewer from "../components/SlideViewer";
import SiteHeader from "../components/SiteHeader";
import { useAuth } from "../lib/auth-context";
import { createRequest } from "../lib/requests";
import { clarify, summarize, draft as draftRequest } from "../lib/ai";

const MAX_TOPICS_LENGTH = 500; // backend limit for selectedOption

// Only used if the AI service is unreachable, so the flow never dead-ends.
const fallbackQuestion = {
  question: "Which part of this slide is confusing?",
  options: [
    "The main concept on this slide",
    "How the steps or process work",
    "How to apply it to an example",
  ],
};

export default function Stuck() {
  const navigate = useNavigate();
  const { user, displayName } = useAuth();
  const [showName, setShowName] = useState(false);
  const panelRef = useRef(null);
  const runRef = useRef(0);

  const [selectedSlide, setSelectedSlide] = useState(null);
  const [hasFile, setHasFile] = useState(false);

  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [aiQuestion, setAiQuestion] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiNotice, setAiNotice] = useState("");

  const [extraTopics, setExtraTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState("");

  const [draft, setDraft] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [course, setCourse] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  // Bring the help panel into view when a slide is chosen.
  useEffect(() => {
    if (selectedSlide) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedSlide]);

  async function handleSlideSelected(slide) {
    const run = ++runRef.current;

    setSelectedSlide(slide);
    setSummary("");
    setAiQuestion(null);
    setAiNotice("");
    setExtraTopics([]);
    setSelectedTopics([]);
    setCustomTopic("");
    setDraft("");
    setError("");

    if (!slide.slideText && !slide.slideImage) {
      setAiQuestion(fallbackQuestion);
      setAiNotice(
        "Couldn't read this slide, so the AI can't help with it. Pick a topic or add your own."
      );
      return;
    }

    setLoadingSummary(true);
    setLoadingAI(true);

    // Run the summary and clarification at the same time.
    summarize(slide)
      .then((result) => {
        if (run === runRef.current) setSummary(result.explanation);
      })
      .catch((err) => console.error("Summary failed:", err))
      .finally(() => {
        if (run === runRef.current) setLoadingSummary(false);
      });

    try {
      const result = await clarify(slide);
      if (run === runRef.current) setAiQuestion(result);
    } catch (err) {
      console.error(err);
      if (run === runRef.current) {
        setAiQuestion(fallbackQuestion);
        setAiNotice(`${err.message} Showing general topics instead.`);
      }
    } finally {
      if (run === runRef.current) setLoadingAI(false);
    }
  }

  function toggleTopic(topic) {
    setSelectedTopics((current) =>
      current.includes(topic)
        ? current.filter((t) => t !== topic)
        : [...current, topic]
    );
  }

  function addCustomTopic() {
    const topic = customTopic.trim();
    if (!topic) return;

    const allTopics = [...(aiQuestion?.options ?? []), ...extraTopics];
    if (!allTopics.includes(topic)) {
      setExtraTopics((current) => [...current, topic]);
    }
    setSelectedTopics((current) =>
      current.includes(topic) ? current : [...current, topic]
    );
    setCustomTopic("");
  }

  function removeExtraTopic(topic) {
    setExtraTopics((current) => current.filter((t) => t !== topic));
    setSelectedTopics((current) => current.filter((t) => t !== topic));
  }

  async function handleWriteRequest() {
    if (!selectedTopics.length || loadingDraft) return;

    setError("");
    setLoadingDraft(true);

    const topicsText = selectedTopics.join("; ").slice(0, MAX_TOPICS_LENGTH);

    const fallbackDraft =
      `I'm stuck on slide ${selectedSlide.slideNumber} of ` +
      `"${selectedSlide.pdfTitle}". I don't understand: ${topicsText}. ` +
      `Could someone please explain it to me?`;

    if (!selectedSlide.slideText && !selectedSlide.slideImage) {
      setDraft(fallbackDraft);
      setLoadingDraft(false);
      return;
    }

    try {
      const result = await draftRequest(
        selectedSlide,
        "I'm stuck on this slide. These are the parts I don't understand.",
        topicsText
      );
      setDraft(result.draft);
    } catch (err) {
      console.error(err);
      setError(`${err.message} We wrote a simple draft for you instead.`);
      setDraft(fallbackDraft);
    } finally {
      setLoadingDraft(false);
    }
  }

  async function handlePostRequest() {
    if (!selectedSlide || !draft.trim()) {
      setError("Please write a question before posting.");
      return;
    }
    if (posting) return;

    setPosting(true);
    setError("");

    try {
      const saved = await createRequest({
        title: `Help with slide ${selectedSlide.slideNumber}`,
        course: course.trim() || "General",
        question: draft.trim(),
        slideNumber: selectedSlide.slideNumber,
        pdfTitle: selectedSlide.pdfTitle,
        slideSummary: summary,
        slideText: selectedSlide.slideText,
        slideImage: selectedSlide.slideImage,
        topics: selectedTopics,
        showName: Boolean(user && showName),
      });
      navigate(`/board?request=${saved.id}`);
    } catch (err) {
      console.error(err);
      setError(`Couldn't post your request: ${err.message}`);
      setPosting(false);
    }
  }

  const allTopics = [...(aiQuestion?.options ?? []), ...extraTopics];

  return (
    <div className="min-h-screen bg-[#FBF6EA] text-[#1F1B16]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <h1
          className="mb-3 mt-4 text-4xl font-extrabold sm:text-5xl"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Where are you{" "}
          <span className="bg-[linear-gradient(transparent_62%,#F5B82E_62%)] px-1">
            stuck?
          </span>
        </h1>

        <p className="mb-6 text-lg text-[#4a4338]">
          Open your lecture slides, pick the one that lost you, and we'll help
          you turn it into a question a tutor can answer.
        </p>

        <ol aria-label="Progress" className="mb-8 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            ["Open slides", "Drop or browse a PDF"],
            ["Pick the slide", "Flip to the confusing one"],
            ["Get help", "AI + a peer tutor"],
          ].map(([label, hint], index) => {
            const step = index + 1;
            const current = selectedSlide ? 3 : hasFile ? 2 : 1;
            const done = step < current;
            const active = step === current;
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className={`rounded-xl border-2 border-[#1F1B16] p-2 transition sm:p-3 ${
                  active
                    ? "bg-[#F5B82E] shadow-[3px_3px_0_#1F1B16]"
                    : done
                      ? "bg-[#BFE3C0]"
                      : "bg-white opacity-70"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-extrabold sm:text-base">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#1F1B16] bg-white text-xs">
                    {done ? "✓" : step}
                  </span>
                  {label}
                </span>
                <span className="mt-1 hidden text-xs text-[#4a4338] sm:block">{hint}</span>
              </li>
            );
          })}
        </ol>

        <SlideViewer
          onStuck={handleSlideSelected}
          onFileChange={(nextFile) => {
            // A different (or no) PDF: close the help panel for the old slide.
            setHasFile(Boolean(nextFile));
            setSelectedSlide(null);
            runRef.current += 1;
          }}
        />

        {selectedSlide && (
          <section
            ref={panelRef}
            className="mt-10 scroll-mt-6 rounded-xl border-2 border-[#1F1B16] bg-[#FFF1C7] p-5 shadow-[5px_5px_0_#1F1B16] sm:p-6"
          >
            <p className="text-sm font-bold text-[#665A43]">
              Selected: Slide {selectedSlide.slideNumber} ·{" "}
              {selectedSlide.pdfTitle}
            </p>

            <div className="mb-4 mt-5 flex items-center gap-2">
              <Sparkles size={25} />
              <h2
                className="text-2xl font-extrabold"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Let's figure this out!
              </h2>
            </div>

            {/* 1. Slide in brief */}
            {(loadingSummary || summary) && (
              <div className="mb-6 rounded-lg border-2 border-[#1F1B16] bg-white p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#665A43]">
                  <FileText size={15} />
                  This slide in brief
                </p>

                {loadingSummary ? (
                  <p role="status" className="flex items-center gap-2 text-[#4a4338]">
                    <Loader2 className="animate-spin" size={18} />
                    Summarizing the slide…
                  </p>
                ) : (
                  <p className="leading-relaxed">{summary}</p>
                )}
              </div>
            )}

            {/* 2. What are you stuck on? */}
            {loadingAI && (
              <p
                role="status"
                className="mb-6 flex items-center gap-2 text-lg font-semibold"
              >
                <Loader2 className="animate-spin" size={22} />
                Finding the key ideas on this slide…
              </p>
            )}

            {aiNotice && (
              <p role="alert" className="mb-4 font-medium text-red-700">
                {aiNotice}
              </p>
            )}

            {aiQuestion && (
              <>
                <p className="text-xl font-semibold">
                  {aiQuestion.question}
                </p>
                <p className="mb-5 mt-1 text-sm text-[#665A43]">
                  Pick everything that applies, or add your own topic below.
                </p>

                <div className="space-y-3">
                  {allTopics.map((topic) => {
                    const selected = selectedTopics.includes(topic);
                    const isExtra = extraTopics.includes(topic);

                    return (
                      <div key={topic} className="flex items-stretch gap-2">
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleTopic(topic)}
                          className={`flex min-h-14 w-full items-center gap-3 rounded-lg border-2 border-[#1F1B16] px-5 py-3 text-left font-semibold transition ${
                            selected
                              ? "bg-[#BFE3C0]"
                              : "bg-white hover:bg-[#FBF6EA]"
                          }`}
                        >
                          {selected ? (
                            <CheckCircle2 size={22} className="shrink-0" />
                          ) : (
                            <Circle size={22} className="shrink-0 text-[#665A43]" />
                          )}
                          <span>{topic}</span>
                        </button>

                        {isExtra && (
                          <button
                            type="button"
                            onClick={() => removeExtraTopic(topic)}
                            aria-label={`Remove topic: ${topic}`}
                            className="flex min-w-12 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-white"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <form
                  className="mt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addCustomTopic();
                  }}
                >
                  <label htmlFor="custom-topic" className="block font-semibold">
                    Something else? Add a topic
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="custom-topic"
                      type="text"
                      value={customTopic}
                      onChange={(event) => setCustomTopic(event.target.value)}
                      maxLength={120}
                      placeholder="e.g. How to choose sensors for the shuttle"
                      className="min-w-0 flex-1 rounded-lg border-2 border-[#1F1B16] bg-white p-3"
                    />
                    <button
                      type="submit"
                      disabled={!customTopic.trim()}
                      className="flex items-center gap-1 rounded-lg border-2 border-[#1F1B16] bg-white px-4 font-bold disabled:opacity-50"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </div>
                </form>

                <button
                  type="button"
                  onClick={handleWriteRequest}
                  disabled={!selectedTopics.length || loadingDraft}
                  className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#1F1B16] px-5 py-3 font-bold text-white shadow-[3px_3px_0_#665A43] disabled:opacity-50"
                >
                  {loadingDraft ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Writing your request…
                    </>
                  ) : (
                    <>
                      <Pencil size={19} />
                      {draft ? "Rewrite my request" : "Write my request"}
                      {selectedTopics.length > 0 &&
                        ` (${selectedTopics.length} topic${selectedTopics.length > 1 ? "s" : ""})`}
                    </>
                  )}
                </button>
              </>
            )}

            {/* 3. Draft and post */}
            {(draft || error) && (
              <div className="mt-7 rounded-xl border-2 border-[#1F1B16] bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Pencil size={21} />
                  <h3 className="text-xl font-bold">Your tutoring request</h3>
                </div>

                <p className="mb-5 text-sm text-[#665A43]">
                  AI wrote this draft from your slide and the topics you
                  picked. It can make mistakes, so review and edit it before
                  posting. Tutors will also see the slide itself.
                </p>

                <label htmlFor="course" className="block font-semibold">
                  Course
                </label>

                <input
                  id="course"
                  type="text"
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  maxLength={40}
                  placeholder="e.g. COMP 3710"
                  className="mt-2 w-full rounded-lg border-2 border-[#1F1B16] p-3"
                />

                <label htmlFor="request-draft" className="mt-5 block font-semibold">
                  What do you need help with?
                </label>

                <textarea
                  id="request-draft"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={5}
                  maxLength={2000}
                  disabled={loadingDraft}
                  placeholder="Describe your question..."
                  className="mt-2 w-full resize-y rounded-lg border-2 border-[#1F1B16] p-4"
                />

                <p className="mt-2 text-right text-sm text-[#665A43]">
                  {draft.length}/2000 characters
                </p>

                {error && (
                  <p role="alert" className="mt-3 font-medium text-red-700">
                    {error}
                  </p>
                )}

                {user ? (
                  <label className="mt-4 flex items-center gap-3 font-semibold">
                    <input
                      type="checkbox"
                      checked={showName}
                      onChange={(event) => setShowName(event.target.checked)}
                      className="h-5 w-5 accent-[#1F1B16]"
                    />
                    Post with my name ({displayName})
                  </label>
                ) : (
                  <p className="mt-4 text-sm text-[#665A43]">
                    You'll post anonymously.{" "}
                    <Link to="/signin" state={{ from: "/stuck" }} className="font-semibold underline">
                      Sign in
                    </Link>{" "}
                    to post with your name.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handlePostRequest}
                  disabled={!draft.trim() || loadingDraft || posting}
                  className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-5 py-3 font-bold text-white shadow-[3px_3px_0_#1F1B16] disabled:opacity-50"
                >
                  {posting ? (
                    <Loader2 className="animate-spin" size={19} />
                  ) : (
                    <Send size={19} />
                  )}
                  {posting ? "Posting…" : "Post Request to Board"}
                </button>

                <p className="mt-4 text-center text-xs text-[#665A43]">
                  Your request, the slide image and summary will be visible to
                  StudyHive tutors.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
