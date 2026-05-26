import type { EventScheduleEntry } from "@/data/eventSchedule";

function formatGoogleCalendarDateTime(value: string) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function isEventLive(event: EventScheduleEntry) {
  return Boolean(event.joinUrl && event.publicJoinEnabled !== false);
}

export function hasGoogleCalendarDetails(event: EventScheduleEntry) {
  return Boolean(event.calendar?.startsAt && event.calendar?.endsAt);
}

export function buildGoogleCalendarUrl(event: EventScheduleEntry) {
  if (!isEventLive(event) || !hasGoogleCalendarDetails(event)) {
    return null;
  }

  const startsAt = formatGoogleCalendarDateTime(event.calendar!.startsAt!);
  const endsAt = formatGoogleCalendarDateTime(event.calendar!.endsAt!);
  const title = event.calendar?.title?.trim() || event.title;
  const descriptionSections = [
    event.calendar?.description?.trim(),
    event.joinUrl ? `Event link: ${event.joinUrl}` : "",
  ].filter(Boolean);

  const searchParams = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startsAt}/${endsAt}`,
    details: descriptionSections.join("\n\n"),
  });

  if (event.calendar?.timezone) {
    searchParams.set("ctz", event.calendar.timezone);
  }

  if (event.calendar?.location) {
    searchParams.set("location", event.calendar.location);
  }

  return `https://calendar.google.com/calendar/render?${searchParams.toString()}`;
}
