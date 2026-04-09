import { useState } from "react";
import logo from "@/assets/logo.png";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Instagram,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.18 8.18 0 0 0 4.77 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
  </svg>
);

const FLOCK_URL =
  "https://flocksocial.app/flocs/57c9a846-3663-4bec-85b8-60c01cd5e322?utm_source=ig&utm_medium=social&utm_content=link_in_bio";

interface EventInfo {
  seriesNumber: number;
  date: number;
  month: number;
  year: number;
  title: string;
  emoji: string;
  colorClass: string;
  tentative?: boolean;
}

const events: EventInfo[] = [
  { seriesNumber: 1, date: 26, month: 3, year: 2026, title: "Boxing", emoji: "\u{1F94A}", colorClass: "bg-event-boxing" },
  { seriesNumber: 2, date: 3, month: 4, year: 2026, title: "Improv", emoji: "\u{1F3AD}", colorClass: "bg-event-improv" },
  { seriesNumber: 3, date: 10, month: 4, year: 2026, title: "Baking", emoji: "\u{1F9C1}", colorClass: "bg-event-baking" },
  { seriesNumber: 4, date: 24, month: 4, year: 2026, title: "Painting", emoji: "\u{1F3A8}", colorClass: "bg-event-painting" },
  { seriesNumber: 5, date: 31, month: 4, year: 2026, title: "Social / Bingo", emoji: "\u{1F389}", colorClass: "bg-event-social", tentative: true },
  { seriesNumber: 6, date: 7, month: 5, year: 2026, title: "TBD", emoji: "\u{2728}", colorClass: "bg-event-tbd", tentative: true },
  { seriesNumber: 7, date: 21, month: 5, year: 2026, title: "TBD", emoji: "\u{2728}", colorClass: "bg-event-tbd" },
  { seriesNumber: 8, date: 28, month: 5, year: 2026, title: "TBD", emoji: "\u{2728}", colorClass: "bg-event-tbd" },
];

const TOTAL_EVENTS = events.length;
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

function getEventForDay(day: number, month: number, year: number) {
  return events.find((event) => event.date === day && event.month === month && event.year === year);
}

function getEventLabel(event: EventInfo) {
  return `Event ${event.seriesNumber} of ${TOTAL_EVENTS}`;
}

const EventCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(3);
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);

  const days = getCalendarDays(currentMonth, currentYear);
  const monthEvents = events.filter((event) => event.month === currentMonth && event.year === currentYear);
  const showMonthList = !selectedEvent || selectedEvent.month !== currentMonth || selectedEvent.year !== currentYear;

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

          const event = getEventForDay(day, currentMonth, currentYear);
          const isSelected =
            selectedEvent &&
            selectedEvent.date === day &&
            selectedEvent.month === currentMonth &&
            selectedEvent.year === currentYear;

          return (
            <button
              key={day}
              type="button"
              onClick={() => event && setSelectedEvent(isSelected ? null : event)}
              className={[
                "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all",
                event ? "cursor-pointer font-semibold ring-2 ring-primary/30 hover:ring-primary/60 hover:scale-105" : "cursor-default",
                isSelected ? "ring-2 ring-primary scale-105 bg-primary/10" : "",
                !event ? "text-muted-foreground" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span>{day}</span>
              {event && <span className="text-base leading-none mt-0.5">{event.emoji}</span>}
            </button>
          );
        })}
      </div>

      {selectedEvent && selectedEvent.month === currentMonth && selectedEvent.year === currentYear && (
        <div className="mt-6 p-4 rounded-xl bg-card border animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedEvent.emoji}</span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {getEventLabel(selectedEvent)}
                </p>
                <p className="font-heading font-semibold text-lg">{selectedEvent.title}</p>
                <p className="text-sm text-muted-foreground">
                  {MONTHS[selectedEvent.month]} {selectedEvent.date}, {selectedEvent.year}
                  {selectedEvent.tentative && (
                    <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">Tentative</span>
                  )}
                </p>
              </div>
            </div>
            <Button size="sm" asChild className="sm:self-start">
              <a href={FLOCK_URL} target="_blank" rel="noopener noreferrer">
                Join
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      )}

      {monthEvents.length > 0 && showMonthList && (
        <div className="mt-6 space-y-2">
          {monthEvents.map((event) => (
            <div
              key={`${event.month}-${event.date}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:border-primary/40 transition-colors"
            >
              <button
                type="button"
                onClick={() => setSelectedEvent(event)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span className="text-2xl">{event.emoji}</span>
                <div className="flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {getEventLabel(event)}
                  </p>
                  <p className="font-heading font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {MONTHS[event.month]} {event.date}
                    {event.tentative && " · Tentative"}
                  </p>
                </div>
              </button>
              <Button size="sm" variant="outline" asChild>
                <a href={FLOCK_URL} target="_blank" rel="noopener noreferrer">
                  Join
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Index = () => {
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
            Making modern dating
            <br />
            fun again 💖
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
            8 events. 10 weeks. Will you find love?
            <br />
            Activity-based singles events in Vancouver.
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

      <section id="about" className="py-20 px-4 bg-secondary/50">
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
            Tap on a date to see event details. New events added regularly!
          </p>
          <EventCalendar />
        </div>
      </section>

      <section id="join" className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4">Ready to find love? 💕</h2>
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
