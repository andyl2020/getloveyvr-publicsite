export interface EventScheduleEntry {
  id: number;
  slug: string;
  shareSlug: string;
  seriesType: "singles" | "friends";
  seriesNumber?: number;
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
    seriesType: "singles",
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
    seriesType: "singles",
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
    shareSlug: "f1-karaoke-friends-edition",
    seriesType: "friends",
    title: "Karaoke (Friends Edition)",
    boardTheme: "Karaoke (Friends Edition)",
    eventDate: "2026-05-20",
    joinUrl: "https://flocksocial.app/events/97f405cf-3602-4093-aa17-422279eda167",
    emoji: "\u{1F3A4}",
    colorClass: "bg-event-social",
    defaultOwner: "Stephy",
  },
  {
    id: 4,
    slug: "costco-singles",
    shareSlug: "e3-costco-singles",
    seriesType: "singles",
    seriesNumber: 3,
    title: "Costco Singles Event",
    boardTheme: "Costco Singles Event",
    eventDate: "2026-05-24",
    emoji: "\u{1F6D2}",
    colorClass: "bg-event-social",
    defaultOwner: "Sandy",
  },
  {
    id: 5,
    slug: "art-wellness-singles",
    shareSlug: "e4-art-wellness-singles",
    seriesType: "singles",
    seriesNumber: 4,
    title: "Art Wellness for Singles (ft. Art Therapist)",
    boardTheme: "Art Wellness for Singles (ft. Art Therapist)",
    eventDate: "2026-06-07",
    emoji: "\u{1F9D8}",
    colorClass: "bg-event-painting",
    tentative: true,
    defaultOwner: "Stephy",
  },
  {
    id: 6,
    slug: "karaoke-again-friends-edition",
    shareSlug: "f2-karaoke",
    seriesType: "friends",
    title: "Karaoke",
    boardTheme: "Karaoke",
    eventDate: "2026-06-17",
    emoji: "\u{1F3A4}",
    colorClass: "bg-event-social",
    defaultOwner: "Stephy",
  },
  {
    id: 7,
    slug: "karaoke-singles-night",
    shareSlug: "e5-karaoke-singles-night",
    seriesType: "singles",
    seriesNumber: 5,
    title: "Karaoke Singles Night",
    boardTheme: "Karaoke Singles Night",
    eventDate: "2026-06-28",
    emoji: "\u{1F49E}",
    colorClass: "bg-event-social",
  },
  {
    id: 8,
    slug: "event-6",
    shareSlug: "e6-event",
    seriesType: "singles",
    seriesNumber: 6,
    title: "TBD Event",
    boardTheme: "TBD",
    eventDate: "2026-07-19",
    emoji: "\u{2728}",
    colorClass: "bg-event-tbd",
    tentative: true,
  },
  {
    id: 9,
    slug: "event-7",
    shareSlug: "e7-event",
    seriesType: "singles",
    seriesNumber: 7,
    title: "TBD Event",
    boardTheme: "TBD",
    eventDate: "2026-08-09",
    emoji: "\u{2728}",
    colorClass: "bg-event-tbd",
    tentative: true,
  },
  {
    id: 10,
    slug: "event-8",
    shareSlug: "e8-event",
    seriesType: "singles",
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

function normalizeOptionalNumber(value: unknown, fallback?: number) {
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

function normalizeSeriesType(value: unknown, fallback: EventScheduleEntry["seriesType"]) {
  return value === "singles" || value === "friends" ? value : fallback;
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
    seriesType: normalizeSeriesType(raw.seriesType, fallback.seriesType),
    seriesNumber: normalizeOptionalNumber(raw.seriesNumber, fallback.seriesNumber),
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

export function isSinglesSeriesEvent(event: EventScheduleEntry) {
  return event.seriesType === "singles" && typeof event.seriesNumber === "number";
}

export function getEventCalendarParts(eventDate: string) {
  const [year, month, day] = eventDate.split("-").map(Number);

  return {
    year,
    month: month - 1,
    date: day,
  };
}
