import { Buffer } from "node:buffer";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, {
      success: false,
      message: "Method not allowed.",
    });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY?.trim();
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID?.trim();
  const dataCenter = process.env.MAILCHIMP_DC?.trim();

  if (!apiKey || !audienceId || !dataCenter) {
    return json(500, {
      success: false,
      message: "Mailing list is not configured yet.",
    });
  }

  let payload = {};

  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, {
      success: false,
      message: "Invalid request body.",
    });
  }

  const email = normalizeEmail(payload.email);

  if (!EMAIL_PATTERN.test(email)) {
    return json(400, {
      success: false,
      message: "Enter a valid email address.",
    });
  }

  const authorization = Buffer.from(`anystring:${apiKey}`).toString("base64");
  const response = await fetch(`https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: email,
      status: "subscribed",
    }),
  });

  const mailchimpPayload = await response.json().catch(() => ({}));

  if (response.ok) {
    return json(200, {
      success: true,
      alreadySubscribed: false,
    });
  }

  if (response.status === 400 && mailchimpPayload.title === "Member Exists") {
    return json(200, {
      success: true,
      alreadySubscribed: true,
    });
  }

  return json(500, {
    success: false,
    message: "Could not save your email right now.",
    detail: typeof mailchimpPayload.detail === "string" ? mailchimpPayload.detail : undefined,
  });
}
