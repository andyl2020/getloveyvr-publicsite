import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_ORIGIN = "https://getloveyvr.ca";
const sourcePath = resolve(process.cwd(), "src/data/eventSchedule.ts");
const sitemapPath = resolve(process.cwd(), "public/sitemap.xml");

function extractDefaultEventSchedule() {
  const source = readFileSync(sourcePath, "utf8");
  const match = source.match(
    /export const DEFAULT_EVENT_SCHEDULE: EventScheduleEntry\[\] = (\[[\s\S]*?\n\]);/,
  );

  if (!match) {
    throw new Error("Could not extract DEFAULT_EVENT_SCHEDULE from src/data/eventSchedule.ts.");
  }

  const evaluate = Function(`"use strict"; return (${match[1]});`);
  const schedule = evaluate();

  if (!Array.isArray(schedule)) {
    throw new Error("DEFAULT_EVENT_SCHEDULE did not evaluate to an array.");
  }

  return schedule;
}

function buildSitemapUrls(events) {
  const activeShareSlugs = events
    .filter((event) => event?.archived !== true)
    .map((event) => String(event.shareSlug || "").trim())
    .filter(Boolean);

  return ["/", ...activeShareSlugs.map((shareSlug) => `/${shareSlug}`)];
}

function buildSitemapXml(urls) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.flatMap((path) => [
      "  <url>",
      `    <loc>${SITE_ORIGIN}${path}</loc>`,
      "  </url>",
    ]),
    "</urlset>",
    "",
  ];

  return lines.join("\n");
}

const events = extractDefaultEventSchedule();
const urls = buildSitemapUrls(events);
const xml = buildSitemapXml(urls);

writeFileSync(sitemapPath, xml, "utf8");

console.log(
  JSON.stringify(
    {
      sitemapPath,
      urls,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
