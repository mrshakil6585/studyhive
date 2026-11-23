import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  CheckCircle2,
  Send,
  Users,
  FileText,
  HelpCircle,
  Trash2,
  Search,
  X,
  Hand,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import SiteHeader from "../components/SiteHeader";
import { useAuth } from "../lib/auth-context";
import {
  listRequests,
  deleteRequest,
  acceptRequest,
  listMessages,
  sendMessage,
  subscribeToChanges,
} from "../lib/requests";

const display = { fontFamily: "'Fraunces', serif" };

// Text a search can match: course, title, question, PDF, summary and topics.
function searchableText(request) {
  return [
    request.course,
    request.title,
    request.question,
    request.pdfTitle,
    request.slideSummary,
    ...(request.topics ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function requestLabel(request) {
  return [
    request.course,
    request.pdfTitle,
    request.slideNumber ? `Slide ${request.slideNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function timeAgo(iso) {
  if (!iso) return "";
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
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
            alt={`Slide ${request.slideNumber ?? ""}${request.pdfTitle ? ` of ${request.pdfTitle}` : ""}`}
            loading="lazy"
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userId } = useAuth();

  // { items, error, loaded }
  const [board, setBoard] = useState({ items: [], error: "", loaded: false });
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedId, setSelectedId] = useState(() => searchParams.get("request"));
  const [filter, setFilter] = useState(() =>
    ["open", "accepted"].includes(searchParams.get("filter"))
      ? searchParams.get("filter")
      : "all"
  );
  const query = searchParams.get("q") || "";

  // { requestId, items, error } for the selected request's replies
  const [thread, setThread] = useState({ requestId: null, items: [], error: "" });
  const [reply, setReply] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busy, setBusy] = useState(""); // "accept" | "delete" | "send"
  const [actionError, setActionError] = useState("");

  function setQuery(value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("q", value);
    else next.delete("q");
    next.delete("request");
    setSearchParams(next, { replace: true });
  }

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  // Load requests (and reload whenever something changes).
  useEffect(() => {
    let cancelled = false;
    listRequests()
      .then((items) => {
        if (!cancelled) setBoard({ items, error: "", loaded: true });
      })
      .catch((err) => {
        if (!cancelled) {
          setBoard((current) => ({ ...current, error: err.message, loaded: true }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, userId]);

  // Live updates: new requests, accepts, deletes and replies.
  useEffect(() => subscribeToChanges(refresh), [userId]);

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const filteredRequests = board.items.filter(
    (request) =>
      (filter === "all" || request.status === filter) &&
      words.every((word) => searchableText(request).includes(word))
  );

  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedId) ||
    filteredRequests[0] ||
    null;

  const isOwn = Boolean(selectedRequest && userId && selectedRequest.studentId === userId);
  const isTutor = Boolean(selectedRequest && userId && selectedRequest.tutorId === userId);
  const isParticipant = isOwn || isTutor;
  const selectedKey = selectedRequest?.id ?? null;
  const selectedCount = selectedRequest?.messageCount ?? 0;

  // Load replies for the selected request (only the student and tutor can see them).
  useEffect(() => {
    if (!selectedKey || !isParticipant) return undefined;
    let cancelled = false;
    listMessages(selectedKey)
      .then((items) => {
        if (!cancelled) setThread({ requestId: selectedKey, items, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setThread({ requestId: selectedKey, items: [], error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedKey, isParticipant, selectedCount]);

  const threadLoading = isParticipant && thread.requestId !== selectedKey;

  function selectRequest(id) {
    setSelectedId(id);
    setReply("");
    setConfirmDeleteId(null);
    setActionError("");
  }

  async function handleDelete(request) {
    setBusy("delete");
    setActionError("");
    try {
      await deleteRequest(request);
      setConfirmDeleteId(null);
      setBoard((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== request.id),
      }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleAccept(request) {
    setBusy("accept");
    setActionError("");
    try {
      const updated = await acceptRequest(request.id);
      setBoard((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === updated.id ? updated : item)),
      }));
    } catch (err) {
      setActionError(err.message);
      refresh();
    } finally {
      setBusy("");
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    const text = reply.trim();
    if (!text || !selectedRequest) return;

    setBusy("send");
    setActionError("");
    try {
      const message = await sendMessage(selectedRequest.id, text);
      setThread((current) =>
        current.requestId === selectedRequest.id
          ? { ...current, items: [...current.items, message] }
          : current
      );
      setReply("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF6EA] text-[#1F1B16]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        {/* Header */}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Users size={32} />
              <h1 className="text-3xl font-extrabold sm:text-4xl" style={display}>
                StudyHive Help Board
              </h1>
            </div>
            <p className="text-lg text-[#665A43]">
              See where your classmates need help and share what you know.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#BFE3C0] px-3 py-2 text-sm font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2f7a3a] opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2f7a3a]" />
              </span>
              Live: new requests and replies appear automatically
            </p>
          </div>

          <Link
            to="/stuck"
            className="flex min-h-12 items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-5 font-bold text-white shadow-[3px_3px_0_#1F1B16] transition hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Hand size={18} />
            Ask for Help
          </Link>
        </div>

        {/* Search */}
        <div className="mt-8">
          <label htmlFor="board-search" className="sr-only">
            Search requests
          </label>
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#665A43]"
            />
            <input
              id="board-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by course, topic or question"
              className="w-full rounded-lg border-2 border-[#1F1B16] bg-white py-3 pl-10 pr-10 focus:outline-none focus:ring-4 focus:ring-[#F5B82E]/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md hover:bg-[#FBF6EA]"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: "All Requests", value: "all" },
            { label: "Open", value: "open" },
            { label: "Accepted", value: "accepted" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded-lg border-2 border-[#1F1B16] px-4 py-2 font-bold ${
                filter === item.value ? "bg-[#BFE3C0]" : "bg-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {board.error && (
          <div role="alert" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border-2 border-red-700 bg-red-50 p-4 font-medium text-red-800">
            Couldn't load requests: {board.error}
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-1 rounded-lg border-2 border-[#1F1B16] bg-white px-3 py-1 font-bold text-[#1F1B16]"
            >
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        )}

        {/* Main content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Requests */}
          <section>
            <h2 className="mb-4 text-xl font-extrabold">
              Tutoring Requests ({filteredRequests.length})
            </h2>

            {!board.loaded ? (
              <p role="status" className="flex items-center gap-2 rounded-xl bg-white p-6 font-semibold">
                <Loader2 className="animate-spin" size={20} />
                Loading requests…
              </p>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => selectRequest(request.id)}
                    className={`w-full rounded-xl border-2 border-[#1F1B16] p-5 text-left transition ${
                      selectedRequest?.id === request.id
                        ? "bg-[#FFF1C7] shadow-[4px_4px_0_#1F1B16]"
                        : "bg-white hover:-translate-y-0.5 hover:bg-[#FFF1C7] hover:shadow-[3px_3px_0_#1F1B16]"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#665A43]">
                        {requestLabel(request)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          request.status === "open" ? "bg-[#FFE29A]" : "bg-[#BFE3C0]"
                        }`}
                      >
                        {request.status === "open" ? "Open" : "Accepted"}
                      </span>
                    </div>

                    <h3 className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
                      {request.title}
                      {userId && request.studentId === userId && (
                        <span className="rounded-full border border-[#1F1B16] bg-white px-2 py-0.5 text-xs font-bold">
                          Your post
                        </span>
                      )}
                      {userId && request.tutorId === userId && (
                        <span className="rounded-full border border-[#1F1B16] bg-[#BFE3C0] px-2 py-0.5 text-xs font-bold">
                          You're tutoring
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

                    <div className="mt-4 flex items-center justify-between gap-2 text-sm font-bold">
                      <span className="flex items-center gap-2">
                        <MessageCircle size={17} />
                        {request.messageCount} {request.messageCount === 1 ? "reply" : "replies"}
                      </span>
                      <span className="font-medium text-[#665A43]">
                        {timeAgo(request.createdAt)}
                      </span>
                    </div>
                  </button>
                ))}

                {filteredRequests.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-[#1F1B16] bg-white p-6">
                    <p className="font-bold">
                      {query
                        ? `No requests match "${query}" yet.`
                        : filter === "all"
                          ? "No requests yet."
                          : "No requests in this category."}
                    </p>
                    <p className="mt-1 text-[#665A43]">
                      Stuck on something? Be the first to ask.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        to="/stuck"
                        className="rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-4 py-2 font-bold text-white"
                      >
                        Ask for help
                      </Link>
                      {query && (
                        <button
                          type="button"
                          onClick={() => setQuery("")}
                          className="rounded-lg border-2 border-[#1F1B16] bg-white px-4 py-2 font-bold"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Selected request */}
          <section>
            <h2 className="mb-4 text-xl font-extrabold">Request Details</h2>

            {selectedRequest ? (
              <div className="rounded-xl border-2 border-[#1F1B16] bg-white p-5 shadow-[5px_5px_0_#1F1B16] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm font-bold text-[#665A43]">
                    {requestLabel(selectedRequest)}
                  </p>

                  {isOwn && confirmDeleteId !== selectedRequest.id && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedRequest.id)}
                      className="flex items-center gap-1 rounded-lg border-2 border-[#1F1B16] bg-white px-3 py-1 text-sm font-bold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                </div>

                {isOwn && confirmDeleteId === selectedRequest.id && (
                  <div
                    role="alertdialog"
                    aria-labelledby="delete-confirm-text"
                    className="mt-4 rounded-lg border-2 border-red-700 bg-red-50 p-4"
                  >
                    <p id="delete-confirm-text" className="font-bold">
                      Delete this request? Its replies will be deleted too.
                      This can't be undone.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy === "delete"}
                        onClick={() => handleDelete(selectedRequest)}
                        className="flex items-center gap-1 rounded-lg border-2 border-[#1F1B16] bg-red-700 px-4 py-2 font-bold text-white disabled:opacity-60"
                      >
                        {busy === "delete" ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
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

                <h3 className="mt-3 text-2xl font-extrabold">{selectedRequest.title}</h3>

                <p className="mt-1 text-sm text-[#665A43]">
                  Posted by {isOwn ? "you" : selectedRequest.authorName || "an anonymous student"}{" "}
                  · {timeAgo(selectedRequest.createdAt)}
                </p>

                <p className="mt-4 leading-relaxed">{selectedRequest.question}</p>

                <SlideContext request={selectedRequest} />

                {/* Accept */}
                {selectedRequest.status === "open" ? (
                  isOwn ? (
                    <p className="mt-6 rounded-lg bg-[#FFF1C7] p-3 text-center font-semibold">
                      Waiting for a tutor to accept your request…
                    </p>
                  ) : user ? (
                    <button
                      type="button"
                      disabled={busy === "accept"}
                      onClick={() => handleAccept(selectedRequest)}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#BFE3C0] px-4 py-3 font-bold transition hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {busy === "accept" ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <CheckCircle2 size={20} />
                      )}
                      Accept as Tutor
                    </button>
                  ) : (
                    <Link
                      to="/signin"
                      state={{ from: "/board" }}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#F5B82E] px-4 py-3 font-bold"
                    >
                      Sign in to accept as tutor
                    </Link>
                  )
                ) : (
                  <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-[#BFE3C0] p-3 font-bold">
                    <CheckCircle2 size={20} />
                    {isTutor
                      ? "You accepted this request"
                      : `Accepted by ${selectedRequest.tutorName || "a tutor"}`}
                  </div>
                )}

                {actionError && (
                  <p role="alert" className="mt-4 font-medium text-red-700">
                    {actionError}
                  </p>
                )}

                {/* Replies */}
                <div className="mt-7 border-t-2 border-[#1F1B16] pt-5">
                  <h4 className="flex items-center gap-2 text-lg font-extrabold">
                    <MessageCircle size={21} />
                    Replies
                  </h4>

                  {!isParticipant ? (
                    <p className="mt-4 flex items-start gap-2 text-sm text-[#665A43]">
                      <Lock size={16} className="mt-0.5 shrink-0" />
                      Replies are private between the student and their tutor
                      {selectedRequest.messageCount > 0 &&
                        ` (${selectedRequest.messageCount} so far)`}
                      .
                    </p>
                  ) : threadLoading ? (
                    <p role="status" className="mt-4 flex items-center gap-2 text-sm">
                      <Loader2 className="animate-spin" size={16} /> Loading replies…
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3" aria-live="polite">
                      {thread.error && (
                        <p role="alert" className="text-sm font-medium text-red-700">
                          {thread.error}
                        </p>
                      )}
                      {thread.items.length === 0 && !thread.error ? (
                        <p className="text-sm text-[#665A43]">
                          {selectedRequest.status === "accepted"
                            ? "No replies yet. Say hi!"
                            : "Replies open once a tutor accepts."}
                        </p>
                      ) : (
                        thread.items.map((message) => (
                          <div
                            key={message.id}
                            className={`rounded-lg p-4 ${
                              message.senderId === userId
                                ? "ml-6 bg-[#FFF1C7]"
                                : "mr-6 bg-[#FBF6EA]"
                            }`}
                          >
                            <p className="text-sm font-bold">
                              {message.senderId === userId ? "You" : message.author}
                              <span className="ml-2 font-medium text-[#665A43]">
                                {timeAgo(message.createdAt)}
                              </span>
                            </p>
                            <p className="mt-1 whitespace-pre-line">{message.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {isParticipant && selectedRequest.status === "accepted" && (
                    <form className="mt-5" onSubmit={handleSend}>
                      <label htmlFor="tutor-reply" className="block font-bold">
                        Write a reply
                      </label>
                      <textarea
                        id="tutor-reply"
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        rows={3}
                        maxLength={2000}
                        placeholder={
                          isTutor
                            ? "Help your classmate understand..."
                            : "Reply to your tutor..."
                        }
                        className="mt-2 w-full rounded-lg border-2 border-[#1F1B16] p-3"
                      />
                      <button
                        type="submit"
                        disabled={!reply.trim() || busy === "send"}
                        className="mt-3 flex items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-5 py-3 font-bold text-white disabled:opacity-50"
                      >
                        {busy === "send" ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Send size={18} />
                        )}
                        Send Reply
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-white p-6">
                {board.loaded ? "Select a request to view its details." : "Loading…"}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
