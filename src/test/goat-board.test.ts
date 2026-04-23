import { describe, expect, it } from "vitest";
import { buildBoardEvents } from "@/data/boardData";
import { DEFAULT_EVENT_SCHEDULE, isSinglesSeriesEvent, normalizeEventSchedule } from "@/data/eventSchedule";
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

  it("keeps friends events outside the 8-event singles series", () => {
    const boardEvents = buildBoardEvents(DEFAULT_EVENT_SCHEDULE);
    const singlesSeries = DEFAULT_EVENT_SCHEDULE.filter(isSinglesSeriesEvent);
    const firstFriendsEvent = boardEvents.find((event) => event.id === 3);
    const thirdSinglesEvent = boardEvents.find((event) => event.id === 4);

    expect(singlesSeries).toHaveLength(8);
    expect(firstFriendsEvent).toMatchObject({
      seriesType: "friends",
      seriesNumber: 1,
    });
    expect(thirdSinglesEvent).toMatchObject({
      seriesType: "singles",
      seriesNumber: 3,
      theme: "Costco Singles Event",
    });
  });
});
