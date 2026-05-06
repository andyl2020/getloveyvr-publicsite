export const POLL_VOTED_STORAGE_KEY = "glyvr_voted";
export const POLL_SESSION_STORAGE_KEY = "glyvr_session_id";
export const BRING_BACK_OPTION_ID = "bring_back";

export const POLL_OPTIONS = [
  {
    id: "ikea",
    emoji: "🛒",
    label: "IKEA Singles Event",
    description: "browse, vibe, maybe find someone in the kitchen aisle",
  },
  {
    id: "costco",
    emoji: "🛒",
    label: "Costco Singles Event",
    description: "free samples + good energy",
  },
  {
    id: BRING_BACK_OPTION_ID,
    emoji: "🔁",
    label: "Bring Back a Past Event",
    description: "select to choose below",
  },
  {
    id: "ages_35_45",
    emoji: "👥",
    label: "A Series for Ages 35–45",
    description: "",
  },
  {
    id: "ages_45_plus",
    emoji: "👥",
    label: "A Series for Ages 45+",
    description: "",
  },
] as const;

export const BRING_BACK_OPTIONS = [
  {
    id: "boxing",
    label: "Boxing Singles Night",
    emoji: "🥊",
  },
  {
    id: "improv",
    label: "Improv Night",
    emoji: "🎭",
  },
] as const;

export type PollOptionId = (typeof POLL_OPTIONS)[number]["id"];
export type BringBackOptionId = (typeof BRING_BACK_OPTIONS)[number]["id"];

export interface EventVoteRecord {
  option: string;
  bringBackPick: string | null;
  writeIn: string | null;
}

export type PollVoteCounts = Record<PollOptionId, number>;

export function createEmptyVoteCounts(): PollVoteCounts {
  return Object.fromEntries(POLL_OPTIONS.map((option) => [option.id, 0])) as PollVoteCounts;
}

export function buildVoteResults(votes: EventVoteRecord[]) {
  const counts = createEmptyVoteCounts();
  let total = 0;

  for (const vote of votes) {
    if (!(vote.option in counts)) {
      continue;
    }

    counts[vote.option as PollOptionId] += 1;
    total += 1;
  }

  return {
    counts,
    total,
  };
}

export function getVotePercentage(count: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

export function generatePollSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `glyvr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function hashPollSessionId(sessionId: string) {
  if (
    typeof crypto === "undefined" ||
    typeof crypto.subtle === "undefined" ||
    typeof TextEncoder === "undefined"
  ) {
    return sessionId;
  }

  const bytes = new TextEncoder().encode(sessionId);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function formatBringBackChoice(choice: string | null | undefined) {
  const match = BRING_BACK_OPTIONS.find((option) => option.id === choice);
  return match ? `${match.emoji} ${match.label}` : "";
}
