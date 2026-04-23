import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type SyntheticEvent as ReactSyntheticEvent } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  ExternalLink,
  Heart,
  Instagram,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type EventScheduleEntry, getEventCalendarParts, isSinglesSeriesEvent } from "@/data/eventSchedule";
import { useEventSchedule } from "@/hooks/useEventSchedule";
import NotFound from "./NotFound";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.18 8.18 0 0 0 4.77 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
  </svg>
);

const logo = `${import.meta.env.BASE_URL}logo-mark.png`;
const FLOCK_URL = "https://flocksocial.app/flocks/57c9a846-3663-4bec-85b8-60c01cd5e322";
const BASE_PATH = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
const COPY_NOTICE_DURATION_MS = 1400;
const LONG_PRESS_DURATION_MS = 600;
const FOCUS_GLOW_DURATION_MS = 3200;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCalendarDays(month: number, year: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i += 1) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i += 1) {
    days.push(i);
  }

  return days;
}

function getEventForDay(events: EventScheduleEntry[], day: number, month: number, year: number) {
  return events.find((event) => {
    const parts = getEventCalendarParts(event.eventDate);
    return parts.date === day && parts.month === month && parts.year === year;
  });
}

function getSinglesSeriesCount(events: EventScheduleEntry[]) {
  return events.filter(isSinglesSeriesEvent).length;
}

function getEventLabel(event: EventScheduleEntry, totalSinglesEvents: number) {
  if (isSinglesSeriesEvent(event)) {
    return `Singles Event ${event.seriesNumber} of ${totalSinglesEvents}`;
  }

  return "Friends Event";
}

function findEventBySlug(events: EventScheduleEntry[], eventSlug?: string) {
  if (!eventSlug) {
    return undefined;
  }

  return events.find((event) => event.slug === eventSlug || event.shareSlug === eventSlug);
}

function isJoinAvailable(event: EventScheduleEntry) {
  return Boolean(event.joinUrl && event.publicJoinEnabled !== false);
}

function getEventSharePath(event: EventScheduleEntry) {
  return `${BASE_PATH}/${event.shareSlug}`;
}

function getEventShareUrl(event: EventScheduleEntry) {
  return new URL(getEventSharePath(event), window.location.origin).toString();
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

const EventCalendar = ({
  events,
  targetedEvent,
}: {
  events: EventScheduleEntry[];
  targetedEvent?: EventScheduleEntry;
}) => {
  const initialEvent = targetedEvent ?? events[0];
  const initialParts = initialEvent ? getEventCalendarParts(initialEvent.eventDate) : undefined;
  const [today, setToday] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => initialParts?.month ?? new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => initialParts?.year ?? new Date().getFullYear());
  const [pendingFocusSlug, setPendingFocusSlug] = useState<string | null>(targetedEvent?.slug ?? null);
  const [glowingSlug, setGlowingSlug] = useState<string | null>(null);
  const [copyDialogMessage, setCopyDialogMessage] = useState<string | null>(null);
  const copyDialogTimeoutRef = useRef<number | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const suppressNextClickRef = useRef(false);

  const days = getCalendarDays(currentMonth, currentYear);
  const totalSinglesEvents = getSinglesSeriesCount(events);
  const monthEvents = events.filter((event) => {
    const parts = getEventCalendarParts(event.eventDate);
    return parts.month === currentMonth && parts.year === currentYear;
  });
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();
  const todayYear = today.getFullYear();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setToday(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copyDialogTimeoutRef.current) {
        window.clearTimeout(copyDialogTimeoutRef.current);
      }
      if (longPressTimeoutRef.current) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!targetedEvent) {
      return;
    }

    setPendingFocusSlug(targetedEvent.slug);
    const parts = getEventCalendarParts(targetedEvent.eventDate);
    setCurrentMonth(parts.month);
    setCurrentYear(parts.year);
  }, [targetedEvent]);

  useEffect(() => {
    if (!pendingFocusSlug) {
      return;
    }

    const focusedEvent = events.find((event) => event.slug === pendingFocusSlug);

    if (!focusedEvent) {
      setPendingFocusSlug(null);
      return;
    }

    const focusedEventParts = getEventCalendarParts(focusedEvent.eventDate);
    if (currentMonth !== focusedEventParts.month || currentYear !== focusedEventParts.year) {
      return;
    }

    let glowTimeoutId: number | undefined;
    const frameId = window.requestAnimationFrame(() => {
      const targetElement = document.getElementById(`event-card-${pendingFocusSlug}`);

      if (!targetElement) {
        return;
      }

      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setGlowingSlug(pendingFocusSlug);
      setPendingFocusSlug(null);
      glowTimeoutId = window.setTimeout(() => {
        setGlowingSlug((currentSlug) => (currentSlug === pendingFocusSlug ? null : currentSlug));
      }, FOCUS_GLOW_DURATION_MS);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (glowTimeoutId) {
        window.clearTimeout(glowTimeoutId);
      }
    };
  }, [currentMonth, currentYear, events, pendingFocusSlug]);

  const showCopyDialog = (message: string) => {
    setCopyDialogMessage(message);
    if (copyDialogTimeoutRef.current) {
      window.clearTimeout(copyDialogTimeoutRef.current);
    }
    copyDialogTimeoutRef.current = window.setTimeout(() => {
      setCopyDialogMessage(null);
    }, COPY_NOTICE_DURATION_MS);
  };

  const copyEventLink = async (event: EventScheduleEntry) => {
    try {
      await copyTextToClipboard(getEventShareUrl(event));
      showCopyDialog("Event link copied");
    } catch {
      showCopyDialog("Could not copy event link");
    }
  };

  const clearLongPress = () => {
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const startLongPressCopy = (event: EventScheduleEntry) => {
    clearLongPress();
    suppressNextClickRef.current = false;
    longPressTimeoutRef.current = window.setTimeout(() => {
      suppressNextClickRef.current = true;
      void copyEventLink(event);
    }, LONG_PRESS_DURATION_MS);
  };

  const handleEventClickCapture = (event: ReactSyntheticEvent) => {
    if (!suppressNextClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressNextClickRef.current = false;
  };

  const getCopyInteractionProps = (event: EventScheduleEntry) => ({
    onContextMenu: (domEvent: ReactMouseEvent<HTMLElement>) => {
      domEvent.preventDefault();
      domEvent.stopPropagation();
      void copyEventLink(event);
    },
    onTouchStart: () => {
      startLongPressCopy(event);
    },
    onTouchEnd: clearLongPress,
    onTouchCancel: clearLongPress,
    onTouchMove: clearLongPress,
    onClickCapture: handleEventClickCapture,
    title: `Right-click or press and hold to copy the link for ${event.title}`,
  });

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((year) => year - 1);
      return;
    }
    setCurrentMonth((month) => month - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((year) => year + 1);
      return;
    }
    setCurrentMonth((month) => month + 1);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-heading font-semibold">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((dayLabel) => (
          <div key={dayLabel} className="text-center text-xs font-medium text-muted-foreground py-1">
            {dayLabel}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />;
          }

          const event = getEventForDay(events, day, currentMonth, currentYear);
          const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
          const isFocusedEvent = event?.slug === glowingSlug;
          const copyInteractionProps = event ? getCopyInteractionProps(event) : undefined;

          return (
            <div
              key={day}
              className={[
                "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm",
                isToday ? "font-semibold ring-2 ring-primary/40 bg-primary/15 text-primary shadow-sm" : "",
                isFocusedEvent ? "event-focus-glow ring-2 ring-primary/55 bg-primary/12 text-primary shadow-sm" : "",
                !isToday && event && !isFocusedEvent ? "font-semibold ring-2 ring-primary/30 bg-primary/5" : "",
                !event && !isToday ? "text-muted-foreground" : "",
                event ? "cursor-context-menu select-none" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              {...copyInteractionProps}
            >
              <span>{day}</span>
              {event && <span className="text-base leading-none mt-0.5">{event.emoji}</span>}
            </div>
          );
        })}
      </div>

      {monthEvents.length > 0 && (
        <div className="mt-6 space-y-2">
          {monthEvents.map((event) => {
            const joinAvailable = isJoinAvailable(event);
            const eventParts = getEventCalendarParts(event.eventDate);

            return (
              <div
                id={`event-card-${event.slug}`}
                key={event.id}
                className={[
                  "flex items-center gap-3 p-3 rounded-xl bg-card border hover:border-primary/40 transition-colors scroll-mt-32 cursor-context-menu select-none",
                  glowingSlug === event.slug ? "event-focus-glow border-primary/55 shadow-lg" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                {...getCopyInteractionProps(event)}
              >
                <div className="flex flex-1 items-center gap-3 text-left">
                  <span className="text-2xl">{event.emoji}</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {getEventLabel(event, totalSinglesEvents)}
                    </p>
                    <p className="font-heading font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {MONTHS[eventParts.month]} {eventParts.date}
                      {event.time && ` - ${event.time}`}
                      {event.tentative && " - Tentative"}
                    </p>
                  </div>
                </div>
                {joinAvailable ? (
                  <Button size="sm" variant="outline" asChild>
                    <a href={event.joinUrl} target="_blank" rel="noopener noreferrer">
                      Join
                    </a>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                    className="cursor-not-allowed bg-muted text-muted-foreground disabled:opacity-100"
                  >
                    TBD
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(copyDialogMessage)} onOpenChange={() => setCopyDialogMessage(null)}>
        <DialogContent className="max-w-xs text-center [&>button]:hidden">
          <DialogHeader className="text-center">
            <DialogTitle>{copyDialogMessage}</DialogTitle>
            <DialogDescription>Right-click or press and hold any event to copy its direct link.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Index = () => {
  const location = useLocation();
  const { eventSlug } = useParams();
  const { schedule: events } = useEventSchedule();
  const totalSinglesEvents = getSinglesSeriesCount(events);
  const targetedEvent = findEventBySlug(events, eventSlug);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.slice(1);
    const frameId = window.requestAnimationFrame(() => {
      const targetElement = document.getElementById(targetId);

      if (!targetElement) {
        return;
      }

      const headerOffset = 96;
      const targetTop = Math.max(targetElement.getBoundingClientRect().top + window.scrollY - headerOffset, 0);

      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.hash]);

  if (eventSlug && !targetedEvent) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container max-w-5xl mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GetLoveYVR logo" className="w-8 h-8" loading="eager" />
            <span className="font-heading font-bold text-lg">GetLoveYVR</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <a href="#about" className="hover:text-primary transition-colors">
              About
            </a>
            <a href="#events" className="hover:text-primary transition-colors">
              Events
            </a>
            <a href="#join" className="hover:text-primary transition-colors">
              Join
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild className="rounded-full px-4">
              <Link to="/dashboard">
                <DoorOpen className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
            <a
              href="https://www.instagram.com/getloveyvr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-2 hover:text-primary transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.tiktok.com/@getloveyvr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="p-2 hover:text-primary transition-colors"
            >
              <TikTokIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <img src={logo} alt="GetLoveYVR heart logo" className="w-24 h-24 mx-auto mb-6" loading="eager" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold tracking-tight mb-4">
            Meet your person
            <br />
            in real life.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
            {totalSinglesEvents} activity-based singles events in Vancouver.
            <br />
            Will you find love?
            <br />
            Come find out!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="text-base px-8">
              <a href="#events">
                <CalendarIcon className="w-4 h-4 mr-2" />
                View Events
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <a href={FLOCK_URL} target="_blank" rel="noopener noreferrer">
                Join the Community
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section id="about" className="py-20 px-4 bg-secondary border-y border-border/70">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-12">Stop swiping. Start connecting.</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Activity-Based</h3>
              <p className="text-sm text-muted-foreground">
                From boxing to baking - bond over real experiences, not awkward small talk.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Low Pressure</h3>
              <p className="text-sm text-muted-foreground">
                No forced conversations. Just show up, have fun, and let connections happen naturally.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Real People</h3>
              <p className="text-sm text-muted-foreground">
                Meet singles in person. No catfishing, no ghosting - just genuine human connection.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="events" className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-4">Upcoming Events</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            Browse the month and use Join when an event feels like your kind of night.
          </p>
          <EventCalendar events={events} targetedEvent={targetedEvent} />
        </div>
      </section>

      <section id="join" className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4">Ready to find love?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-md mx-auto">
            Join our community on Flock Social to get event updates, meet other singles, and RSVP.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8">
            <a href={FLOCK_URL} target="_blank" rel="noopener noreferrer">
              Join GetLoveYVR
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <div className="flex items-center justify-center gap-4 mt-8">
            <a
              href="https://www.instagram.com/getloveyvr"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Instagram"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a
              href="https://www.tiktok.com/@getloveyvr"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
              aria-label="TikTok"
            >
              <TikTokIcon className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 pb-10">
        <div className="container max-w-3xl mx-auto">
          <div className="rounded-full border border-border/70 bg-background/80 px-5 py-3 text-center text-sm text-muted-foreground shadow-sm">
            Want to reach me directly?{" "}
            <a
              href="https://www.instagram.com/aluu.me"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary"
            >
              Contact me on Instagram
            </a>
            .
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t">
        <div className="container max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="w-5 h-5" loading="lazy" />
            <span className="font-heading font-medium">GetLoveYVR</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>Vancouver, BC, Canada</span>
          </div>
          <p>&copy; {new Date().getFullYear()} GetLoveYVR</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
