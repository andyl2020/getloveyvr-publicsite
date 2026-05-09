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
  archived?: boolean;
  defaultOwner?: string;
}

export const DEFAULT_EVENT_SCHEDULE: EventScheduleEntry[] = [
  {
    id: 1,
    slug: "boxing",
    shareSlug: "e1-boxing",
    seriesType: "singles",
    seriesNumber: 1,
    title: "Boxing Singles Event",
    boardTheme: "Boxing Singles Event",
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
    title: "Improv Singles Event",
    boardTheme: "Improv Singles Event",
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
    title: "Karaoke S2 E2 (Friends Edition)",
    boardTheme: "Karaoke S2 E2 (Friends Edition)",
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
    title: "Costco Singles Event",
    boardTheme: "Costco Singles Event",
    eventDate: "2026-05-24",
    emoji: "\u{1F6D2}",
    colorClass: "bg-event-social",
    archived: true,
    defaultOwner: "Sandy",
  },
  {
    id: 5,
    slug: "art-wellness-singles",
    shareSlug: "e4-art-wellness-singles",
    seriesType: "singles",
    seriesNumber: 4,
    title: "Art Wellness (ft. Art Therapist) Singles Event",
    boardTheme: "Art Wellness (ft. Art Therapist) Singles Event",
    eventDate: "2026-06-07",
    emoji: "\u{1F9D8}",
    colorClass: "bg-event-painting",
    defaultOwner: "Stephy",
  },
  {
    id: 6,
    slug: "karaoke-again-friends-edition",
    shareSlug: "f2-karaoke",
    seriesType: "friends",
    title: "Karaoke S2 E3 (Friends Edition)",
    boardTheme: "Karaoke S2 E3 (Friends Edition)",
    eventDate: "2026-06-17",
    joinUrl: "https://flocksocial.app/events/f9b17d44-c5b4-4fb2-bd9c-744da16b15bc",
    emoji: "\u{1F3A4}",
    colorClass: "bg-event-social",
    defaultOwner: "Stephy",
  },
  {
    id: 7,
    slug: "karaoke-singles-night",
    shareSlug: "e5-karaoke-singles-night",
    seriesType: "singles",
    title: "Karaoke Singles Event",
    boardTheme: "Karaoke Singles Event",
    eventDate: "2026-06-28",
    emoji: "\u{1F49E}",
    colorClass: "bg-event-social",
    archived: true,
  },
  {
    id: 8,
    slug: "event-6",
    shareSlug: "e6-event",
    seriesType: "singles",
    seriesNumber: 5,
    title: "Hiking Singles Event",
    boardTheme: "Hiking Singles Event",
    eventDate: "2026-07-19",
    emoji: "\u{1F97E}",
    colorClass: "bg-event-social",
  },
  {
    id: 9,
    slug: "event-7",
    shareSlug: "e7-event",
    seriesType: "singles",
    seriesNumber: 6,
    title: "Paddle Boarding Singles Event",
    boardTheme: "Paddle Boarding Singles Event",
    eventDate: "2026-08-09",
    emoji: "\u{1F6F6}",
    colorClass: "bg-event-social",
  },
  {
    id: 10,
    slug: "event-8",
    shareSlug: "e8-event",
    seriesType: "singles",
    seriesNumber: 7,
    title: "Baking Singles Event",
    boardTheme: "Baking Singles Event",
    eventDate: "2026-06-28",
    emoji: "\u{1F9C1}",
    colorClass: "bg-event-social",
  },
  {
    id: 11,
    slug: "board-games-deep-convos",
    shareSlug: "e3-board-games-deep-convos",
    seriesType: "singles",
    seriesNumber: 3,
    title: "Board Games + Deep Convos Singles Event",
    boardTheme: "Board Games + Deep Convos Singles Event",
    eventDate: "2026-06-07",
    emoji: "\u{1F3B2}",
    colorClass: "bg-event-social",
    archived: true,
  },
  {
    id: 12,
    slug: "event-9",
    shareSlug: "e9-event",
    seriesType: "singles",
    seriesNumber: 8,
    title: "Karaoke Singles Event",
    boardTheme: "Karaoke Singles Event",
    eventDate: "2026-09-20",
    emoji: "\u{1F3A4}",
    colorClass: "bg-event-social",
  },
  {
    id: 13,
    slug: "karaoke-friends-s2-e4",
    shareSlug: "f3-karaoke-s2-e4",
    seriesType: "friends",
    title: "Karaoke S2 E4 (Friends Edition)",
    boardTheme: "Karaoke S2 E4 (Friends Edition)",
    eventDate: "2026-08-19",
    emoji: "\u{1F3A4}",
    colorClass: "bg-event-social",
    defaultOwner: "Stephy",
  },
  {
    id: 14,
    slug: "karaoke-friends-s2-e5",
    shareSlug: "f4-karaoke-s2-e5",
    seriesType: "friends",
    title: "Karaoke S2 E5 (Friends Edition)",
    boardTheme: "Karaoke S2 E5 (Friends Edition)",
    eventDate: "2026-09-11",
    emoji: "\u{1F3A4}",
    colorClass: "bg-event-social",
    defaultOwner: "Stephy",
  },
  {
    id: 15,
    slug: "hiking-carpool-pre-meet",
    shareSlug: "hiking-carpool-pre-meet",
    seriesType: "singles",
    title: "Hiking Carpool Pre-Meet Singles Event",
    boardTheme: "Hiking Carpool Pre-Meet Singles Event",
    eventDate: "2026-07-18",
    emoji: "\u{1F697}",
    colorClass: "bg-event-social",
  },
  {
    id: 16,
    slug: "paddle-boarding-carpool-pre-meet",
    shareSlug: "paddle-boarding-carpool-pre-meet",
    seriesType: "singles",
    title: "Paddle Boarding Carpool Pre-Meet Singles Event",
    boardTheme: "Paddle Boarding Carpool Pre-Meet Singles Event",
    eventDate: "2026-08-08",
    emoji: "\u{1F697}",
    colorClass: "bg-event-social",
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
    archived:
      raw.archived === undefined ? fallback.archived : normalizeBoolean(raw.archived, false),
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

export function isArchivedEvent(event: EventScheduleEntry) {
  return event.archived === true;
}

export function getActiveEventSchedule(events: EventScheduleEntry[]) {
  return events.filter((event) => !isArchivedEvent(event));
}

export function isSinglesSeriesEvent(
  event: EventScheduleEntry,
): event is EventScheduleEntry & { seriesNumber: number } {
  return event.seriesType === "singles" && typeof event.seriesNumber === "number";
}

export function getSinglesSeriesTotal(events: EventScheduleEntry[]) {
  return events.reduce(
    (highestSeriesNumber, event) =>
      isSinglesSeriesEvent(event) ? Math.max(highestSeriesNumber, event.seriesNumber) : highestSeriesNumber,
    0,
  );
}

export function getEventCalendarParts(eventDate: string) {
  const [year, month, day] = eventDate.split("-").map(Number);

  return {
    year,
    month: month - 1,
    date: day,
  };
}
