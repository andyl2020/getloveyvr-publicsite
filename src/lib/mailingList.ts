export const MAILING_LIST_STORAGE_KEY = "glyvr_mailing_list_email";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeMailingListEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidMailingListEmail(value: string) {
  const normalizedEmail = normalizeMailingListEmail(value);
  return EMAIL_PATTERN.test(normalizedEmail);
}
