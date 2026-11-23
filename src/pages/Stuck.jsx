
import { useState } from "react";
import { Link } from "react-router-dom";
import SlideViewer from "../components/SlideViewer";

export default function Stuck() {
  const [selectedSlide, setSelectedSlide] = useState(null);

  return (
    <div className="min-h-screen bg-[#FBF6EA] px-6 py-12 text-[#1F1B16]">
      <main className="mx-auto max-w-3xl">
        <Link to="/" className="font-bold underline">
          ← Back to StudyHive
        </Link>

        <h1
          className="mb-4 mt-8 text-4xl font-extrabold"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Where are you stuck?
        </h1>

        <p className="mb-8 text-lg">
          Upload your lecture slides and choose the slide
          you need help understanding.
        </p>

        <SlideViewer onStuck={setSelectedSlide} />

        {selectedSlide && (
          <div className="mt-8 rounded-xl border-2 border-[#1F1B16] bg-[#FFF1C7] p-6">
            <h2 className="text-xl font-bold">
              Slide {selectedSlide.slideNumber} selected!
            </h2>

            <p className="mt-2">
              {selectedSlide.slideText ||
                "No readable text was found on this slide. You'll still be able to enter your question manually."}
            </p>

            <p className="mt-4 text-sm font-bold">
              Next: AI will help clarify your question.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
