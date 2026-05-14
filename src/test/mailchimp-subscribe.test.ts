import { afterEach, describe, expect, it, vi } from "vitest";
import { handler } from "../../netlify/functions/subscribe.js";

const ORIGINAL_ENV = {
  MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY,
  MAILCHIMP_AUDIENCE_ID: process.env.MAILCHIMP_AUDIENCE_ID,
  MAILCHIMP_DC: process.env.MAILCHIMP_DC,
};

afterEach(() => {
  process.env.MAILCHIMP_API_KEY = ORIGINAL_ENV.MAILCHIMP_API_KEY;
  process.env.MAILCHIMP_AUDIENCE_ID = ORIGINAL_ENV.MAILCHIMP_AUDIENCE_ID;
  process.env.MAILCHIMP_DC = ORIGINAL_ENV.MAILCHIMP_DC;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("netlify subscribe function", () => {
  it("rejects non-post requests", async () => {
    const response = await handler({ httpMethod: "GET", body: "" });

    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body)).toMatchObject({
      success: false,
    });
  });

  it("returns an error when mailchimp env vars are missing", async () => {
    process.env.MAILCHIMP_API_KEY = "";
    process.env.MAILCHIMP_AUDIENCE_ID = "";
    process.env.MAILCHIMP_DC = "";

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ email: "andy@example.com" }),
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toMatchObject({
      success: false,
    });
  });

  it("returns success when mailchimp accepts the signup", async () => {
    process.env.MAILCHIMP_API_KEY = "test-key-us11";
    process.env.MAILCHIMP_AUDIENCE_ID = "audience-id";
    process.env.MAILCHIMP_DC = "us11";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ email: "andy@example.com" }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      success: true,
      alreadySubscribed: false,
    });
  });
});
