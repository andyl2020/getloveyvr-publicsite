import { describe, expect, it } from "vitest";
import { buildBoardEvents } from "@/data/boardData";
import {
  DEFAULT_EVENT_SCHEDULE,
  getSinglesSeriesTotal,
  getActiveEventSchedule,
  isArchivedEvent,
  isSinglesSeriesEvent,
  normalizeEventSchedule,
} from "@/data/eventSchedule";
import { parseEmailList, resolveGoatRole } from "@/lib/goatAccess";

describe("goat access", () => {
  it("treats master goats as editors and regular goats as viewers", () => {
    const config = {
      masterGoats: parseEmailList("aluu.life@gmail.com"),
      goats: parseEmailList("viewer@example.com"),
    };

    expect(resolveGoatRole("aluu.life@gmail.com", config)).toBe("master-goat");
    expect(resolveGoatRole("viewer@example.com", config)).toBe("goat");
    expect(resolveGoatRole("outsider@example.com", config)).toBeNull();
  });
});

describe("shared event schedule", () => {
  it("falls back to the seeded public schedule when cloud data is missing", () => {
    expect(normalizeEventSchedule(null)).toEqual(DEFAULT_EVENT_SCHEDULE);
  });

  it("recomputes milestone dates when an event date changes", () => {
    const shiftedSchedule = DEFAULT_EVENT_SCHEDULE.map((event) =>
      event.id === 1 ? { ...event, eventDate: "2026-05-10" } : event,
    );

    const [shiftedEvent] = buildBoardEvents(shiftedSchedule);
    const alignmentMilestone = shiftedEvent.milestones.find((milestone) => milestone.type === "alignment");
    const finalCheckMilestone = shiftedEvent.milestones.find((milestone) => milestone.type === "finalCheck");

    expect(shiftedEvent.eventDate).toBe("2026-05-10");
    expect(alignmentMilestone?.date).toBe("2026-04-05");
    expect(finalCheckMilestone?.date).toBe("2026-05-04");
  });

  it("keeps event numbering and completed task state bound to the same event when the date moves", () => {
    const shiftedSchedule = DEFAULT_EVENT_SCHEDULE.map((event) =>
      event.id === 1 ? { ...event, eventDate: "2026-05-10" } : event,
    );

    const shiftedEvent = buildBoardEvents(shiftedSchedule).find((event) => event.id === 1);
    const kickoffMilestone = shiftedEvent?.milestones.find((milestone) => milestone.type === "kickoff");
    const venueLockedMilestone = shiftedEvent?.milestones.find((milestone) => milestone.type === "venueLocked");

    expect(shiftedEvent).toMatchObject({
      id: 1,
      seriesType: "singles",
      seriesNumber: 1,
      theme: "Boxing Singles Event",
      eventDate: "2026-05-10",
    });
    expect(kickoffMilestone?.outputs.every((output) => output.done)).toBe(true);
    expect(venueLockedMilestone?.outputs.every((output) => output.done)).toBe(true);
  });

  it("keeps archived singles off the public schedule while preserving them on the board", () => {
    const boardEvents = buildBoardEvents(DEFAULT_EVENT_SCHEDULE);
    const publicEvents = getActiveEventSchedule(DEFAULT_EVENT_SCHEDULE);
    const singlesSeries = publicEvents.filter(isSinglesSeriesEvent);
    const archivedEvents = DEFAULT_EVENT_SCHEDULE.filter(isArchivedEvent);
    const totalSinglesSeries = getSinglesSeriesTotal(publicEvents);
    const firstFriendsEvent = boardEvents.find((event) => event.id === 3);
    const juneKaraokeFriendsEvent = boardEvents.find((event) => event.id === 6);
    const artWellnessEvent = boardEvents.find((event) => event.id === 5);
    const bakingEvent = boardEvents.find((event) => event.id === 10);
    const hikingEvent = boardEvents.find((event) => event.id === 8);
    const hikingPreMeetEvent = boardEvents.find((event) => event.id === 15);
    const paddleBoardingEvent = boardEvents.find((event) => event.id === 9);
    const paddleBoardingPreMeetEvent = boardEvents.find((event) => event.id === 16);
    const augustKaraokeFriendsEvent = boardEvents.find((event) => event.id === 13);
    const septemberKaraokeFriendsEvent = boardEvents.find((event) => event.id === 14);
    const costcoEvent = boardEvents.find((event) => event.id === 4);
    const archivedBoardGamesEvent = boardEvents.find((event) => event.id === 11);
    const finalSinglesEvent = boardEvents.find((event) => event.id === 12);

    expect(singlesSeries).toHaveLength(7);
    expect(totalSinglesSeries).toBe(8);
    expect(archivedEvents.map((event) => event.id)).toEqual([4, 7, 11]);
    expect(firstFriendsEvent).toMatchObject({
      seriesType: "friends",
      seriesNumber: 1,
      theme: "Karaoke S2 E2 (Friends Edition)",
    });
    expect(juneKaraokeFriendsEvent).toMatchObject({
      seriesType: "friends",
      seriesNumber: 2,
      theme: "Karaoke S2 E3 (Friends Edition)",
    });
    expect(artWellnessEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: 4,
      theme: "Art Wellness (ft. Art Therapist) Singles Event",
      eventDate: "2026-06-07",
    });
    expect(bakingEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: 7,
      theme: "Baking Singles Event",
      eventDate: "2026-06-28",
    });
    expect(hikingEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: 5,
      theme: "Hiking Singles Event",
      eventDate: "2026-07-19",
    });
    expect(hikingPreMeetEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: undefined,
      theme: "Hiking Carpool Pre-Meet Singles Event",
      eventDate: "2026-07-18",
    });
    expect(paddleBoardingEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: 6,
      theme: "Paddle Boarding Singles Event",
      eventDate: "2026-08-09",
    });
    expect(paddleBoardingPreMeetEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: undefined,
      theme: "Paddle Boarding Carpool Pre-Meet Singles Event",
      eventDate: "2026-08-08",
    });
    expect(augustKaraokeFriendsEvent).toMatchObject({
      seriesType: "friends",
      seriesNumber: 3,
      theme: "Karaoke S2 E4 (Friends Edition)",
      eventDate: "2026-08-19",
    });
    expect(septemberKaraokeFriendsEvent).toMatchObject({
      seriesType: "friends",
      seriesNumber: 4,
      theme: "Karaoke S2 E5 (Friends Edition)",
      eventDate: "2026-09-11",
    });
    expect(costcoEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: undefined,
      theme: "Costco Singles Event",
      archived: true,
    });
    expect(archivedBoardGamesEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: 3,
      theme: "Board Games + Deep Convos Singles Event",
      archived: true,
    });
    expect(finalSinglesEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: 8,
      theme: "Karaoke Singles Event",
      eventDate: "2026-09-20",
    });
  });
});
