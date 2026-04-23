export type GoatRole = "master-goat" | "goat";

export interface GoatAccessConfig {
  masterGoats: string[];
  goats: string[];
}

export function normalizeEmail(value?: string | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function parseEmailList(value?: string | null) {
  if (typeof value !== "string") {
    return [];
  }

  return [...new Set(value.split(",").map(normalizeEmail).filter(Boolean))];
}

export function resolveGoatRole(email: string | null | undefined, config: GoatAccessConfig): GoatRole | null {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  if (config.masterGoats.includes(normalizedEmail)) {
    return "master-goat";
  }

  if (config.goats.includes(normalizedEmail)) {
    return "goat";
  }

  return null;
}
