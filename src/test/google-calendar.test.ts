import { describe, expect, it } from "vitest";
import { DEFAULT_EVENT_SCHEDULE } from "@/data/eventSchedule";
import { buildGoogleCalendarUrl } from "@/lib/googleCalendar";

describe("google calendar event links", () => {
  it("builds a populated Google Calendar link for live events with calendar details", () => {
    const artWellnessEvent = DEFAULT_EVENT_SCHEDULE.find((event) => event.id === 5);

    expect(artWellnessEvent).toBeDefined();

    const googleCalendarUrl = buildGoogleCalendarUrl(artWellnessEvent!);

    expect(googleCalendarUrl).toBeTruthy();

    const parsed = new URL(googleCalendarUrl!);
    expect(`${parsed.origin}${parsed.pathname}`).toBe("https://calendar.google.com/calendar/render");
    expect(parsed.searchParams.get("action")).toBe("TEMPLATE");
    expect(parsed.searchParams.get("text")).toBe("Little Landscapes: A Singles Art Wellness Workshop");
    expect(parsed.searchParams.get("dates")).toBe("20260607T200000Z/20260607T223000Z");
    expect(parsed.searchParams.get("ctz")).toBe("America/Vancouver");
    expect(parsed.searchParams.get("location")).toBe("Central Park Picnic Areas (Burnaby)");

    const details = parsed.searchParams.get("details");
    expect(details).toContain("grounded outdoor singles-event gathering");
    expect(details).toContain("Event link: https://flocksocial.app/e/little-landscapes-an-art-wellness-workshop-e16cb5");
  });
});
