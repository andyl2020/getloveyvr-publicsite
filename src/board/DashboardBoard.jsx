import { useEffect, useRef, useState } from "react";
import {
  CONTENT_TYPE_GUIDE,
  buildBoardEvents,
  MILESTONE_PLAYBOOK,
  OWNER_OPTIONS,
  VACATION_BLOCKS,
} from "@/data/boardData";
import {
  getPrimaryMasterGoatEmail,
  isFirebaseEnabled,
  saveSharedState,
  subscribeToSharedState,
} from "@/lib/firebase";
import "./dashboard.css";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHARED_STATE_VERSION = "2026-summer-refresh";
const OUTPUT_STORAGE_KEY = `getloveyvr-output-progress-${SHARED_STATE_VERSION}`;
const EVENT_OWNER_STORAGE_KEY = `getloveyvr-event-owners-${SHARED_STATE_VERSION}`;
const TASK_OWNER_STORAGE_KEY = `getloveyvr-task-owners-${SHARED_STATE_VERSION}`;
const TASK_TEXT_STORAGE_KEY = `getloveyvr-task-text-${SHARED_STATE_VERSION}`;
const PRIMARY_MASTER_GOAT_EMAIL = getPrimaryMasterGoatEmail();

const OWNER_TONES = {
  Sandy: "rose",
  Patrice: "cyan",
  Andy: "mint",
  Stephy: "amber",
};

function ownerFilterId(owner) {
  return `owner_${owner.toLowerCase()}`;
}

const FILTER_OPTIONS = [
  ...OWNER_OPTIONS.map((owner) => ({
    id: ownerFilterId(owner),
    label: `${owner} events`,
    tone: OWNER_TONES[owner] ?? "slate",
  })),
  { id: "vacations", label: "Vacations", tone: "mint" },
  { id: "issuesOnly", label: "Only issues", tone: "critical" },
];

const STATUS_META = {
  done: { label: "Done", tone: "positive" },
  overdue: { label: "Overdue", tone: "critical" },
  urgent: { label: "Due soon", tone: "warning" },
  pending: { label: "Upcoming", tone: "neutral" },
};

const SEVERITY_META = {
  critical: { label: "Needs action", tone: "critical" },
  warning: { label: "Watch", tone: "warning" },
  healthy: { label: "On track", tone: "info" },
  done: { label: "Done", tone: "positive" },
};

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return dateKey(new Date());
}

function monthKey(value) {
  return value.slice(0, 7);
}

function daysBetween(left, right) {
  const daySize = 1000 * 60 * 60 * 24;
  return Math.round((left - right) / daySize);
}

function rangeDays(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const days = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function formatMonthLabel(value) {
  return parseDate(`${value}-01`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value) {
  return parseDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDayLabel(value) {
  return parseDate(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(startDate, endDate) {
  if (startDate === endDate) {
    return formatShortDate(startDate);
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()}-${end.getDate()}`;
  }
  return `${formatShortDate(startDate)}-${formatShortDate(endDate)}`;
}

function buildMonthGrid(selectedMonth) {
  const firstDay = parseDate(`${selectedMonth}-01`);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    cells.push({
      date: dateKey(current),
      inMonth: current.getMonth() === firstDay.getMonth(),
    });
  }
  return cells;
}

function buildVacationLookup(blocks) {
  const lookup = {};

  for (const block of blocks) {
    lookup[block.owner] ??= new Set();
    for (const date of rangeDays(block.start, block.end)) {
      lookup[block.owner].add(date);
    }
  }

  return lookup;
}

function buildMonthOptions(events, todayKey) {
  return [...new Set([monthKey(todayKey), ...events.map((event) => monthKey(event.eventDate))])].sort();
}

function normalizeAssignee(value) {
  if (value === "Stephanie") {
    return "Stephy";
  }
  return OWNER_OPTIONS.includes(value) ? value : "";
}

function displayOwnerLabel(value) {
  return normalizeAssignee(value) || "Unassigned";
}

function ownerTone(value) {
  return OWNER_TONES[normalizeAssignee(value)] ?? "slate";
}

function normalizeStoredOutputState(rawState) {
  if (!rawState || typeof rawState !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawState).map(([key, value]) => [key.replace(/:/g, "__"), Boolean(value)]),
  );
}

function normalizeStoredAssignmentState(rawState) {
  if (!rawState || typeof rawState !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawState)
      .map(([key, value]) => [key.replace(/:/g, "__"), normalizeAssignee(value)])
      .filter(([, value]) => Boolean(value)),
  );
}

function normalizeStoredTextState(rawState) {
  if (!rawState || typeof rawState !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawState)
      .map(([key, value]) => [key.replace(/:/g, "__"), typeof value === "string" ? value : ""])
      .filter(([, value]) => value.trim().length > 0),
  );
}

function readOutputState() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(OUTPUT_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    return normalizeStoredOutputState(parsed);
  } catch {
    return {};
  }
}

function readAssignmentState(storageKey) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    return normalizeStoredAssignmentState(parsed);
  } catch {
    return {};
  }
}

function readTextState(storageKey) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    return normalizeStoredTextState(parsed);
  } catch {
    return {};
  }
}

function outputStateKey(eventId, milestoneType, outputId) {
  return `${eventId}__${milestoneType}__${outputId}`;
}

function eventOwnerStateKey(eventId) {
  return `event__${eventId}`;
}

function taskOwnerStateKey(eventId, milestoneType, outputId) {
  return `${eventId}__${milestoneType}__${outputId}`;
}

function taskTextStateKey(eventId, milestoneType, outputId) {
  return `${eventId}__${milestoneType}__${outputId}__text`;
}

function resolveEventOwner(event, eventOwnerState) {
  return normalizeAssignee(eventOwnerState[eventOwnerStateKey(event.id)]) || normalizeAssignee(event.owner);
}

function resolveTaskOwner(taskOwnerState, eventId, milestoneType, outputId, eventOwner) {
  return (
    normalizeAssignee(taskOwnerState[taskOwnerStateKey(eventId, milestoneType, outputId)]) || eventOwner
  );
}

function createDefaultFilters() {
  return Object.fromEntries(
    [...OWNER_OPTIONS.map((owner) => [ownerFilterId(owner), true]), ["vacations", true], ["issuesOnly", false]],
  );
}

function milestoneStatus(dateString, done, todayKey) {
  if (done) {
    return "done";
  }

  const diff = daysBetween(parseDate(dateString), parseDate(todayKey));
  if (diff < 0) {
    return "overdue";
  }
  if (diff <= 5) {
    return "urgent";
  }
  return "pending";
}

function milestoneDeadlineLabel(dateString, done, todayKey) {
  if (done) {
    return "Completed";
  }

  const diff = daysBetween(parseDate(dateString), parseDate(todayKey));
  if (diff === 0) {
    return "Due today";
  }
  if (diff > 0) {
    return `${diff} day${diff === 1 ? "" : "s"} left`;
  }

  const overdueDays = Math.abs(diff);
  return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
}

function eventCode(event) {
  return `E${event.id}`;
}

function eventDisplayName(event) {
  return `Singles Event #${event.id}: ${event.theme}`;
}

function directoryEventName(event) {
  const label = event.id === 1 ? `${event.theme} event` : event.theme;
  return `${event.code}: ${label}`;
}

function clipVacationBlockToMonth(block, selectedMonth) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const monthStart = `${selectedMonth}-01`;
  const monthEnd = dateKey(new Date(year, month, 0, 12, 0, 0));
  const start = block.start < monthStart ? monthStart : block.start;
  const end = block.end > monthEnd ? monthEnd : block.end;

  if (start > end) {
    return null;
  }

  return {
    ...block,
    start,
    end,
  };
}

function resolveMilestones(event, outputState, taskOwnerState, taskTextState, eventOwner) {
  return event.milestones.map((milestone) => {
    const template = MILESTONE_PLAYBOOK[milestone.type];
    const outputs = milestone.outputs.map((output) => {
      const stateKey = outputStateKey(event.id, milestone.type, output.id);
      const done = outputState[stateKey] ?? output.done;
      const ownerStateKey = taskOwnerStateKey(event.id, milestone.type, output.id);
      const assignedOwner = normalizeAssignee(taskOwnerState[ownerStateKey]);
      const owner = resolveTaskOwner(taskOwnerState, event.id, milestone.type, output.id, eventOwner);
      const textStateKey = taskTextStateKey(event.id, milestone.type, output.id);
      const textValue = taskTextState[textStateKey] ?? "";

      return {
        ...output,
        done,
        stateKey,
        ownerStateKey,
        assignedOwner,
        owner,
        textStateKey,
        textValue,
      };
    });

    return {
      ...milestone,
      label: template.label,
      timing: template.timing,
      summary: template.summary,
      outputs,
      outputCount: outputs.length,
      doneCount: outputs.filter((output) => output.done).length,
      done: outputs.length > 0 ? outputs.every((output) => output.done) : false,
    };
  });
}

function buildEventModels(
  events,
  vacationLookup,
  outputState,
  eventOwnerState,
  taskOwnerState,
  taskTextState,
  todayKey,
) {
  return [...events]
    .sort((left, right) => left.eventDate.localeCompare(right.eventDate))
    .map((event) => {
      const owner = resolveEventOwner(event, eventOwnerState);
      const milestones = resolveMilestones(event, outputState, taskOwnerState, taskTextState, owner);
      const issues = [];
      const ownerVacationDays = owner ? vacationLookup[owner] ?? new Set() : new Set();
      const overdueMilestones = milestones.filter(
        (milestone) =>
          !milestone.done && milestoneStatus(milestone.date, milestone.done, todayKey) === "overdue",
      );
      const nextMilestone = milestones.find((milestone) => !milestone.done) ?? null;
      const vacationConflicts = milestones.filter(
        (milestone) => !milestone.done && ownerVacationDays.has(milestone.date),
      );
      const daysUntilEvent = daysBetween(parseDate(event.eventDate), parseDate(todayKey));

      if (overdueMilestones.length > 0) {
        issues.push({
          severity: "critical",
          label: "Overdue milestone",
          message:
            overdueMilestones.length === 1
              ? `${overdueMilestones[0].label} is overdue (${overdueMilestones[0].doneCount}/${overdueMilestones[0].outputCount} outputs done).`
              : `${overdueMilestones.length} milestones are overdue.`,
        });
      }

      if (vacationConflicts.length > 0) {
        issues.push({
          severity: "critical",
          label: "Owner conflict",
          message:
            vacationConflicts.length === 1
              ? `${owner} is away when ${vacationConflicts[0].label} is due.`
              : `${owner} is away during ${vacationConflicts.length} milestones.`,
        });
      }

      if (nextMilestone && milestoneStatus(nextMilestone.date, nextMilestone.done, todayKey) === "urgent") {
        issues.push({
          severity: "warning",
          label: "Due soon",
          message: `${nextMilestone.label} is due ${formatShortDate(nextMilestone.date)} (${nextMilestone.doneCount}/${nextMilestone.outputCount} outputs done).`,
        });
      }

      if (event.tentative && daysUntilEvent <= 35) {
        issues.push({
          severity: "warning",
          label: "Tentative",
          message: `Still tentative with ${Math.max(daysUntilEvent, 0)} days until event day.`,
        });
      }

      const severity = issues.some((issue) => issue.severity === "critical")
        ? "critical"
        : issues.length > 0
          ? "warning"
          : milestones.every((milestone) => milestone.done)
            ? "done"
            : "healthy";

      return {
        ...event,
        owner,
        milestones,
        code: eventCode(event),
        displayName: eventDisplayName(event),
        nextMilestone,
        issues,
        severity,
        issueCount: issues.length,
      };
    });
}

function buildAlerts(eventModels) {
  return eventModels
    .flatMap((event) =>
      event.issues.map((issue) => ({
        ...issue,
        eventId: event.id,
        code: event.code,
        displayName: event.displayName,
        owner: event.owner,
        eventDate: event.eventDate,
      })),
    )
    .sort((left, right) => {
      if (left.severity !== right.severity) {
        return left.severity === "critical" ? -1 : 1;
      }
      return left.eventDate.localeCompare(right.eventDate);
    });
}

function toneForEvent(event) {
  return `tone-${SEVERITY_META[event.severity].tone}`;
}

export default function DashboardBoard({
  accessRole,
  currentUser,
  onSeedSchedule,
  onUpdateEventDate,
  schedule,
  scheduleDocExists,
}) {
  const firebaseEnabled = isFirebaseEnabled();
  const boardEvents = buildBoardEvents(schedule);
  const [todayKey, setTodayKey] = useState(() => getTodayKey());
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(getTodayKey()));
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [outputState, setOutputState] = useState(() => readOutputState());
  const [eventOwnerState, setEventOwnerState] = useState(() =>
    readAssignmentState(EVENT_OWNER_STORAGE_KEY),
  );
  const [taskOwnerState, setTaskOwnerState] = useState(() =>
    readAssignmentState(TASK_OWNER_STORAGE_KEY),
  );
  const [taskTextState, setTaskTextState] = useState(() =>
    readTextState(TASK_TEXT_STORAGE_KEY),
  );
  const [syncError, setSyncError] = useState("");
  const [sharedDocExists, setSharedDocExists] = useState(() => !firebaseEnabled);
  const [openOwnerPickerKey, setOpenOwnerPickerKey] = useState(null);
  const [pickerPlacement, setPickerPlacement] = useState({ vertical: "down", horizontal: "right" });
  const [filters, setFilters] = useState(() => createDefaultFilters());
  const [eventDateDraft, setEventDateDraft] = useState("");
  const [eventDateFeedback, setEventDateFeedback] = useState("");
  const [isSavingEventDate, setIsSavingEventDate] = useState(false);
  const openMenuRef = useRef(null);
  const scheduleSeededRef = useRef(false);
  const canEdit = accessRole === "master-goat" || !firebaseEnabled;

  const monthOptions = buildMonthOptions(boardEvents, todayKey);
  const vacationLookup = buildVacationLookup(VACATION_BLOCKS);
  const eventModels = buildEventModels(
    boardEvents,
    vacationLookup,
    outputState,
    eventOwnerState,
    taskOwnerState,
    taskTextState,
    todayKey,
  );
  const visibleEvents = eventModels.filter((event) => {
    const activeOwnerFilter = event.owner ? filters[ownerFilterId(event.owner)] : true;
    if (activeOwnerFilter === false) {
      return false;
    }
    if (filters.issuesOnly && event.issueCount === 0) {
      return false;
    }
    return true;
  });
  const monthEvents = visibleEvents.filter((event) => monthKey(event.eventDate) === selectedMonth);
  const calendarCells = buildMonthGrid(selectedMonth);
  const alerts = buildAlerts(visibleEvents);
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const warningCount = alerts.filter((alert) => alert.severity === "warning").length;
  const availabilityRows = OWNER_OPTIONS.map((owner) => ({
    owner,
    tone: ownerTone(owner),
    blocks: VACATION_BLOCKS
      .filter((block) => block.owner === owner)
      .map((block) => clipVacationBlockToMonth(block, selectedMonth))
      .filter(Boolean),
  }));
  const selectedEvent =
    visibleEvents.find((event) => event.id === selectedEventId) ??
    monthEvents[0] ??
    visibleEvents[0] ??
    null;
  const selectedEventIndex = selectedEvent
    ? visibleEvents.findIndex((event) => event.id === selectedEvent.id)
    : -1;
  const previousEvent = selectedEventIndex > 0 ? visibleEvents[selectedEventIndex - 1] : null;
  const nextEvent =
    selectedEventIndex >= 0 && selectedEventIndex < visibleEvents.length - 1
      ? visibleEvents[selectedEventIndex + 1]
      : null;

  useEffect(() => {
    const candidates = monthEvents.length > 0 ? monthEvents : visibleEvents;
    if (!selectedEventId || !candidates.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(candidates[0]?.id ?? null);
    }
  }, [monthEvents, selectedEventId, visibleEvents]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTodayKey(getTodayKey());
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(OUTPUT_STORAGE_KEY, JSON.stringify(outputState));
  }, [outputState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(EVENT_OWNER_STORAGE_KEY, JSON.stringify(eventOwnerState));
  }, [eventOwnerState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TASK_OWNER_STORAGE_KEY, JSON.stringify(taskOwnerState));
  }, [taskOwnerState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TASK_TEXT_STORAGE_KEY, JSON.stringify(taskTextState));
  }, [taskTextState]);

  useEffect(() => {
    setOpenOwnerPickerKey(null);
  }, [selectedEventId]);

  useEffect(() => {
    if (!openOwnerPickerKey || typeof document === "undefined" || typeof window === "undefined") {
      return undefined;
    }

    function updatePlacement() {
      const menu = openMenuRef.current;
      if (!menu) {
        return;
      }

      const rect = menu.getBoundingClientRect();
      const nextPlacement = { vertical: "down", horizontal: "right" };

      if (rect.bottom > window.innerHeight - 12 && rect.top > rect.height + 12) {
        nextPlacement.vertical = "up";
      }

      if (rect.right > window.innerWidth - 12 && rect.left > rect.width + 12) {
        nextPlacement.horizontal = "left";
      }

      setPickerPlacement(nextPlacement);
    }

    const frameId = window.requestAnimationFrame(updatePlacement);

    function handlePointerDown(event) {
      if (!(event.target instanceof Element) || !event.target.closest(".owner-picker-shell")) {
        setOpenOwnerPickerKey(null);
      }
    }

    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [openOwnerPickerKey]);

  useEffect(() => {
    if (!firebaseEnabled) {
      return () => {};
    }

    return subscribeToSharedState(
      (data) => {
        if (data?.stateVersion === SHARED_STATE_VERSION) {
          setOutputState(normalizeStoredOutputState(data.outputState));
          setEventOwnerState(normalizeStoredAssignmentState(data.eventOwnerState));
          setTaskOwnerState(normalizeStoredAssignmentState(data.taskOwnerState));
          setTaskTextState(normalizeStoredTextState(data.taskTextState));
          setSharedDocExists(true);
        } else if (data) {
          setOutputState({});
          setEventOwnerState({});
          setTaskOwnerState({});
          setTaskTextState({});
          setSharedDocExists(false);
        } else {
          setSharedDocExists(false);
        }

        setSyncError("");
      },
      (error) => {
        setSyncError(error?.message || "Cloud sync is unavailable right now.");
      },
    );
  }, [firebaseEnabled]);

  useEffect(() => {
    if (!selectedEvent?.eventDate) {
      setEventDateDraft("");
      setEventDateFeedback("");
      return;
    }

    setEventDateDraft(selectedEvent.eventDate);
    setEventDateFeedback("");
  }, [selectedEvent?.eventDate, selectedEvent?.id]);

  useEffect(() => {
    if (
      !firebaseEnabled ||
      !canEdit ||
      !currentUser?.email ||
      scheduleDocExists ||
      scheduleSeededRef.current ||
      typeof onSeedSchedule !== "function"
    ) {
      return;
    }

    scheduleSeededRef.current = true;
    onSeedSchedule().catch((error) => {
      scheduleSeededRef.current = false;
      setSyncError(error?.message || "Could not seed the shared event schedule.");
    });
  }, [canEdit, currentUser, firebaseEnabled, onSeedSchedule, scheduleDocExists]);

  useEffect(() => {
    if (!firebaseEnabled || !canEdit || !currentUser?.email || sharedDocExists) {
      return;
    }

    if (
      Object.keys(outputState).length === 0 &&
      Object.keys(eventOwnerState).length === 0 &&
      Object.keys(taskOwnerState).length === 0 &&
      Object.keys(taskTextState).length === 0
    ) {
      return;
    }

    saveSharedState(
      {
        stateVersion: SHARED_STATE_VERSION,
        outputState,
        eventOwnerState,
        taskOwnerState,
        taskTextState,
      },
      currentUser.email,
    )
      .then(() => {
        setSharedDocExists(true);
      })
      .catch((error) => {
        setSyncError(error?.message || "Could not seed cloud state.");
      });
  }, [
    canEdit,
    currentUser,
    eventOwnerState,
    firebaseEnabled,
    outputState,
    sharedDocExists,
    taskOwnerState,
    taskTextState,
  ]);

  function focusEvent(eventId, eventDate) {
    setSelectedMonth(monthKey(eventDate));
    setSelectedEventId(eventId);
  }

  function toggleFilter(filterId) {
    setFilters((current) => ({
      ...current,
      [filterId]: !current[filterId],
    }));
  }

  function jumpToAdjacentEvent(direction) {
    if (direction === "previous" && previousEvent) {
      focusEvent(previousEvent.id, previousEvent.eventDate);
    }
    if (direction === "next" && nextEvent) {
      focusEvent(nextEvent.id, nextEvent.eventDate);
    }
  }

  async function persistSharedState(
    nextOutputState,
    nextEventOwnerState,
    nextTaskOwnerState,
    nextTaskTextState,
    overrideEditorEmail,
  ) {
    if (!firebaseEnabled) {
      return;
    }

    await saveSharedState(
      {
        stateVersion: SHARED_STATE_VERSION,
        outputState: nextOutputState,
        eventOwnerState: nextEventOwnerState,
        taskOwnerState: nextTaskOwnerState,
        taskTextState: nextTaskTextState,
      },
      overrideEditorEmail ?? currentUser?.email ?? PRIMARY_MASTER_GOAT_EMAIL,
    );
    setSharedDocExists(true);
    setSyncError("");
  }

  async function commitOutputToggle(eventId, milestoneType, outputId, overrideEditorEmail) {
    const stateKey = outputStateKey(eventId, milestoneType, outputId);
    const event = boardEvents.find((item) => item.id === eventId);
    const milestone = event?.milestones.find((item) => item.type === milestoneType);
    const output = milestone?.outputs.find((item) => item.id === outputId);
    const fallbackValue = output?.done ?? false;
    const previousState = outputState;
    const nextState = {
      ...outputState,
      [stateKey]: !(outputState[stateKey] ?? fallbackValue),
    };

    setOutputState(nextState);

    if (!firebaseEnabled) {
      return;
    }

    try {
      await persistSharedState(
        nextState,
        eventOwnerState,
        taskOwnerState,
        taskTextState,
        overrideEditorEmail,
      );
    } catch (error) {
      setOutputState(previousState);
      setSyncError(error?.message || "Could not save checklist changes.");
    }
  }

  async function updateEventOwner(eventId, nextOwner) {
    if (!canEdit) {
      return;
    }

    const stateKey = eventOwnerStateKey(eventId);
    const previousState = eventOwnerState;
    const normalizedOwner = normalizeAssignee(nextOwner);
    const nextState = { ...eventOwnerState };

    if (normalizedOwner) {
      nextState[stateKey] = normalizedOwner;
    } else {
      delete nextState[stateKey];
    }

    setEventOwnerState(nextState);
    setOpenOwnerPickerKey(null);

    try {
      await persistSharedState(outputState, nextState, taskOwnerState, taskTextState);
    } catch (error) {
      setEventOwnerState(previousState);
      setSyncError(error?.message || "Could not save event owner.");
    }
  }

  async function updateTaskOwner(eventId, milestoneType, outputId, nextOwner) {
    if (!canEdit) {
      return;
    }

    const stateKey = taskOwnerStateKey(eventId, milestoneType, outputId);
    const previousState = taskOwnerState;
    const normalizedOwner = normalizeAssignee(nextOwner);
    const nextState = { ...taskOwnerState };

    if (normalizedOwner) {
      nextState[stateKey] = normalizedOwner;
    } else {
      delete nextState[stateKey];
    }

    setTaskOwnerState(nextState);
    setOpenOwnerPickerKey(null);

    try {
      await persistSharedState(outputState, eventOwnerState, nextState, taskTextState);
    } catch (error) {
      setTaskOwnerState(previousState);
      setSyncError(error?.message || "Could not save task owner.");
    }
  }

  async function updateTaskText(eventId, milestoneType, outputId, nextText) {
    if (!canEdit) {
      return;
    }

    const stateKey = taskTextStateKey(eventId, milestoneType, outputId);
    const previousState = taskTextState;
    const nextState = { ...taskTextState };
    const normalizedText = nextText;

    if (normalizedText.trim()) {
      nextState[stateKey] = normalizedText;
    } else {
      delete nextState[stateKey];
    }

    setTaskTextState(nextState);

    try {
      await persistSharedState(outputState, eventOwnerState, taskOwnerState, nextState);
    } catch (error) {
      setTaskTextState(previousState);
      setSyncError(error?.message || "Could not save volunteer name.");
    }
  }

  function toggleOwnerPicker(pickerKey) {
    if (!canEdit) {
      return;
    }

    setPickerPlacement({ vertical: "down", horizontal: "right" });
    setOpenOwnerPickerKey((current) => (current === pickerKey ? null : pickerKey));
  }

  async function toggleOutput(eventId, milestoneType, outputId) {
    if (!canEdit) {
      return;
    }

    await commitOutputToggle(eventId, milestoneType, outputId);
  }

  async function handleEventDateSave() {
    if (!selectedEvent || !canEdit || !eventDateDraft || typeof onUpdateEventDate !== "function") {
      return;
    }

    setIsSavingEventDate(true);
    setEventDateFeedback("");

    try {
      await onUpdateEventDate(selectedEvent.id, eventDateDraft);
      setEventDateFeedback("Saved. Public site dates and milestone deadlines are now in sync.");
    } catch (error) {
      setEventDateFeedback(error?.message || "Could not save the event date.");
    } finally {
      setIsSavingEventDate(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="backdrop-orb backdrop-orb-a" />
      <div className="backdrop-orb backdrop-orb-b" />

      <div className="page-header">
        <div>
          <div className="eyebrow">GetLoveYVR</div>
          <h1>Event calendar</h1>
          <p>
            Events live in the calendar, vacations live in availability, and milestone
            status only turns done when the required outputs are checked off.
          </p>
        </div>
        <div className="header-meta">
          <span>{formatDayLabel(todayKey)}</span>
          <span>{visibleEvents.length} visible events</span>
          <span>{alerts.length === 0 ? "All clear" : `${alerts.length} alerts`}</span>
        </div>
      </div>

      {syncError && (
        <div className="inline-alert tone-critical">
          <strong>Sync issue:</strong> {syncError}
        </div>
      )}

      <section className="alert-strip">
        {alerts.length === 0 ? (
          <div className="alert-card alert-card-ok">
            <div className="alert-card-title">All clear</div>
            <p>No overdue milestones, owner conflicts, or tentative near-term events.</p>
          </div>
        ) : (
          <>
            <div className="alert-summary">
              <div className="alert-summary-title">Anything wrong?</div>
              <div className="alert-summary-stats">
                <span className="pill tone-critical">{criticalCount} critical</span>
                <span className="pill tone-warning">{warningCount} warning</span>
              </div>
            </div>

            {alerts.slice(0, 4).map((alert) => (
              <button
                key={`${alert.eventId}-${alert.label}`}
                type="button"
                className={`alert-card tone-${SEVERITY_META[alert.severity].tone}`}
                onClick={() => focusEvent(alert.eventId, alert.eventDate)}
              >
                <div className="alert-card-topline">
                  <span className="pill subtle-pill">{alert.code}</span>
                  <span className={`pill tone-${SEVERITY_META[alert.severity].tone}`}>
                    {alert.label}
                  </span>
                </div>
                <strong>{alert.displayName}</strong>
                <p>{alert.message}</p>
              </button>
            ))}
          </>
        )}
      </section>

      <section className="control-bar">
        <div className="month-switcher">
          {monthOptions.map((month) => (
            <button
              key={month}
              type="button"
              className={month === selectedMonth ? "switch-chip active" : "switch-chip"}
              onClick={() => setSelectedMonth(month)}
            >
              {formatMonthLabel(month)}
            </button>
          ))}
        </div>

        <div className="filter-row">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`switch-chip filter-chip filter-chip-${filter.tone} ${filters[filter.id] ? "active" : ""}`}
              onClick={() => toggleFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {filters.vacations && (
        <section className="availability-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Availability</div>
              <h2>{formatMonthLabel(selectedMonth)}</h2>
            </div>
          </div>

          <div className="availability-rows">
            {availabilityRows.map((row) => (
              <div key={row.owner} className="availability-row">
                <div className="availability-owner">
                  <span className={`owner-tag owner-${row.tone}`}>{row.owner}</span>
                </div>
                <div className="availability-blocks">
                  {row.blocks.length === 0 ? (
                    <span className="availability-empty">Available all month</span>
                  ) : (
                    row.blocks.map((block) => (
                      <span
                        key={block.id}
                        className={`availability-chip tone-${block.tone}`}
                      >
                        {block.label} - {formatDateRange(block.start, block.end)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="main-layout">
        <div className="calendar-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Calendar</div>
              <h2>{formatMonthLabel(selectedMonth)}</h2>
            </div>
            <div className="panel-note">Events only</div>
          </div>

          <div className="calendar-headings">
            {DAY_NAMES.map((dayName) => (
              <div key={dayName} className="calendar-heading">
                {dayName}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarCells.map((cell) => {
              const dayEvents = monthEvents.filter((event) => event.eventDate === cell.date);
              const selectedDay = selectedEvent?.eventDate === cell.date;
              const today = cell.date === todayKey;

              return (
                <div
                  key={cell.date}
                  className={[
                    "calendar-day",
                    cell.inMonth ? "" : "calendar-day-muted",
                    selectedDay ? "selected" : "",
                    today ? "today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="calendar-day-topline">
                    <span className="calendar-day-number">{parseDate(cell.date).getDate()}</span>
                    {today && <span className="calendar-day-badge">Today</span>}
                  </div>

                  <div className="calendar-event-stack">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className={`event-pill ${toneForEvent(event)} ${selectedEvent?.id === event.id ? "active" : ""}`}
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        <div className="event-pill-topline">
                          <span className="event-code">{event.code}</span>
                          {event.issueCount > 0 && (
                            <span className="event-issue-count">{event.issueCount}</span>
                          )}
                        </div>
                        <strong>{event.displayName}</strong>
                        <small>{displayOwnerLabel(event.owner)}</small>
                      </button>
                    ))}
                    {dayEvents.length === 0 && <div className="calendar-empty" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="sidebar">
          <div
            className={[
              "detail-panel",
              openOwnerPickerKey ? "panel-menu-open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="section-header">
              <div className="selected-event-header">
                <div>
                  <div className="eyebrow">Selected event</div>
                  <h2>{selectedEvent ? selectedEvent.displayName : "No event visible"}</h2>
                </div>
                <div className="event-nav">
                  <button
                    type="button"
                    className="nav-button"
                    onClick={() => jumpToAdjacentEvent("previous")}
                    disabled={!previousEvent}
                    aria-label="Previous event"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    className="nav-button"
                    onClick={() => jumpToAdjacentEvent("next")}
                    disabled={!nextEvent}
                    aria-label="Next event"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>

            {selectedEvent ? (
              <>
                <div className="detail-summary">
                  <span className={`pill ${toneForEvent(selectedEvent)}`}>
                    {SEVERITY_META[selectedEvent.severity].label}
                  </span>
                  <span className="detail-date">{formatDayLabel(selectedEvent.eventDate)}</span>
                </div>

                <div className="detail-section detail-owner-card">
                  <div>
                    <h3>Event owner</h3>
                    <p>
                      Set the event lead here. Task owners below can inherit this lead or be assigned
                      individually.
                    </p>
                  </div>
                  <div
                    className={[
                      "detail-owner-controls",
                      "owner-picker-shell",
                      openOwnerPickerKey === "event" ? "menu-open" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <button
                      type="button"
                      className={`owner-tag owner-picker-trigger owner-${ownerTone(selectedEvent.owner)}`}
                      onClick={() => toggleOwnerPicker("event")}
                      aria-haspopup="menu"
                      aria-expanded={openOwnerPickerKey === "event"}
                    >
                      <span>{displayOwnerLabel(selectedEvent.owner)}</span>
                      <span className="owner-picker-chevron" aria-hidden="true">
                        {openOwnerPickerKey === "event" ? "^" : "v"}
                      </span>
                    </button>
                    {openOwnerPickerKey === "event" && canEdit && (
                      <div
                        ref={openMenuRef}
                        className={[
                          "owner-picker-menu",
                          pickerPlacement.vertical === "up" ? "menu-up" : "",
                          pickerPlacement.horizontal === "left" ? "menu-left" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        role="menu"
                        aria-label="Choose event owner"
                      >
                        <button
                          type="button"
                          className="owner-picker-option"
                          onClick={() => updateEventOwner(selectedEvent.id, "")}
                        >
                          Unassigned
                        </button>
                        {OWNER_OPTIONS.map((owner) => (
                          <button
                            key={owner}
                            type="button"
                            className={`owner-picker-option ${selectedEvent.owner === owner ? "active" : ""}`}
                            onClick={() => updateEventOwner(selectedEvent.id, owner)}
                          >
                            {owner}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-section detail-owner-card">
                  <div>
                    <h3>Event date</h3>
                    <p>
                      This is the shared source of truth. Save a new date here and the public site
                      plus all milestone deadlines update together.
                    </p>
                  </div>
                  <div className="detail-owner-controls date-editor-controls">
                    <label className="task-text-field">
                      <span className="output-owner-label">Live event date</span>
                      <input
                        type="date"
                        className="task-detail-input"
                        value={eventDateDraft}
                        onChange={(event) => setEventDateDraft(event.target.value)}
                        disabled={!canEdit || isSavingEventDate}
                      />
                    </label>
                    {canEdit ? (
                      <button
                        type="button"
                        className="auth-button auth-button-primary"
                        onClick={handleEventDateSave}
                        disabled={
                          !eventDateDraft ||
                          eventDateDraft === selectedEvent.eventDate ||
                          isSavingEventDate
                        }
                      >
                        {isSavingEventDate ? "Saving..." : "Save date"}
                      </button>
                    ) : (
                      <span className="pill tone-neutral">View-only goat status</span>
                    )}
                    {eventDateFeedback && <p className="sync-feedback">{eventDateFeedback}</p>}
                  </div>
                </div>

                {firebaseEnabled && !canEdit && (
                  <div className="readonly-banner">
                    <span>
                      Read-only goat mode. Only{" "}
                      <strong>{PRIMARY_MASTER_GOAT_EMAIL || "the master goat"}</strong> can edit.
                    </span>
                  </div>
                )}

                <div className="detail-section">
                  <div className="detail-section-header">
                    <h3>Milestones</h3>
                    <details className="content-guide">
                      <summary>Content key</summary>
                      <div className="content-guide-list">
                        {CONTENT_TYPE_GUIDE.map((item) => (
                          <div key={item.code} className="content-guide-item">
                            <div className="content-guide-topline">
                              <span className="pill tone-info">{item.code}</span>
                              <strong>{item.title}</strong>
                            </div>
                            <p>{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                  <p className="milestone-section-note">
                    Each milestone has a definition, timing rule, and required outputs.
                    A step only turns done when every output below is checked off.
                    Task owners can inherit the event lead or be assigned one by one.
                  </p>
                  <div className="milestone-list">
                    {selectedEvent.milestones.map((milestone) => {
                      const status = milestoneStatus(milestone.date, milestone.done, todayKey);
                      const conflict =
                        Boolean(selectedEvent.owner) &&
                        vacationLookup[selectedEvent.owner]?.has(milestone.date);

                      return (
                        <div key={milestone.type} className="milestone-row">
                          <div className="milestone-main">
                            <div className="milestone-title-group">
                              <strong>{milestone.label}</strong>
                              <div className="milestone-subline">
                                <span>{milestone.timing}</span>
                                <span>{formatShortDate(milestone.date)}</span>
                                <span className={`countdown-chip tone-${STATUS_META[status].tone}`}>
                                  {milestoneDeadlineLabel(milestone.date, milestone.done, todayKey)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="milestone-description">{milestone.summary}</p>
                          <div className="milestone-meta">
                            <span className={`pill tone-${STATUS_META[status].tone}`}>
                              {STATUS_META[status].label}
                            </span>
                            <span className="pill tone-neutral">
                              {milestone.doneCount}/{milestone.outputCount} outputs
                            </span>
                            {conflict && (
                              <span className="pill tone-critical">Owner away</span>
                            )}
                          </div>
                          <div className="output-list">
                            {milestone.outputs.map((output) => (
                              <div
                                key={output.id}
                                className={[
                                  "output-item",
                                  output.done ? "done" : "",
                                  openOwnerPickerKey === output.ownerStateKey ? "menu-open" : "",
                                  !canEdit ? "locked" : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                <label className="output-main">
                                  <input
                                    type="checkbox"
                                    checked={output.done}
                                    onChange={() =>
                                      toggleOutput(selectedEvent.id, milestone.type, output.id)
                                    }
                                  />
                                  <span>{output.label}</span>
                                </label>
                                <div
                                  className={[
                                    "output-owner-panel",
                                    "owner-picker-shell",
                                    openOwnerPickerKey === output.ownerStateKey ? "menu-open" : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                >
                                  <span className="output-owner-label">Task owner</span>
                                  <button
                                    type="button"
                                    className={`owner-tag owner-picker-trigger task-owner-trigger owner-${ownerTone(output.owner)}`}
                                    onClick={() => toggleOwnerPicker(output.ownerStateKey)}
                                    aria-haspopup="menu"
                                    aria-expanded={openOwnerPickerKey === output.ownerStateKey}
                                  >
                                    <span>{displayOwnerLabel(output.owner)}</span>
                                    <span className="owner-picker-chevron" aria-hidden="true">
                                      {openOwnerPickerKey === output.ownerStateKey ? "^" : "v"}
                                    </span>
                                  </button>
                                  {openOwnerPickerKey === output.ownerStateKey && canEdit && (
                                    <div
                                      ref={openMenuRef}
                                      className={[
                                        "owner-picker-menu",
                                        pickerPlacement.vertical === "up" ? "menu-up" : "",
                                        pickerPlacement.horizontal === "left" ? "menu-left" : "",
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                      role="menu"
                                      aria-label="Choose task owner"
                                    >
                                      <button
                                        type="button"
                                        className={`owner-picker-option ${!output.assignedOwner ? "active" : ""}`}
                                        onClick={() =>
                                          updateTaskOwner(
                                            selectedEvent.id,
                                            milestone.type,
                                            output.id,
                                            "",
                                          )
                                        }
                                      >
                                        {displayOwnerLabel(selectedEvent.owner)}
                                      </button>
                                      {OWNER_OPTIONS.filter((owner) => owner !== selectedEvent.owner).map((owner) => (
                                        <button
                                          key={owner}
                                          type="button"
                                          className={`owner-picker-option ${output.assignedOwner === owner ? "active" : ""}`}
                                          onClick={() =>
                                            updateTaskOwner(
                                              selectedEvent.id,
                                              milestone.type,
                                              output.id,
                                              owner,
                                            )
                                          }
                                        >
                                        {owner}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {output.id === "filmVolunteerConfirmed" && (
                                    <label className="task-text-field">
                                      <span className="output-owner-label">Confirmed name</span>
                                      <input
                                        type="text"
                                        className="task-detail-input"
                                        value={output.textValue}
                                        onChange={(event) =>
                                          updateTaskText(
                                            selectedEvent.id,
                                            milestone.type,
                                            output.id,
                                            event.target.value,
                                          )
                                        }
                                        placeholder="Volunteer name"
                                        disabled={!canEdit}
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">No events match the current filters.</div>
            )}
          </div>

          <div className="directory-panel">
            <div className="section-header">
              <div>
                <div className="eyebrow">Event directory</div>
                <h2>Event themes</h2>
              </div>
            </div>

            <div className="directory-list">
              {visibleEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={event.id === selectedEvent?.id ? "directory-item active" : "directory-item"}
                  onClick={() => focusEvent(event.id, event.eventDate)}
                >
                  <div className="directory-item-topline">
                    <span className={`pill ${toneForEvent(event)}`}>
                      {event.issueCount > 0 ? `${event.issueCount} issue${event.issueCount === 1 ? "" : "s"}` : "On track"}
                    </span>
                  </div>
                  <strong>{directoryEventName(event)}</strong>
                  <div className="directory-item-meta">
                    <span className="meta-chip">{formatShortDate(event.eventDate)}</span>
                    <span className={`meta-chip owner-chip owner-${ownerTone(event.owner)}`}>
                      {displayOwnerLabel(event.owner)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
