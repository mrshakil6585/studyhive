// Demo storage for tutoring requests (browser localStorage only).
export const STORAGE_KEY = "studyhive-demo-requests";

export const sampleRequests = [
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
export function loadRequests() {
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


export function saveRequests(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}
