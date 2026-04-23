export interface EventScheduleEntry {
  id: number;
  slug: string;
  shareSlug: string;
  seriesNumber: number;
  title: string;
  boardTheme: string;
  eventDate: string;
  time?: string;
  joinUrl?: string;
  publicJoinEnabled?: boolean;
  emoji: string;
  colorClass: string;
  tentative?: boolean;
  defaultOwner?: string;
}

export const DEFAULT_EVENT_SCHEDULE: EventScheduleEntry[] = [
  {
    id: 1,
    slug: "boxing",
    shareSlug: "e1-boxing",
    seriesNumber: 1,
    title: "Boxing",
    boardTheme: "Boxing",
    eventDate: "2026-04-26",
    joinUrl: "https://flocksocial.app/e/get-love-yvr-ep-1-rumble-boxing-da3470",
    emoji: "\u{1F94A}",
    colorClass: "bg-event-boxing",
    defaultOwner: "Sandy",
  },
  {
    id: 2,
    slug: "improv",
    shareSlug: "e2-improv",
    seriesNumber: 2,
    title: "Improv",
    boardTheme: "Improv",
    eventDate: "2026-05-03",
    joinUrl: "https://flocksocial.app/e/singles-improv-night-454412",
    emoji: "\u{1F3AD}",
    colorClass: "bg-event-improv",
    defaultOwner: "Patrice",
  },
  {
    id: 3,
    slug: "karaoke-friends-edition",
    shareSlug: "e3-karaoke-friends-edition",
    seriesNumber: 3,
    title: "Karaoke (Friends Edition)",
    boardTheme: "Karaoke (Friends Edition)",
    eventDate: "2026-05-20",
    emoji: "\u{1F3A4}",
    colorClass: "bg-event-social",
    defaultOwner: "Stephy",
  },
  {
    id: 4,
    slug: "costco-singles",
    shareSlug: "e4-costco-singles",
    seriesNumber: 4,
    title: "Costco Singles Event",
    boardTheme: "Costco Singles Event",
    eventDate: "2026-05-24",
    emoji: "\u{1F6D2}",
    colorClass: "bg-event-social",
    defaultOwner: "Sandy",
  },
  {
    id: 5,
    slug: "karaoke-again-friends-edition",
    shareSlug: "e5-karaoke-again-friends-edition",
    seriesNumber: 5,
    title: "Karaoke Again (Friends Edition)",
    boardTheme: "Karaoke Again (Friends Edition)",
    eventDate: "2026-06-17",
    emoji: "\u{1F3A4}",
    colorClass: "bg-event-social",
    defaultOwner: "Sandy",
  },
  {
    id: 6,
    slug: "karaoke-singles-night",
    shareSlug: "e6-karaoke-singles-night",
    seriesNumber: 6,
    title: "Karaoke Singles Night",
    boardTheme: "Karaoke Singles Night",
    eventDate: "2026-06-28",
    emoji: "\u{1F49E}",
    colorClass: "bg-event-social",
  },
  {
    id: 7,
    slug: "art-wellness-singles",
    shareSlug: "e7-art-wellness-singles",
    seriesNumber: 7,
    title: "Art Wellness with an Art Therapist",
    boardTheme: "Art Wellness with an Art Therapist",
    eventDate: "2026-07-07",
    emoji: "\u{1F9D8}",
    colorClass: "bg-event-painting",
    tentative: true,
  },
  {
    id: 8,
    slug: "event-8",
    shareSlug: "e8-event",
    seriesNumber: 8,
    title: "TBD Event",
    boardTheme: "TBD",
    eventDate: "2026-08-30",
    emoji: "\u{2728}",
    colorClass: "bg-event-tbd",
    tentative: true,
  },
];

function normalizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function normalizeIsoDate(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return fallback;
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const parsed = new Date(year, month - 1, day, 12, 0, 0);
  const valid =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  return valid ? trimmed : fallback;
}

function normalizeEntry(candidate: unknown, fallback: EventScheduleEntry): EventScheduleEntry {
  if (!candidate || typeof candidate !== "object") {
    return fallback;
  }

  const raw = candidate as Partial<EventScheduleEntry>;

  return {
    ...fallback,
    id: normalizeNumber(raw.id, fallback.id),
    slug: normalizeString(raw.slug, fallback.slug),
    shareSlug: normalizeString(raw.shareSlug, fallback.shareSlug),
    seriesNumber: normalizeNumber(raw.seriesNumber, fallback.seriesNumber),
    title: normalizeString(raw.title, fallback.title),
    boardTheme: normalizeString(raw.boardTheme, fallback.boardTheme),
    eventDate: normalizeIsoDate(raw.eventDate, fallback.eventDate),
    time: normalizeOptionalString(raw.time) ?? fallback.time,
    joinUrl: normalizeOptionalString(raw.joinUrl) ?? fallback.joinUrl,
    publicJoinEnabled:
      raw.publicJoinEnabled === undefined
        ? fallback.publicJoinEnabled
        : normalizeBoolean(raw.publicJoinEnabled, false),
    emoji: normalizeString(raw.emoji, fallback.emoji),
    colorClass: normalizeString(raw.colorClass, fallback.colorClass),
    tentative:
      raw.tentative === undefined ? fallback.tentative : normalizeBoolean(raw.tentative, false),
    defaultOwner: normalizeOptionalString(raw.defaultOwner) ?? fallback.defaultOwner,
  };
}

export function normalizeEventSchedule(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_EVENT_SCHEDULE;
  }

  return DEFAULT_EVENT_SCHEDULE.map((fallbackEntry) => {
    const matchingEntry =
      value.find(
        (candidate) =>
          candidate &&
          typeof candidate === "object" &&
          ("id" in candidate
            ? Number((candidate as { id?: unknown }).id) === fallbackEntry.id
            : (candidate as { slug?: unknown }).slug === fallbackEntry.slug),
      ) ?? fallbackEntry;

    return normalizeEntry(matchingEntry, fallbackEntry);
  });
}

export function serializeEventSchedule(schedule: EventScheduleEntry[]) {
  return normalizeEventSchedule(schedule).map((event) => ({
    ...event,
  }));
}

export function getEventCalendarParts(eventDate: string) {
  const [year, month, day] = eventDate.split("-").map(Number);

  return {
    year,
    month: month - 1,
    date: day,
  };
}
