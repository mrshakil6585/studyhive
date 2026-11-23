
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  Pencil,
  Send,
} from "lucide-react";
import SlideViewer from "../components/SlideViewer";

const STORAGE_KEY = "studyhive-demo-requests";

const sampleQuestion = {
  question: "Which part of this slide is confusing?",
  options: [
    "I don't understand the main concept",
    "I don't understand how it works",
    "I need an example to understand it",
  ],
};

export default function Stuck() {
  const navigate = useNavigate();

  const [selectedSlide, setSelectedSlide] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [draft, setDraft] = useState("");
  const [course, setCourse] = useState("");
  const [error, setError] = useState("");

  function handleSlideSelected(slide) {
    setSelectedSlide(slide);
    setSelectedOption(null);
    setDraft("");
    setError("");
  }

  function handleOptionSelect(option) {
    setSelectedOption(option);

    let difficulty = "";

    if (option === "I don't understand the main concept") {
      difficulty = "understanding the main concept";
    } else if (option === "I don't understand how it works") {
      difficulty = "understanding how the concept works";
    } else {
      difficulty =
        "understanding this topic without a practical example";
    }

    setDraft(
      `I'm having trouble ${difficulty} on slide ` +
      `${selectedSlide.slideNumber} of ` +
      `"${selectedSlide.pdfTitle}". ` +
      `Could someone please explain it to me?`
    );
  }

  function handlePostRequest() {
    if (!selectedSlide || !draft.trim()) {
      setError("Please write a question before posting.");
      return;
    }

    const request = {
      id: `request-${Date.now()}`,
      title: `Help with slide ${selectedSlide.slideNumber}`,
      course: course.trim() || "General",
      slideNumber: selectedSlide.slideNumber,
      question: draft.trim(),
      status: "open",
      messages: [],
    };

    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      const existing = Array.isArray(saved) ? saved : [];

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([request, ...existing])
      );

      navigate(`/board?request=${request.id}`);
    } catch (err) {
      console.error(err);
      setError("Could not save the demo request.");
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF6EA] px-4 py-10 text-[#1F1B16] sm:px-6">
      <main className="mx-auto max-w-3xl">
        <div className="flex flex-wrap justify-between gap-4">
          <Link to="/" className="font-bold underline">
            ← Back to StudyHive
          </Link>

          <Link to="/board" className="font-bold underline">
            View Tutor Board →
          </Link>
        </div>

        <h1
          className="mb-4 mt-8 text-4xl font-extrabold"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Where are you stuck?
        </h1>

        <p className="mb-8 text-lg text-[#4a4338]">
          Upload your lecture slides and choose the slide
          you need help understanding.
        </p>

        <SlideViewer onStuck={handleSlideSelected} />

        {selectedSlide && (
          <section className="mt-10 rounded-xl border-2 border-[#1F1B16] bg-[#FFF1C7] p-5 shadow-[5px_5px_0_#1F1B16] sm:p-6">

            <p className="text-sm font-bold text-[#665A43]">
              Selected: Slide {selectedSlide.slideNumber}
            </p>

            <p className="mt-1 text-sm text-[#665A43]">
              {selectedSlide.pdfTitle}
            </p>

            <div className="mb-4 mt-7 flex items-center gap-2">
              <Sparkles size={25} />

              <h2
                className="text-2xl font-extrabold"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Let's figure this out!
              </h2>
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#665A43]">
              Sample clarification question
            </p>

            <p className="mb-6 text-xl font-semibold">
              {sampleQuestion.question}
            </p>

            <div className="space-y-3">
              {sampleQuestion.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selectedOption === option}
                  onClick={() => handleOptionSelect(option)}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border-2 border-[#1F1B16] px-5 py-3 text-left font-semibold transition ${
                    selectedOption === option
                      ? "bg-[#BFE3C0]"
                      : "bg-white hover:bg-[#FBF6EA]"
                  }`}
                >
                  <span>{option}</span>

                  {selectedOption === option && (
                    <CheckCircle2
                      size={22}
                      className="shrink-0"
                    />
                  )}
                </button>
              ))}
            </div>

            {selectedOption && (
              <div className="mt-7 rounded-xl border-2 border-[#1F1B16] bg-white p-5">

                <div className="mb-3 flex items-center gap-2">
                  <Pencil size={21} />
                  <h3 className="text-xl font-bold">
                    Your tutoring request
                  </h3>
                </div>

                <p className="mb-5 text-sm text-[#665A43]">
                  Review and edit your question before
                  posting it to the demo board.
                </p>

                <label
                  htmlFor="course"
                  className="block font-semibold"
                >
                  Course
                </label>

                <input
                  id="course"
                  type="text"
                  value={course}
                  onChange={(event) =>
                    setCourse(event.target.value)
                  }
                  maxLength={40}
                  placeholder="e.g. COMP 3270"
                  className="mt-2 w-full rounded-lg border-2 border-[#1F1B16] p-3"
                />

                <label
                  htmlFor="request-draft"
                  className="mt-5 block font-semibold"
                >
                  What do you need help with?
                </label>

                <textarea
                  id="request-draft"
                  value={draft}
                  onChange={(event) =>
                    setDraft(event.target.value)
                  }
                  rows={5}
                  maxLength={2000}
                  placeholder="Describe your question..."
                  className="mt-2 w-full resize-y rounded-lg border-2 border-[#1F1B16] p-4"
                />

                <p className="mt-2 text-right text-sm text-[#665A43]">
                  {draft.length}/2000 characters
                </p>

                {error && (
                  <p
                    role="alert"
                    className="mt-3 font-medium text-red-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handlePostRequest}
                  disabled={!draft.trim()}
                  className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-5 py-3 font-bold text-white shadow-[3px_3px_0_#1F1B16] disabled:opacity-50"
                >
                  <Send size={19} />
                  Post Demo Request to Board
                </button>

                <p className="mt-4 text-center text-xs text-[#665A43]">
                  Demo mode: this request is saved only
                  in your browser, not Supabase.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
