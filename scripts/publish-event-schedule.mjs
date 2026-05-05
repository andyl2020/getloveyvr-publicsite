import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function firstEmail(value) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .find(Boolean) ?? "";
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function candidateBrowserDirs() {
  const root = process.env.LOCALAPPDATA;
  if (!root) {
    return [];
  }

  const profileNames = ["Default", "Profile 1", "Profile 2", "Profile 3"];
  const siteDirs = [
    ["Google", "Chrome", "User Data"],
    ["Microsoft", "Edge", "User Data"],
  ];
  const originDirs = [
    "https_getloveyvr.ca_0.indexeddb.leveldb",
    "https_andyl2020.github.io_0.indexeddb.leveldb",
  ];

  return siteDirs.flatMap((segments) =>
    profileNames.flatMap((profileName) =>
      originDirs.map((originDir) =>
        resolve(root, ...segments, profileName, "IndexedDB", originDir),
      ),
    ),
  );
}

function extractRefreshTokenFromContents(contents) {
  const matches = contents.match(/AMf-[A-Za-z0-9_-]{100,}/g);
  if (!matches?.length) {
    return "";
  }

  return [...matches].sort((left, right) => right.length - left.length)[0];
}

function findBrowserRefreshToken() {
  for (const dir of candidateBrowserDirs()) {
    if (!existsSync(dir)) {
      continue;
    }

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !/\.(ldb|log)$/i.test(entry.name)) {
        continue;
      }

      const filePath = resolve(dir, entry.name);
      let contents = "";

      try {
        contents = readFileSync(filePath, "latin1");
      } catch {
        continue;
      }

      if (!contents.includes("firebase:authUser") && !contents.includes("getloveyvr-dashboard")) {
        continue;
      }

      const refreshToken = extractRefreshTokenFromContents(contents);
      if (refreshToken) {
        return refreshToken;
      }
    }
  }

  throw new Error("Could not find a cached Firebase refresh token in the local browser profiles.");
}

async function exchangeRefreshToken(apiKey, refreshToken) {
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Could not exchange the cached Firebase refresh token (${response.status}).`);
  }

  return response.json();
}

function toFirestoreValue(value) {
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }

  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
  }

  if (value && typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, nestedValue]) => [key, toFirestoreValue(nestedValue)]),
        ),
      },
    };
  }

  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  throw new Error(`Unsupported Firestore value: ${String(value)}`);
}

async function commitWithIdToken({
  apiKey,
  projectId,
  collection,
  documentId,
  data,
  idToken,
}) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: `projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`,
              fields: Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)]),
              ),
            },
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Firestore REST write failed (${response.status}): ${payload}`);
  }
}

function extractDefaultEventSchedule() {
  const sourcePath = resolve(process.cwd(), "src/data/eventSchedule.ts");
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

loadEnvFile(resolve(process.cwd(), ".env.production"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

const fallbackEditorEmail =
  firstEmail(process.env.VITE_FIREBASE_MASTER_GOAT_EMAILS) || "unknown@getloveyvr.com";
const firebaseConfig = {
  apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requiredEnv("VITE_FIREBASE_APP_ID"),
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
};
const dashboardCollection = process.env.VITE_FIREBASE_DASHBOARD_COLLECTION?.trim() || "dashboard";
const eventScheduleDocument = process.env.VITE_FIREBASE_EVENT_SCHEDULE_DOCUMENT?.trim() || "event-schedule";
const events = extractDefaultEventSchedule();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventScheduleRef = doc(db, dashboardCollection, eventScheduleDocument);
const snapshot = await getDoc(eventScheduleRef);
const currentData = snapshot.exists() ? snapshot.data() ?? {} : {};
const nextData = {
  ...currentData,
  events,
  updatedAt: new Date(),
  updatedBy: fallbackEditorEmail,
};

let authMode = "sdk";
let browserRefreshToken = "";

try {
  browserRefreshToken = findBrowserRefreshToken();
} catch {
  browserRefreshToken = "";
}

if (browserRefreshToken) {
  const session = await exchangeRefreshToken(firebaseConfig.apiKey, browserRefreshToken);

  await commitWithIdToken({
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    collection: dashboardCollection,
    documentId: eventScheduleDocument,
    data: nextData,
    idToken: session.id_token,
  });

  authMode = "local-browser-session";
} else {
  try {
    await setDoc(eventScheduleRef, nextData, { merge: true });
  } catch (error) {
    if (error?.code !== "permission-denied") {
      throw error;
    }

    const refreshToken = findBrowserRefreshToken();
    const session = await exchangeRefreshToken(firebaseConfig.apiKey, refreshToken);

    await commitWithIdToken({
      apiKey: firebaseConfig.apiKey,
      projectId: firebaseConfig.projectId,
      collection: dashboardCollection,
      documentId: eventScheduleDocument,
      data: nextData,
      idToken: session.id_token,
    });

    authMode = "local-browser-session";
  }
}

console.log(
  JSON.stringify(
    {
      authMode,
      collection: dashboardCollection,
      documentId: eventScheduleDocument,
      updatedBy: fallbackEditorEmail,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        archived: event.archived === true,
      })),
    },
    null,
    2,
  ),
);
