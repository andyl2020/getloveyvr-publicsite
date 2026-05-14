import { describe, expect, it } from "vitest";
import {
  hashMailingListEmail,
  isValidMailingListEmail,
  normalizeMailingListEmail,
} from "@/lib/mailingList";

describe("mailing list helpers", () => {
  it("normalizes emails before they are stored", () => {
    expect(normalizeMailingListEmail("  Andy@Example.com ")).toBe("andy@example.com");
  });

  it("validates email formatting", () => {
    expect(isValidMailingListEmail("andy@example.com")).toBe(true);
    expect(isValidMailingListEmail("not-an-email")).toBe(false);
  });

  it("hashes email ids for stable signup documents", async () => {
    const hashed = await hashMailingListEmail("andy@example.com");

    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[a-f0-9]+$/);
  });
});
