import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  Hand,
  FileText,
  RefreshCw,
  FileUp,
  Loader2,
} from "lucide-react";
import AIStudyCompanion from "./AIStudyCompanion";
import PdfDropzone from "./PdfDropzone";

// Configure the PDF.js worker.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_THUMBNAILS = 120;

function isPdf(file) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hasFiles(event) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

export default function SlideViewer({ onStuck, onFileChange }) {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(600);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pageDragging, setPageDragging] = useState(false);

  const containerRef = useRef(null);
  const pdfRef = useRef(null);
  const inputRef = useRef(null);
  const thumbsRef = useRef(null);

  // Automatically resize slides for mobile screens.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(200, Math.floor(entry.contentRect.width - 8)));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [file]);

  // Accept a list of files (from drop or picker) and open the first PDF.
  function acceptFiles(files) {
    const pdf = files.find(isPdf);

    if (!pdf) {
      setError("That isn't a PDF. Please choose a .pdf file of your lecture slides.");
      return;
    }
    if (pdf.size > MAX_BYTES) {
      setError(`That PDF is ${formatSize(pdf.size)}. Please use one under 50 MB.`);
      return;
    }

    setFile(pdf);
    setPage(1);
    setNumPages(0);
    setError(
      files.length > 1 ? `Opened "${pdf.name}". You can only open one PDF at a time.` : ""
    );
    pdfRef.current = null;
    onFileChange?.(pdf);
  }

  // Keep the window drop handler pointed at the latest acceptFiles.
  const acceptFilesRef = useRef(acceptFiles);
  useEffect(() => {
    acceptFilesRef.current = acceptFiles;
  });

  // Drop a PDF anywhere on the page (also replaces an open one).
  useEffect(() => {
    let depth = 0;

    const onEnter = (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setPageDragging(true);
    };
    const onOver = (event) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onLeave = (event) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setPageDragging(false);
    };
    const onDrop = (event) => {
      if (!hasFiles(event)) return;
      // Stop the browser from opening the PDF in the tab.
      event.preventDefault();
      depth = 0;
      setPageDragging(false);
      const files = Array.from(event.dataTransfer.files ?? []);
      if (files.length) acceptFilesRef.current(files);
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  // Left/right arrow keys change slides (unless typing in a field).
  useEffect(() => {
    if (!numPages) return undefined;
    const onKey = (event) => {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) return;
      if (event.key === "ArrowRight") setPage((p) => Math.min(numPages, p + 1));
      if (event.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages]);

  // Keep the current thumbnail in view.
  useEffect(() => {
    thumbsRef.current
      ?.querySelector(`[data-page="${page}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [page]);

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

    // The image lets the AI read diagrams and text that is part of a picture.
    const slideImage = await captureSlideImage();

    return {
      slideNumber: page,
      slideText,
      slideImage,
      pdfTitle: file.name,
    };
  }

  // Render the current slide to a JPEG (sent to the AI and shown to tutors).
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
      onStuck?.(slide);
    } catch (err) {
      console.error(err);
      setError("Couldn't read this slide. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const progress = numPages ? (page / numPages) * 100 : 0;
  const thumbCount = Math.min(numPages, MAX_THUMBNAILS);

  return (
    <div className="w-full" ref={containerRef}>
      {/* Full-page drop overlay */}
      {pageDragging && file && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#1F1B16]/40 p-6 backdrop-blur-[2px]"
        >
          <div className="rounded-2xl border-[3px] border-dashed border-[#1F1B16] bg-[#FFF1C7] px-10 py-8 text-center shadow-[8px_8px_0_#1F1B16]">
            <FileUp size={44} className="mx-auto animate-bounce" />
            <p
              className="mt-3 text-3xl font-extrabold"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Drop to open a different PDF
            </p>
            <p className="mt-1 font-semibold text-[#4a4338]">PDF only · up to 50 MB</p>
          </div>
        </div>
      )}

      {!file ? (
        <PdfDropzone onFile={acceptFiles} error={error} dragging={pageDragging} />
      ) : (
        <div>
          {/* File bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#1F1B16] bg-white p-3 shadow-[3px_3px_0_#1F1B16]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] text-white">
                <FileText size={22} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{file.name}</p>
                <p className="text-sm text-[#665A43]">
                  {numPages ? `${numPages} slides` : "Opening…"} · {formatSize(file.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-10 items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FBF6EA] px-3 font-bold transition hover:bg-[#FFF1C7]"
            >
              <RefreshCw size={16} />
              Change PDF
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (files.length) acceptFiles(files);
              }}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          <Document
            file={file}
            onLoadSuccess={(pdf) => {
              pdfRef.current = pdf;
              setNumPages(pdf.numPages);
            }}
            onLoadError={() => {
              setError(
                "Couldn't open that PDF. It may be damaged or password-protected. Try another file."
              );
              setFile(null);
              onFileChange?.(null);
            }}
            loading={
              <div className="flex h-72 items-center justify-center gap-2 rounded-xl border-2 border-[#1F1B16] bg-white font-semibold shadow-[5px_5px_0_#1F1B16]">
                <Loader2 className="animate-spin" size={22} />
                Opening your slides…
              </div>
            }
          >
            {/* Current slide */}
            <div className="flex justify-center overflow-hidden rounded-xl border-2 border-[#1F1B16] bg-white p-1 shadow-[5px_5px_0_#1F1B16]">
              <Page
                pageNumber={page}
                width={Math.min(width, 720)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div className="flex h-72 items-center justify-center gap-2 font-semibold">
                    <Loader2 className="animate-spin" size={20} />
                    Loading slide…
                  </div>
                }
              />
            </div>

            {/* Navigation */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous slide"
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-white shadow-[2px_2px_0_#1F1B16] transition hover:bg-[#FFF1C7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-40"
              >
                <ChevronLeft />
              </button>

              <div className="flex-1 text-center">
                <p className="font-bold" aria-live="polite">
                  Slide {page} of {numPages || "…"}
                </p>
                <div
                  className="mx-auto mt-2 h-2 max-w-xs overflow-hidden rounded-full border border-[#1F1B16] bg-white"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-[#F5B82E] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 hidden text-xs text-[#665A43] sm:block">
                  Tip: use ← → keys to flip slides
                </p>
              </div>

              <button
                type="button"
                disabled={!numPages || page >= numPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next slide"
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-white shadow-[2px_2px_0_#1F1B16] transition hover:bg-[#FFF1C7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-40"
              >
                <ChevronRight />
              </button>
            </div>

            {/* Thumbnails */}
            {thumbCount > 1 && (
              <div
                ref={thumbsRef}
                role="list"
                aria-label="All slides"
                className="mt-5 flex gap-3 overflow-x-auto px-1 pb-3 pt-2"
              >
                {Array.from({ length: thumbCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="listitem"
                    data-page={n}
                    aria-label={`Go to slide ${n}`}
                    aria-current={n === page ? "true" : undefined}
                    onClick={() => setPage(n)}
                    className={`relative shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                      n === page
                        ? "-translate-y-1 border-[#FF6B4A] shadow-[3px_3px_0_#1F1B16]"
                        : "border-[#1F1B16] opacity-80 hover:-translate-y-0.5 hover:opacity-100"
                    }`}
                  >
                    <Page
                      pageNumber={n}
                      width={112}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={<div className="h-16 w-28 animate-pulse bg-[#EFE7D3]" />}
                    />
                    <span
                      className={`absolute bottom-1 right-1 rounded px-1.5 text-xs font-bold text-white ${
                        n === page ? "bg-[#FF6B4A]" : "bg-[#1F1B16]"
                      }`}
                    >
                      {n}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Document>

          <button
            type="button"
            onClick={handleStuck}
            disabled={!numPages || busy}
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-5 text-lg font-bold text-white shadow-[4px_4px_0_#1F1B16] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1F1B16] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
          >
            {busy ? <Loader2 className="animate-spin" size={22} /> : <Hand size={22} />}
            {busy ? "Reading slide..." : `I'm stuck on slide ${page}`}
          </button>

          {error && (
            <p role="alert" className="mt-4 font-medium text-red-700">
              {error}
            </p>
          )}

          {numPages > 0 && (
            <AIStudyCompanion
              key={`${file.name}-${page}`}
              getSlide={readCurrentSlide}
              slideNumber={page}
            />
          )}
        </div>
      )}
    </div>
  );
}
