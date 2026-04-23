import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getFirestore, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { normalizeEventSchedule, serializeEventSchedule, type EventScheduleEntry } from "@/data/eventSchedule";
import { parseEmailList, resolveGoatRole, type GoatRole } from "@/lib/goatAccess";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseEnabled = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every(Boolean);

const masterGoatEmails = parseEmailList(
  import.meta.env.VITE_FIREBASE_MASTER_GOAT_EMAILS ?? import.meta.env.VITE_FIREBASE_EDITOR_EMAILS ?? "",
);
const goatEmails = parseEmailList(import.meta.env.VITE_FIREBASE_GOAT_EMAILS ?? "");

const dashboardCollection = import.meta.env.VITE_FIREBASE_DASHBOARD_COLLECTION ?? "dashboard";
const dashboardDocument = import.meta.env.VITE_FIREBASE_DASHBOARD_DOCUMENT ?? "shared-state";
const eventScheduleDocument = import.meta.env.VITE_FIREBASE_EVENT_SCHEDULE_DOCUMENT ?? "event-schedule";

let app = null;
let auth = null;
let db = null;
let provider = null;
let sharedStateRef = null;
let eventScheduleRef = null;

if (firebaseEnabled) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  sharedStateRef = doc(db, dashboardCollection, dashboardDocument);
  eventScheduleRef = doc(db, dashboardCollection, eventScheduleDocument);
}

export type { GoatRole };

export function isFirebaseEnabled() {
  return firebaseEnabled;
}

export function getMasterGoatEmails() {
  return masterGoatEmails;
}

export function getGoatRole(email: string | null | undefined): GoatRole | null {
  return resolveGoatRole(email, {
    masterGoats: masterGoatEmails,
    goats: goatEmails,
  });
}

export function getPrimaryMasterGoatEmail() {
  return masterGoatEmails[0] ?? "";
}

export function canEditEmail(email: string | null | undefined) {
  return getGoatRole(email) === "master-goat";
}

export function canViewEmail(email: string | null | undefined) {
  return Boolean(getGoatRole(email));
}

export async function signInWithGoogle() {
  if (!auth || !provider) {
    throw new Error("Firebase is not configured yet.");
  }

  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

export async function signOutUser() {
  if (!auth) {
    return;
  }

  await signOut(auth);
}

export function subscribeToAuthState(callback: (user: unknown) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export function subscribeToSharedState(onState: (state: unknown) => void, onError?: (error: unknown) => void) {
  if (!sharedStateRef) {
    onState(null);
    return () => {};
  }

  return onSnapshot(
    sharedStateRef,
    (snapshot) => {
      onState(snapshot.data() ?? null);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function saveSharedState(sharedState: Record<string, unknown>, editorEmail: string) {
  if (!sharedStateRef) {
    throw new Error("Firebase is not configured yet.");
  }

  await setDoc(
    sharedStateRef,
    {
      ...sharedState,
      updatedAt: serverTimestamp(),
      updatedBy: editorEmail.trim().toLowerCase(),
    },
    { merge: true },
  );
}

export function subscribeToEventSchedule(
  onState: (state: { events?: EventScheduleEntry[] } | null) => void,
  onError?: (error: unknown) => void,
) {
  if (!eventScheduleRef) {
    onState(null);
    return () => {};
  }

  return onSnapshot(
    eventScheduleRef,
    (snapshot) => {
      const data = snapshot.data() ?? null;
      if (!data) {
        onState(null);
        return;
      }

      onState({
        ...data,
        events: normalizeEventSchedule(data.events),
      });
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function saveEventSchedule(schedule: EventScheduleEntry[], editorEmail: string) {
  if (!eventScheduleRef) {
    throw new Error("Firebase is not configured yet.");
  }

  await setDoc(
    eventScheduleRef,
    {
      events: serializeEventSchedule(schedule),
      updatedAt: serverTimestamp(),
      updatedBy: editorEmail.trim().toLowerCase(),
    },
    { merge: true },
  );
}
