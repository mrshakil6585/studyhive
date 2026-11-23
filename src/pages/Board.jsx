
import { useEffect, useState } from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  Send,
  Users,
  FileText,
  HelpCircle,
  Trash2,
} from "lucide-react";

const STORAGE_KEY = "studyhive-demo-requests";

const sampleRequests = [
  {
    id: 1,
    title: "Need help understanding Binary Search",
    course: "COMP 2210",
    slideNumber: 7,
    slideSummary:
      "Binary search finds a value in a sorted list by repeatedly checking the middle element and discarding the half that can't contain the target.",
    topics: ["How the search range is halved each step"],
    question:
      "Can someone explain how binary search finds an element?",
    status: "open",
    messages: [],
  },
  {
    id: 2,
    title: "TCP Three-Way Handshake",
    course: "COMP 3270",
    slideNumber: 12,
    slideSummary:
      "TCP opens a connection with three messages (SYN, SYN-ACK, ACK) so both sides agree on starting sequence numbers.",
    topics: ["What the SYN and ACK flags mean", "Why the sequence numbers increment by one"],
    question:
      "I need a simple example of how the TCP three-way handshake works.",
    status: "open",
    messages: [],
  },
  {
    id: 3,
    title: "Understanding React useState",
    course: "COMP 3540",
    slideNumber: 4,
    slideSummary:
      "useState stores a value between renders and re-renders the component when that value changes.",
    topics: ["Why a normal variable doesn't update the screen"],
    question:
      "Why do we use useState instead of a regular JavaScript variable?",
    status: "accepted",
    messages: [
      {
        id: 1,
        text: "useState lets React remember a value and update the screen.",
        author: "Demo Tutor",
      },
    ],
  },
];

// Load saved requests and include the sample requests.
function loadRequests() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (Array.isArray(saved)) {
      const savedIds = new Set(
        saved.map((request) => String(request.id))
      );

      const missingSamples = sampleRequests.filter(
        (request) => !savedIds.has(String(request.id))
      );

      return [...saved, ...missingSamples];
    }
  } catch (error) {
    console.error("Could not load demo requests:", error);
  }

  return sampleRequests;
}

// Requests posted from the Stuck page in this browser (not the built-in samples).
function isOwnRequest(request) {
  return String(request.id).startsWith("request-");
}

function requestLabel(request) {
  return [
    request.course,
    request.pdfTitle,
    `Slide ${request.slideNumber}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

// Shows tutors the slide the student is stuck on and what they picked.
function SlideContext({ request }) {
  const { slideImage, slideSummary, topics, slideText } = request;

  if (!slideImage && !slideSummary && !topics?.length && !slideText) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4 rounded-xl border-2 border-[#1F1B16] bg-[#FBF6EA] p-4">
      {slideImage && (
        <figure>
          <img
            src={slideImage}
            alt={`Slide ${request.slideNumber}${request.pdfTitle ? ` of ${request.pdfTitle}` : ""}`}
            className="w-full rounded-lg border-2 border-[#1F1B16] bg-white"
          />
          <figcaption className="mt-2 text-xs text-[#665A43]">
            The slide the student is stuck on
          </figcaption>
        </figure>
      )}

      {slideSummary && (
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#665A43]">
            <FileText size={15} />
            Slide in brief
          </p>
          <p className="leading-relaxed">{slideSummary}</p>
        </div>
      )}

      {topics?.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#665A43]">
            <HelpCircle size={15} />
            Stuck on
          </p>
          <ul className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <li
                key={topic}
                className="rounded-full border border-[#1F1B16] bg-white px-3 py-1 text-sm font-semibold"
              >
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {slideText && (
        <details>
          <summary className="cursor-pointer text-sm font-bold">
            Show slide text
          </summary>
          <p className="mt-2 whitespace-pre-line text-sm text-[#4a4338]">
            {slideText}
          </p>
        </details>
      )}
    </div>
  );
}

export default function Board() {
  const [searchParams] = useSearchParams();

  const [requests, setRequests] = useState(loadRequests);
  const [selectedId, setSelectedId] = useState(
    () => searchParams.get("request") || "1"
  );
  const [filter, setFilter] = useState("all");
  const [reply, setReply] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Save changes so they survive a page refresh.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(requests)
      );
    } catch (error) {
      console.error("Could not save demo requests:", error);
    }
  }, [requests]);

  const filteredRequests = requests.filter(
    (request) =>
      filter === "all" || request.status === filter
  );

  const selectedRequest =
    filteredRequests.find(
      (request) =>
        String(request.id) === String(selectedId)
    ) || filteredRequests[0] || null;

  function deleteRequest(id) {
    setRequests((previous) =>
      previous.filter((request) => request.id !== id)
    );
    setConfirmDeleteId(null);
    setReply("");
  }

  function acceptRequest(id) {
    setRequests((previous) =>
      previous.map((request) =>
        request.id === id && request.status === "open"
          ? { ...request, status: "accepted" }
          : request
      )
    );
  }

  function sendReply() {
    const message = reply.trim();

    if (
      !message ||
      !selectedRequest ||
      selectedRequest.status !== "accepted"
    ) {
      return;
    }

    setRequests((previous) =>
      previous.map((request) =>
        request.id === selectedRequest.id
          ? {
              ...request,
              messages: [
                ...request.messages,
                {
                  id: Date.now(),
                  text: message,
                  author: "Demo Tutor",
                },
              ],
            }
          : request
      )
    );

    setReply("");
  }

  return (
    <div className="min-h-screen bg-[#FBF6EA] px-4 py-10 text-[#1F1B16] sm:px-6">
      <main className="mx-auto max-w-6xl">
        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold underline"
          >
            <ArrowLeft size={18} />
            Back to StudyHive
          </Link>

          <Link
            to="/stuck"
            className="rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-4 py-2 font-bold text-white"
          >
            Ask for Help
          </Link>
        </div>

        {/* Header */}
        <div className="mt-10">
          <div className="mb-3 flex items-center gap-3">
            <Users size={32} />

            <h1
              className="text-3xl font-extrabold sm:text-4xl"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              StudyHive Help Board
            </h1>
          </div>

          <p className="text-lg text-[#665A43]">
            See where your classmates need help
            and share what you know.
          </p>

          <p className="mt-3 inline-block rounded-lg bg-[#FFF1C7] px-3 py-2 text-sm font-semibold">
            Demo mode: requests are saved in this browser only.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            { label: "All Requests", value: "all" },
            { label: "Open", value: "open" },
            { label: "Accepted", value: "accepted" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-lg border-2 border-[#1F1B16] px-4 py-2 font-bold ${
                filter === item.value
                  ? "bg-[#BFE3C0]"
                  : "bg-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Requests */}
          <section>
            <h2 className="mb-4 text-xl font-extrabold">
              Tutoring Requests ({filteredRequests.length})
            </h2>

            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(String(request.id));
                    setReply("");
                    setConfirmDeleteId(null);
                  }}
                  className={`w-full rounded-xl border-2 border-[#1F1B16] p-5 text-left transition ${
                    String(selectedRequest?.id) ===
                    String(request.id)
                      ? "bg-[#FFF1C7] shadow-[4px_4px_0_#1F1B16]"
                      : "bg-white hover:bg-[#FFF1C7]"
                  }`}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#665A43]">
                      {requestLabel(request)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        request.status === "open"
                          ? "bg-[#FFE29A]"
                          : "bg-[#BFE3C0]"
                      }`}
                    >
                      {request.status === "open"
                        ? "Open"
                        : "Accepted"}
                    </span>
                  </div>

                  <h3 className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
                    {request.title}
                    {isOwnRequest(request) && (
                      <span className="rounded-full border border-[#1F1B16] bg-white px-2 py-0.5 text-xs font-bold">
                        Your post
                      </span>
                    )}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm text-[#665A43]">
                    {request.question}
                  </p>

                  {request.topics?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {request.topics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full border border-[#1F1B16] bg-white px-3 py-1 text-xs font-semibold"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                    <MessageCircle size={17} />
                    {request.messages.length} replies
                  </div>
                </button>
              ))}

              {filteredRequests.length === 0 && (
                <p className="rounded-xl bg-white p-6 text-[#665A43]">
                  No requests in this category.
                </p>
              )}
            </div>
          </section>

          {/* Selected request */}
          <section>
            <h2 className="mb-4 text-xl font-extrabold">
              Request Details
            </h2>

            {selectedRequest ? (
              <div className="rounded-xl border-2 border-[#1F1B16] bg-white p-5 shadow-[5px_5px_0_#1F1B16] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm font-bold text-[#665A43]">
                    {requestLabel(selectedRequest)}
                  </p>

                  {isOwnRequest(selectedRequest) &&
                    confirmDeleteId !== selectedRequest.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteId(selectedRequest.id)
                        }
                        className="flex items-center gap-1 rounded-lg border-2 border-[#1F1B16] bg-white px-3 py-1 text-sm font-bold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                </div>

                {isOwnRequest(selectedRequest) &&
                  confirmDeleteId === selectedRequest.id && (
                    <div
                      role="alertdialog"
                      aria-labelledby="delete-confirm-text"
                      className="mt-4 rounded-lg border-2 border-red-700 bg-red-50 p-4"
                    >
                      <p id="delete-confirm-text" className="font-bold">
                        Delete this request? Its replies will be
                        deleted too. This can't be undone.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            deleteRequest(selectedRequest.id)
                          }
                          className="flex items-center gap-1 rounded-lg border-2 border-[#1F1B16] bg-red-700 px-4 py-2 font-bold text-white"
                        >
                          <Trash2 size={16} />
                          Yes, delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border-2 border-[#1F1B16] bg-white px-4 py-2 font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                <h3 className="mt-3 text-2xl font-extrabold">
                  {selectedRequest.title}
                </h3>

                <p className="mt-4 leading-relaxed">
                  {selectedRequest.question}
                </p>

                <SlideContext request={selectedRequest} />

                {/* Accept request */}
                {selectedRequest.status === "open" ? (
                  <button
                    type="button"
                    onClick={() =>
                      acceptRequest(selectedRequest.id)
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#BFE3C0] px-4 py-3 font-bold"
                  >
                    <CheckCircle2 size={20} />
                    Accept as Tutor
                  </button>
                ) : (
                  <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-[#BFE3C0] p-3 font-bold">
                    <CheckCircle2 size={20} />
                    Request Accepted
                  </div>
                )}

                {/* Replies */}
                <div className="mt-7 border-t-2 border-[#1F1B16] pt-5">
                  <h4 className="flex items-center gap-2 text-lg font-extrabold">
                    <MessageCircle size={21} />
                    Replies
                  </h4>

                  <div className="mt-4 space-y-3">
                    {selectedRequest.messages.length === 0 ? (
                      <p className="text-sm text-[#665A43]">
                        No replies yet.
                      </p>
                    ) : (
                      selectedRequest.messages.map((message) => (
                        <div
                          key={message.id}
                          className="rounded-lg bg-[#FBF6EA] p-4"
                        >
                          <p className="text-sm font-bold">
                            {message.author}
                          </p>

                          <p className="mt-1">
                            {message.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {selectedRequest.status === "accepted" && (
                    <form
                      className="mt-5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        sendReply();
                      }}
                    >
                      <label
                        htmlFor="tutor-reply"
                        className="block font-bold"
                      >
                        Write a reply
                      </label>

                      <textarea
                        id="tutor-reply"
                        value={reply}
                        onChange={(event) =>
                          setReply(event.target.value)
                        }
                        rows={3}
                        maxLength={2000}
                        placeholder="Help your classmate understand..."
                        className="mt-2 w-full rounded-lg border-2 border-[#1F1B16] p-3"
                      />

                      <button
                        type="submit"
                        disabled={!reply.trim()}
                        className="mt-3 flex items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-5 py-3 font-bold text-white disabled:opacity-50"
                      >
                        <Send size={18} />
                        Send Demo Reply
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-white p-6">
                Select a request to view its details.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
