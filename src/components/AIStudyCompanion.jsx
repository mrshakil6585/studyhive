import { useState } from "react";
import { BookOpen, Loader2, Lightbulb } from "lucide-react";
import { explain } from "../lib/ai";

// AI Study Companion: ask a question about the current slide and get
// an explanation plus an example from the studyhive-ai "explain" action.
// `getSlide` reads the current slide: () => Promise<{ slideNumber, slideText, slideImage }>
export default function AIStudyCompanion({ getSlide, slideNumber }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExplain() {
    if (loading) return;

    setLoading(true);
    setError("");
    setAnswer(null);

    try {
      const slide = await getSlide();

      if (!slide.slideText && !slide.slideImage) {
        setError("Couldn't read this slide. Please try again.");
        return;
      }

      const result = await explain(
        slide,
        question.trim() || "Explain this slide in simple terms."
      );

      setAnswer({ ...result, slideNumber: slide.slideNumber });
    } catch (err) {
      console.error(err);
      setError(err.message || "Couldn't get an explanation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border-2 border-[#1F1B16] bg-[#E3F0FF] p-5 shadow-[5px_5px_0_#1F1B16] sm:p-6">
      <div className="mb-2 flex items-center gap-2">
        <BookOpen size={24} />
        <h2
          className="text-2xl font-extrabold"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          AI Study Companion
        </h2>
      </div>

      <p className="mb-5 text-[#4a4338]">
        Ask anything about slide {slideNumber}. Leave it blank for a simple
        overview.
      </p>

      <label htmlFor="companion-question" className="block font-semibold">
        Your question
      </label>

      <textarea
        id="companion-question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="e.g. Explain this slide with a simple example."
        className="mt-2 w-full resize-y rounded-lg border-2 border-[#1F1B16] bg-white p-4"
      />

      <button
        type="button"
        onClick={handleExplain}
        disabled={loading}
        className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#1F1B16] px-5 py-3 font-bold text-white shadow-[3px_3px_0_#665A43] disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Explaining…
          </>
        ) : (
          <>
            <Lightbulb size={20} />
            Explain with AI
          </>
        )}
      </button>

      {error && (
        <p role="alert" className="mt-4 font-medium text-red-700">
          {error}
        </p>
      )}

      {answer && (
        <div
          aria-live="polite"
          className="mt-6 space-y-5 rounded-xl border-2 border-[#1F1B16] bg-white p-5"
        >
          <div>
            <h3 className="mb-2 text-lg font-bold">Explanation</h3>
            <p className="whitespace-pre-line leading-relaxed">
              {answer.explanation}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-bold">Example</h3>
            <p className="whitespace-pre-line leading-relaxed">
              {answer.example}
            </p>
          </div>

          <p className="text-xs text-[#665A43]">
            AI-generated from slide {answer.slideNumber}. It can make
            mistakes, so check it against your lecture notes.
          </p>
        </div>
      )}
    </section>
  );
}
