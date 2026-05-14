import { describe, expect, it } from "vitest";
import {
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
});
