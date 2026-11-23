
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  Hand,
} from "lucide-react";
import AIStudyCompanion from "./AIStudyCompanion";

// Configure the PDF.js worker.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function SlideViewer({ onStuck }) {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(600);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const containerRef = useRef(null);
  const pdfRef = useRef(null);

  // Automatically resize slides for mobile screens.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(200, Math.floor(entry.contentRect.width - 8)));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [file]);

  function handleUpload(event) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
    setPage(1);
    setNumPages(0);
    setError("");
    pdfRef.current = null;
  }

  // Extract the text of the slide currently on screen.
  async function readCurrentSlide() {
    if (!pdfRef.current) {
      throw new Error("The PDF is still loading. Please wait a moment.");
    }

    const selectedPage = await pdfRef.current.getPage(page);
    const content = await selectedPage.getTextContent();

    const slideText = content.items
      .map((item) => item.str || "")
      .join(" ")
      .trim();

    return {
      slideNumber: page,
      slideText,
      pdfTitle: file.name,
    };
  }

  // Render the current slide to a small JPEG so tutors can see it on the board.
  async function captureSlideImage() {
    try {
      const pdfPage = await pdfRef.current.getPage(page);
      const base = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: 900 / base.width });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await pdfPage.render({
        canvasContext: canvas.getContext("2d"),
        viewport,
      }).promise;

      return canvas.toDataURL("image/jpeg", 0.72);
    } catch (err) {
      console.error("Couldn't capture slide image:", err);
      return null;
    }
  }

  async function handleStuck() {
    if (!pdfRef.current || busy) return;

    setBusy(true);
    setError("");

    try {
      const slide = await readCurrentSlide();
      slide.slideImage = await captureSlideImage();

      onStuck?.(slide);
    } catch (err) {
      console.error(err);
      setError("Couldn't read this slide. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full" ref={containerRef}>
      {!file ? (
        <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#1F1B16] bg-white p-8 text-center">
          <Upload size={38} />

          <span className="text-xl font-bold">
            Upload your lecture PDF
          </span>

          <span className="text-sm text-[#4a4338]">
            Choose a PDF file from your computer.
          </span>

          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleUpload}
            className="sr-only"
          />
        </label>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-full truncate font-bold">
              {file.name}
            </p>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setNumPages(0);
                setError("");
                pdfRef.current = null;
              }}
              className="font-bold underline"
            >
              Change PDF
            </button>
          </div>

          <div className="flex justify-center overflow-hidden rounded-xl border-2 border-[#1F1B16] bg-white p-1 shadow-[5px_5px_0_#1F1B16]">
            <Document
              file={file}
              onLoadSuccess={(pdf) => {
                pdfRef.current = pdf;
                setNumPages(pdf.numPages);
                setError("");
              }}
              onLoadError={() => {
                setError("Couldn't open the PDF. Try another file.");
              }}
              loading={
                <p className="p-8">Loading your slides...</p>
              }
            >
              <Page
                pageNumber={page}
                width={Math.min(width, 720)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <p className="p-8">Loading slide...</p>
                }
              />
            </Document>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous slide"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-white disabled:opacity-40"
            >
              <ChevronLeft />
            </button>

            <span className="font-bold">
              Slide {page} of {numPages || "..."}
            </span>

            <button
              type="button"
              disabled={!numPages || page >= numPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next slide"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-white disabled:opacity-40"
            >
              <ChevronRight />
            </button>
          </div>

          <button
            type="button"
            onClick={handleStuck}
            disabled={!numPages || busy}
            className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-5 text-lg font-bold text-white shadow-[4px_4px_0_#1F1B16] disabled:opacity-50"
          >
            <Hand size={22} />
            {busy ? "Reading slide..." : "I'm stuck on this slide"}
          </button>

          {numPages > 0 && (
            <AIStudyCompanion
              key={`${file.name}-${page}`}
              getSlide={readCurrentSlide}
              slideNumber={page}
            />
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
