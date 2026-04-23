import { useEffect, useState } from "react";
import { DEFAULT_EVENT_SCHEDULE, normalizeEventSchedule, type EventScheduleEntry } from "@/data/eventSchedule";
import { isFirebaseEnabled, subscribeToEventSchedule } from "@/lib/firebase";

export function useEventSchedule() {
  const firebaseEnabled = isFirebaseEnabled();
  const [schedule, setSchedule] = useState<EventScheduleEntry[]>(() => DEFAULT_EVENT_SCHEDULE);
  const [scheduleDocExists, setScheduleDocExists] = useState(() => !firebaseEnabled);
  const [scheduleSyncError, setScheduleSyncError] = useState("");

  useEffect(() => {
    if (!firebaseEnabled) {
      return () => {};
    }

    return subscribeToEventSchedule(
      (data) => {
        if (data?.events?.length) {
          setSchedule(normalizeEventSchedule(data.events));
          setScheduleDocExists(true);
        } else {
          setSchedule(DEFAULT_EVENT_SCHEDULE);
          setScheduleDocExists(false);
        }

        setScheduleSyncError("");
      },
      (error) => {
        setSchedule(DEFAULT_EVENT_SCHEDULE);
        setScheduleSyncError(error?.message || "Could not load the shared event schedule.");
      },
    );
  }, [firebaseEnabled]);

  return {
    firebaseEnabled,
    schedule,
    scheduleDocExists,
    scheduleSyncError,
  };
}
