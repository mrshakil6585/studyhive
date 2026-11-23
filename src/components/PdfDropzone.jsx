import { useRef } from "react";
import { FileUp, MousePointerClick, ShieldCheck, Sparkles } from "lucide-react";

const display = { fontFamily: "'Fraunces', serif" };

// Empty-state upload area. Drops are handled for the whole page by SlideViewer;
// `dragging` is true while a file is being dragged over the window.
// `onFile(files)` receives files chosen with the Browse button.
export default function PdfDropzone({ onFile, error, dragging = false }) {
  const inputRef = useRef(null);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-[3px] border-dashed p-6 transition-all duration-200 sm:p-10 ${
        dragging
          ? "scale-[1.01] border-[#FF6B4A] bg-[#FFF1C7] shadow-[8px_8px_0_#1F1B16]"
          : "border-[#1F1B16] bg-white shadow-[5px_5px_0_#1F1B16]"
      }`}
    >
      {/* Soft dotted background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(#1F1B1614 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
        {/* Illustration: a little stack of slides */}
        <div aria-hidden="true" className="relative mx-auto h-48 w-56 sm:h-56 sm:w-64">
          <div
            className={`absolute left-2 top-6 h-36 w-48 rounded-xl border-2 border-[#1F1B16] bg-[#BFE3C0] shadow-[4px_4px_0_#1F1B16] transition-transform duration-300 sm:w-52 ${
              dragging ? "-rotate-12 -translate-x-3" : "-rotate-6"
            }`}
          />
          <div
            className={`absolute left-6 top-3 h-36 w-48 rounded-xl border-2 border-[#1F1B16] bg-[#FFF1C7] shadow-[4px_4px_0_#1F1B16] transition-transform duration-300 sm:w-52 ${
              dragging ? "rotate-6 translate-x-3" : "rotate-3"
            }`}
          />
          <div
            className={`absolute left-4 top-0 h-36 w-48 rounded-xl border-2 border-[#1F1B16] bg-white p-3 shadow-[4px_4px_0_#1F1B16] transition-transform duration-300 sm:w-52 ${
              dragging ? "-translate-y-3" : ""
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7f6d]">
              Lecture 2 · Slide 4
            </p>
            <p className="mt-1 text-sm font-extrabold" style={display}>
              Bus Topology
            </p>
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-[#EFE7D3]" />
              <div className="h-1.5 w-4/5 rounded bg-[#EFE7D3]" />
              <div className="h-1.5 w-3/5 rounded bg-[#EFE7D3]" />
            </div>
            <div className="mt-3 flex gap-1.5">
              <div className="h-6 w-8 rounded border border-[#1F1B16] bg-[#FBF6EA]" />
              <div className="h-6 w-8 rounded border border-[#1F1B16] bg-[#FBF6EA]" />
              <div className="h-6 w-8 rounded border border-[#1F1B16] bg-[#FBF6EA]" />
            </div>
          </div>
          <span
            className={`absolute -right-1 bottom-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1F1B16] bg-[#FF6B4A] text-white shadow-[3px_3px_0_#1F1B16] transition-transform duration-300 ${
              dragging ? "scale-110 animate-bounce" : ""
            }`}
          >
            <FileUp size={26} />
          </span>
        </div>

        {/* Copy and actions */}
        <div className="text-center md:text-left">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border-2 border-[#1F1B16] bg-[#BFE3C0] px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Sparkles size={13} /> Step 1
          </p>

          <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl" style={display}>
            {dragging ? "Drop it right here!" : "Drop your lecture PDF"}
          </h2>

          <p className="mt-3 text-[#4a4338]">
            {dragging
              ? "Let go to open your slides."
              : "Drag a PDF from your computer onto this box, anywhere on the page, or browse for it."}
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-12 items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-6 text-lg font-bold text-white shadow-[4px_4px_0_#1F1B16] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1F1B16] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <MousePointerClick size={20} />
              Browse files
            </button>
            <span className="text-sm font-semibold text-[#665A43]">
              PDF only · up to 50 MB
            </span>
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-[#665A43] md:justify-start">
            <ShieldCheck size={16} className="shrink-0" />
            Your PDF stays on your device. Only slides you ask the AI about or
            post are sent.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border-2 border-red-700 bg-red-50 px-3 py-2 font-medium text-red-800"
            >
              {error}
            </p>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length) onFile(files);
            }}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
