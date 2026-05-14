export const MAILING_LIST_STORAGE_KEY = "glyvr_mailing_list_email";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeMailingListEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidMailingListEmail(value: string) {
  const normalizedEmail = normalizeMailingListEmail(value);
  return EMAIL_PATTERN.test(normalizedEmail);
}

export async function hashMailingListEmail(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
