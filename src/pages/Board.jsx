import { useEffect, useRef, useState } from "react";
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
  Inbox,
  Sparkles,
  GraduationCap,
  UserRound,
  ImageOff,
  ArrowDownUp,
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
const NEW_FOR_MS = 60 * 60 * 1000;

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

function isNew(request) {
  return request.createdAt && Date.now() - new Date(request.createdAt).getTime() < NEW_FOR_MS;
}

function Avatar({ name, tone = "bg-[#FFF1C7]", size = "h-8 w-8 text-sm" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-[#1F1B16] font-extrabold ${tone} ${size}`}
    >
      {name ? name.charAt(0).toUpperCase() : <UserRound size={15} />}
    </span>
  );
}

function StatTile({ label, value, tone, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex items-center gap-3 rounded-xl border-2 border-[#1F1B16] p-3 text-left transition hover:-translate-y-0.5 sm:p-4 ${tone} ${
        active ? "shadow-[4px_4px_0_#1F1B16]" : "shadow-[2px_2px_0_#1F1B16]"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-white">
        <Icon size={20} />
      </span>
      <span>
        <span className="block text-2xl font-extrabold leading-none" style={display}>
          {value}
        </span>
        <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-[#4a4338]">
          {label}
        </span>
      </span>
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border-2 border-[#1F1B16] bg-white p-4" aria-hidden="true">
      <div className="h-20 w-28 shrink-0 animate-pulse rounded-lg bg-[#EFE7D3]" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-[#EFE7D3]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#EFE7D3]" />
        <div className="h-3 w-full animate-pulse rounded bg-[#EFE7D3]" />
      </div>
    </div>
  );
}

function RequestCard({ request, selected, userId, onSelect }) {
  const open = request.status === "open";
  const mine = userId && request.studentId === userId;
  const tutoring = userId && request.tutorId === userId;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`group relative flex w-full gap-4 overflow-hidden rounded-xl border-2 border-[#1F1B16] p-4 pl-5 text-left transition duration-200 ${
        selected
          ? "-translate-y-0.5 bg-[#FFF1C7] shadow-[5px_5px_0_#1F1B16]"
          : "bg-white hover:-translate-y-1 hover:shadow-[5px_5px_0_#1F1B16]"
      }`}
    >
      {/* Status stripe */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1.5 ${open ? "bg-[#FF6B4A]" : "bg-[#2f7a3a]"}`}
      />

      {/* Slide thumbnail */}
      <span className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 border-[#1F1B16] bg-[#FBF6EA] sm:block">
        {request.slideImage ? (
          <img
            src={request.slideImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[#8a7f6d]">
            <ImageOff size={20} />
          </span>
        )}
        {request.slideNumber && (
          <span className="absolute bottom-1 left-1 rounded bg-[#1F1B16] px-1.5 text-[10px] font-bold text-white">
            Slide {request.slideNumber}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#1F1B16] bg-[#F5B82E] px-2.5 py-0.5 text-xs font-extrabold">
            {request.course}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              open ? "bg-[#FFE29A]" : "bg-[#BFE3C0]"
            }`}
          >
            {open ? "Open" : "Accepted"}
          </span>
          {isNew(request) && (
            <span className="flex items-center gap-1 rounded-full bg-[#FF6B4A] px-2 py-0.5 text-xs font-bold text-white">
              <Sparkles size={11} /> New
            </span>
          )}
          {mine && (
            <span className="rounded-full border border-[#1F1B16] bg-white px-2 py-0.5 text-xs font-bold">
              Your post
            </span>
          )}
          {tutoring && (
            <span className="rounded-full border border-[#1F1B16] bg-[#BFE3C0] px-2 py-0.5 text-xs font-bold">
              You're tutoring
            </span>
          )}
        </span>

        <span className="mt-2 block text-lg font-extrabold leading-snug">{request.title}</span>

        <span className="mt-1 line-clamp-2 block text-sm text-[#4a4338]">{request.question}</span>

        {request.topics?.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {request.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="max-w-full truncate rounded-full border border-[#1F1B16]/40 bg-[#FBF6EA] px-2 py-0.5 text-xs font-semibold"
              >
                {topic}
              </span>
            ))}
            {request.topics.length > 3 && (
              <span className="px-1 text-xs font-semibold text-[#665A43]">
                +{request.topics.length - 3} more
              </span>
            )}
          </span>
        )}

        <span className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={request.authorName} size="h-6 w-6 text-xs" />
            <span className="truncate font-semibold text-[#4a4338]">
              {mine ? "You" : request.authorName || "Anonymous"} · {timeAgo(request.createdAt)}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 font-bold">
            <MessageCircle size={15} />
            {request.messageCount}
          </span>
        </span>
      </span>
    </button>
  );
}

// Shows tutors the slide the student is stuck on and what they picked.
function SlideContext({ request }) {
  const { slideSummary, topics, slideText } = request;
  if (!slideSummary && !topics?.length && !slideText) return null;

  return (
    <div className="mt-5 space-y-4">
      {slideSummary && (
        <div className="rounded-xl border-2 border-[#1F1B16] bg-[#FBF6EA] p-4">
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
                className="rounded-full border-2 border-[#1F1B16] bg-[#FFF1C7] px-3 py-1 text-sm font-semibold"
              >
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {slideText && (
        <details className="group rounded-xl border-2 border-dashed border-[#1F1B16]/50 p-3">
          <summary className="cursor-pointer text-sm font-bold">Show slide text</summary>
          <p className="mt-2 whitespace-pre-line text-sm text-[#4a4338]">{slideText}</p>
        </details>
      )}
    </div>
  );
}

export default function Board() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userId } = useAuth();
  const detailsRef = useRef(null);

  // { items, error, loaded }
  const [board, setBoard] = useState({ items: [], error: "", loaded: false });
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedId, setSelectedId] = useState(() => searchParams.get("request"));
  const [filter, setFilter] = useState(() =>
    ["open", "accepted", "mine"].includes(searchParams.get("filter"))
      ? searchParams.get("filter")
      : "all"
  );
  const [sort, setSort] = useState("newest");
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

  const isMine = (request) =>
    Boolean(userId && (request.studentId === userId || request.tutorId === userId));

  const counts = {
    all: board.items.length,
    open: board.items.filter((r) => r.status === "open").length,
    accepted: board.items.filter((r) => r.status === "accepted").length,
    mine: board.items.filter(isMine).length,
  };

  // Most common courses on the board, for quick filters.
  const courseCounts = board.items.reduce((acc, r) => {
    if (r.course) acc[r.course] = (acc[r.course] || 0) + 1;
    return acc;
  }, {});
  const topCourses = Object.entries(courseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([course]) => course);

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const filteredRequests = board.items
    .filter(
      (request) =>
        (filter === "all" ||
          (filter === "mine" ? isMine(request) : request.status === filter)) &&
        words.every((word) => searchableText(request).includes(word))
    )
    .sort((a, b) =>
      sort === "replies"
        ? b.messageCount - a.messageCount
        : sort === "oldest"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
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
    // On phones the details panel is below the list: bring it into view.
    if (window.matchMedia?.("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
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

  const filterTabs = [
    { label: "All", value: "all" },
    { label: "Open", value: "open" },
    { label: "Accepted", value: "accepted" },
    ...(userId ? [{ label: "Mine", value: "mine" }] : []),
  ];

  return (
    <div
      className="min-h-screen text-[#1F1B16]"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        backgroundColor: "#FBF6EA",
        backgroundImage: "radial-gradient(#1F1B1614 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* Hero */}
        <section className="relative mt-2 overflow-hidden rounded-2xl border-2 border-[#1F1B16] bg-[#1F1B16] p-6 text-[#FBF6EA] shadow-[6px_6px_0_#F5B82E] sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#F5B82E]/20 blur-2xl"
          />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#FBF6EA]/40 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#BFE3C0] opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#BFE3C0]" />
                </span>
                Live board
              </p>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl" style={display}>
                Tutor{" "}
                <span className="text-[#F5B82E]">board</span>
              </h1>
              <p className="mt-2 text-lg text-[#d8cfb9]">
                Classmates are stuck on these slides. Pick one you know and help
                them get it.
              </p>
            </div>

            <Link
              to="/stuck"
              className="flex min-h-12 items-center gap-2 rounded-lg border-2 border-[#FBF6EA] bg-[#FF6B4A] px-5 font-bold text-white shadow-[3px_3px_0_#FBF6EA] transition hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Hand size={18} />
              Ask for help
            </Link>
          </div>
        </section>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile
            label="Open requests"
            value={board.loaded ? counts.open : "–"}
            tone="bg-[#FFE29A]"
            icon={Inbox}
            active={filter === "open"}
            onClick={() => setFilter(filter === "open" ? "all" : "open")}
          />
          <StatTile
            label="Being tutored"
            value={board.loaded ? counts.accepted : "–"}
            tone="bg-[#BFE3C0]"
            icon={GraduationCap}
            active={filter === "accepted"}
            onClick={() => setFilter(filter === "accepted" ? "all" : "accepted")}
          />
          <StatTile
            label="Courses"
            value={board.loaded ? Object.keys(courseCounts).length : "–"}
            tone="bg-white"
            icon={FileText}
            active={false}
            onClick={() => document.getElementById("board-search")?.focus()}
          />
          <StatTile
            label={user ? "Yours" : "Your posts"}
            value={board.loaded ? counts.mine : "–"}
            tone="bg-[#FFF1C7]"
            icon={UserRound}
            active={filter === "mine"}
            onClick={() => userId && setFilter(filter === "mine" ? "all" : "mine")}
          />
        </div>

        {/* Toolbar */}
        <div className="mt-6 rounded-2xl border-2 border-[#1F1B16] bg-white p-4 shadow-[3px_3px_0_#1F1B16]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <label htmlFor="board-search" className="sr-only">
                Search requests
              </label>
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
                className="w-full rounded-lg border-2 border-[#1F1B16] bg-[#FBF6EA] py-3 pl-10 pr-10 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#F5B82E]/60"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md hover:bg-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div
              role="group"
              aria-label="Filter by status"
              className="flex flex-wrap gap-1 rounded-lg border-2 border-[#1F1B16] bg-[#FBF6EA] p-1"
            >
              {filterTabs.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={filter === item.value}
                  onClick={() => setFilter(item.value)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition ${
                    filter === item.value
                      ? "bg-[#1F1B16] text-white"
                      : "hover:bg-white"
                  }`}
                >
                  {item.label}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      filter === item.value ? "bg-[#F5B82E] text-[#1F1B16]" : "bg-white"
                    }`}
                  >
                    {board.loaded ? counts[item.value] : "·"}
                  </span>
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm font-bold">
              <ArrowDownUp size={16} />
              <span className="sr-only">Sort</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-lg border-2 border-[#1F1B16] bg-white px-2 py-2 font-bold"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="replies">Most replies</option>
              </select>
            </label>
          </div>

          {topCourses.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-[#665A43]">
                Courses:
              </span>
              {topCourses.map((course) => {
                const active = query.toLowerCase() === course.toLowerCase();
                return (
                  <button
                    key={course}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setQuery(active ? "" : course)}
                    className={`rounded-full border-2 border-[#1F1B16] px-3 py-1 text-sm font-bold transition hover:-translate-y-0.5 ${
                      active ? "bg-[#F5B82E] shadow-[2px_2px_0_#1F1B16]" : "bg-white"
                    }`}
                  >
                    {course}
                    <span className="ml-1.5 text-xs text-[#665A43]">{courseCounts[course]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {board.error && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border-2 border-red-700 bg-red-50 p-4 font-medium text-red-800"
          >
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
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Requests */}
          <section aria-labelledby="requests-heading">
            <h2 id="requests-heading" className="mb-3 flex items-center gap-2 text-xl font-extrabold">
              <Users size={20} />
              {filter === "mine" ? "Your requests" : "Requests"}
              <span className="text-[#665A43]">({filteredRequests.length})</span>
            </h2>

            {!board.loaded ? (
              <div className="space-y-4" role="status" aria-label="Loading requests">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    userId={userId}
                    selected={selectedRequest?.id === request.id}
                    onSelect={() => selectRequest(request.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-[#1F1B16] bg-white p-8 text-center">
                <div className="relative mx-auto h-20 w-24" aria-hidden="true">
                  <div className="absolute left-0 top-2 h-16 w-20 -rotate-6 rounded-lg border-2 border-[#1F1B16] bg-[#BFE3C0]" />
                  <div className="absolute left-3 top-0 flex h-16 w-20 rotate-3 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-[#FFF1C7]">
                    <Inbox size={26} />
                  </div>
                </div>
                <p className="mt-4 text-xl font-extrabold" style={display}>
                  {query
                    ? `Nothing matches "${query}" yet`
                    : filter === "all"
                      ? "The board is empty"
                      : filter === "mine"
                        ? "Nothing of yours here yet"
                        : "No requests in this category"}
                </p>
                <p className="mt-1 text-[#665A43]">Stuck on a slide? Be the first to ask.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/stuck"
                    className="flex items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] px-4 py-2 font-bold text-white shadow-[3px_3px_0_#1F1B16]"
                  >
                    <Hand size={16} /> Ask for help
                  </Link>
                  {(query || filter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setFilter("all");
                      }}
                      className="rounded-lg border-2 border-[#1F1B16] bg-white px-4 py-2 font-bold"
                    >
                      Show everything
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Selected request */}
          <section
            ref={detailsRef}
            aria-label="Request details"
            className="scroll-mt-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pb-2 lg:pr-2"
          >
            {selectedRequest ? (
              <article className="overflow-hidden rounded-2xl border-2 border-[#1F1B16] bg-white shadow-[6px_6px_0_#1F1B16]">
                {/* Slide header */}
                {selectedRequest.slideImage ? (
                  <figure className="relative border-b-2 border-[#1F1B16] bg-[#FBF6EA]">
                    <img
                      src={selectedRequest.slideImage}
                      alt={`Slide ${selectedRequest.slideNumber ?? ""}${
                        selectedRequest.pdfTitle ? ` of ${selectedRequest.pdfTitle}` : ""
                      }`}
                      className="max-h-80 w-full object-contain"
                    />
                    <figcaption className="absolute bottom-2 left-2 rounded-md border-2 border-[#1F1B16] bg-white px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0_#1F1B16]">
                      {requestLabel(selectedRequest) || "Slide"}
                    </figcaption>
                  </figure>
                ) : (
                  <div className="flex items-center gap-2 border-b-2 border-[#1F1B16] bg-[#FBF6EA] px-5 py-3 text-sm font-semibold text-[#665A43]">
                    <ImageOff size={16} />
                    {requestLabel(selectedRequest) || "No slide image"}
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#1F1B16] bg-[#F5B82E] px-2.5 py-0.5 text-xs font-extrabold">
                        {selectedRequest.course}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          selectedRequest.status === "open" ? "bg-[#FFE29A]" : "bg-[#BFE3C0]"
                        }`}
                      >
                        {selectedRequest.status === "open" ? "Open" : "Accepted"}
                      </span>
                    </div>

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

                  <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl" style={display}>
                    {selectedRequest.title}
                  </h2>

                  <div className="mt-3 flex items-center gap-2 text-sm text-[#665A43]">
                    <Avatar name={isOwn ? "You" : selectedRequest.authorName} />
                    <span>
                      <span className="font-bold text-[#1F1B16]">
                        {isOwn ? "You" : selectedRequest.authorName || "Anonymous student"}
                      </span>{" "}
                      · {timeAgo(selectedRequest.createdAt)}
                    </span>
                  </div>

                  <blockquote className="mt-4 rounded-xl border-l-4 border-[#FF6B4A] bg-[#FFF8E6] p-4 text-lg leading-relaxed">
                    {selectedRequest.question}
                  </blockquote>

                  <SlideContext request={selectedRequest} />

                  {/* Accept */}
                  {selectedRequest.status === "open" ? (
                    isOwn ? (
                      <p className="mt-6 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1F1B16] bg-[#FFF1C7] p-3 text-center font-semibold">
                        <Loader2 className="animate-spin" size={18} />
                        Waiting for a tutor to accept your request…
                      </p>
                    ) : user ? (
                      <button
                        type="button"
                        disabled={busy === "accept"}
                        onClick={() => handleAccept(selectedRequest)}
                        className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1F1B16] bg-[#BFE3C0] px-4 text-lg font-bold shadow-[4px_4px_0_#1F1B16] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1F1B16] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
                      >
                        {busy === "accept" ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <CheckCircle2 size={20} />
                        )}
                        I can help: accept as tutor
                      </button>
                    ) : (
                      <Link
                        to="/signin"
                        state={{ from: "/board" }}
                        className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1F1B16] bg-[#F5B82E] px-4 text-lg font-bold shadow-[4px_4px_0_#1F1B16] transition hover:-translate-y-0.5"
                      >
                        Sign in to accept as tutor
                      </Link>
                    )
                  ) : (
                    <div className="mt-6 flex items-center gap-3 rounded-xl border-2 border-[#1F1B16] bg-[#BFE3C0] p-3">
                      <Avatar
                        name={isTutor ? "You" : selectedRequest.tutorName}
                        tone="bg-white"
                      />
                      <span className="font-bold">
                        {isTutor
                          ? "You're tutoring this request"
                          : `${selectedRequest.tutorName || "A tutor"} is helping`}
                        {selectedRequest.acceptedAt && (
                          <span className="block text-sm font-medium text-[#2b4a2e]">
                            Accepted {timeAgo(selectedRequest.acceptedAt)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {actionError && (
                    <p role="alert" className="mt-4 font-medium text-red-700">
                      {actionError}
                    </p>
                  )}

                  {/* Replies */}
                  <div className="mt-7 border-t-2 border-[#1F1B16] pt-5">
                    <h3 className="flex items-center gap-2 text-lg font-extrabold">
                      <MessageCircle size={21} />
                      Conversation
                    </h3>

                    {!isParticipant ? (
                      <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#FBF6EA] p-4 text-sm text-[#665A43]">
                        <Lock size={16} className="mt-0.5 shrink-0" />
                        <span>
                          Replies are private between the student and their tutor
                          {selectedRequest.messageCount > 0 &&
                            ` (${selectedRequest.messageCount} so far)`}
                          .
                        </span>
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
                          <p className="rounded-xl bg-[#FBF6EA] p-4 text-sm text-[#665A43]">
                            {selectedRequest.status === "accepted"
                              ? "No replies yet. Say hi!"
                              : "The conversation opens once a tutor accepts."}
                          </p>
                        ) : (
                          thread.items.map((message) => {
                            const fromMe = message.senderId === userId;
                            return (
                              <div
                                key={message.id}
                                className={`flex items-end gap-2 ${fromMe ? "flex-row-reverse" : ""}`}
                              >
                                <Avatar
                                  name={fromMe ? "You" : message.author}
                                  tone={fromMe ? "bg-[#FFF1C7]" : "bg-[#BFE3C0]"}
                                  size="h-7 w-7 text-xs"
                                />
                                <div
                                  className={`max-w-[80%] rounded-2xl border-2 border-[#1F1B16] px-4 py-2 ${
                                    fromMe
                                      ? "rounded-br-sm bg-[#FFF1C7]"
                                      : "rounded-bl-sm bg-white"
                                  }`}
                                >
                                  <p className="text-xs font-bold text-[#665A43]">
                                    {fromMe ? "You" : message.author} ·{" "}
                                    {timeAgo(message.createdAt)}
                                  </p>
                                  <p className="mt-0.5 whitespace-pre-line">{message.text}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {isParticipant && selectedRequest.status === "accepted" && (
                      <form className="mt-5" onSubmit={handleSend}>
                        <label htmlFor="tutor-reply" className="sr-only">
                          Write a reply
                        </label>
                        <div className="flex items-end gap-2 rounded-xl border-2 border-[#1F1B16] bg-white p-2 focus-within:ring-4 focus-within:ring-[#F5B82E]/60">
                          <textarea
                            id="tutor-reply"
                            value={reply}
                            onChange={(event) => setReply(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                                handleSend(event);
                              }
                            }}
                            rows={2}
                            maxLength={2000}
                            placeholder={
                              isTutor
                                ? "Help your classmate understand..."
                                : "Reply to your tutor..."
                            }
                            className="min-h-12 flex-1 resize-y bg-transparent p-2 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!reply.trim() || busy === "send"}
                            aria-label="Send reply"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-[#FF6B4A] text-white disabled:opacity-50"
                          >
                            {busy === "send" ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Send size={18} />
                            )}
                          </button>
                        </div>
                        <p className="mt-1 text-right text-xs text-[#665A43]">
                          Ctrl/⌘ + Enter to send
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </article>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-[#1F1B16] bg-white p-8 text-center text-[#665A43]">
                {board.loaded ? "Select a request to see the slide and details." : "Loading…"}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
