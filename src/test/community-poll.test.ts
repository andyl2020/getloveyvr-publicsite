import { describe, expect, it } from "vitest";
import {
  BRING_BACK_OPTION_ID,
  buildVoteResults,
  getVotePercentage,
  hashPollSessionId,
} from "@/lib/communityPoll";

describe("community poll helpers", () => {
  it("counts votes by top-level option and ignores unknown values", () => {
    const { counts, total } = buildVoteResults([
      { option: "ikea", bringBackPick: null, writeIn: null },
      { option: "ikea", bringBackPick: null, writeIn: null },
      { option: BRING_BACK_OPTION_ID, bringBackPick: null, writeIn: "Bring back boxing" },
      { option: "ages_45_plus", bringBackPick: null, writeIn: null },
      { option: "unknown", bringBackPick: null, writeIn: null },
    ]);

    expect(total).toBe(4);
    expect(counts.ikea).toBe(2);
    expect(counts[BRING_BACK_OPTION_ID]).toBe(1);
    expect(counts.ages_45_plus).toBe(1);
    expect(counts.baking).toBe(0);
    expect(counts.karaoke_singles).toBe(0);
    expect(counts.more_friend_events).toBe(0);
    expect(counts.costco).toBe(0);
  });

  it("calculates rounded percentages for the result bars", () => {
    expect(getVotePercentage(0, 0)).toBe(0);
    expect(getVotePercentage(1, 3)).toBe(33);
    expect(getVotePercentage(2, 3)).toBe(67);
  });

  it("hashes poll session ids before they are stored", async () => {
    const hashed = await hashPollSessionId("session-123");

    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[a-f0-9]+$/);
    expect(hashed).not.toBe("session-123");
  });
});
