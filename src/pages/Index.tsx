import { useState } from "react";
import logo from "@/assets/logo.png";
import { Instagram, ExternalLink, ChevronLeft, ChevronRight, MapPin, Heart, Users, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// TikTok icon (not in lucide)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.84a4.84 4.84 0 01-1-.15z" />
  </svg>
);

const FLOCK_URL = "https://flocksocial.app/flocs/57c9a846-3663-4bec-85b8-60c01cd5e322?utm_source=ig&utm_medium=social&utm_content=link_in_bio";

interface EventInfo {
  date: number;
  month: number; // 0-indexed
  year: number;
  title: string;
  emoji: string;
  colorClass: string;
  tentative?: boolean;
}

const events: EventInfo[] = [
  { date: 26, month: 3, year: 2026, title: "Boxing", emoji: "🥊", colorClass: "bg-event-boxing" },
  { date: 3, month: 4, year: 2026, title: "Improv", emoji: "🎭", colorClass: "bg-event-improv" },
  { date: 10, month: 4, year: 2026, title: "Baking", emoji: "🧁", colorClass: "bg-event-baking" },
  { date: 24, month: 4, year: 2026, title: "Painting", emoji: "🎨", colorClass: "bg-event-painting" },
  { date: 31, month: 4, year: 2026, title: "Social / Bingo", emoji: "🎉", colorClass: "bg-event-social", tentative: true },
  { date: 7, month: 5, year: 2026, title: "TBD", emoji: "✨", colorClass: "bg-event-tbd", tentative: true },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCalendarDays(month: number, year: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

function getEventForDay(day: number, month: number, year: number) {
  return events.find(e => e.date === day && e.month === month && e.year === year);
}

const EventCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(3); // April
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);

  const days = getCalendarDays(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const monthEvents = events.filter(e => e.month === currentMonth && e.year === currentYear);

  return (
    <div className="max-w-lg mx-auto">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="Previous month">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-heading font-semibold">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="Next month">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const event = getEventForDay(day, currentMonth, currentYear);
          const isSelected = selectedEvent && selectedEvent.date === day && selectedEvent.month === currentMonth;
          return (
            <button
              key={day}
              onClick={() => event && setSelectedEvent(isSelected ? null : event)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                ${event ? "cursor-pointer font-semibold ring-2 ring-primary/30 hover:ring-primary/60 hover:scale-105" : "cursor-default"}
                ${isSelected ? "ring-2 ring-primary scale-105 bg-primary/10" : ""}
                ${!event ? "text-muted-foreground" : ""}
              `}
            >
              <span>{day}</span>
              {event && (
                <span className="text-base leading-none mt-0.5">{event.emoji}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected event detail */}
      {selectedEvent && selectedEvent.month === currentMonth && (
        <div className="mt-6 p-4 rounded-xl bg-card border animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedEvent.emoji}</span>
            <div>
              <p className="font-heading font-semibold text-lg">{selectedEvent.title}</p>
              <p className="text-sm text-muted-foreground">
                {MONTHS[selectedEvent.month]} {selectedEvent.date}, {selectedEvent.year}
                {selectedEvent.tentative && <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">Tentative</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Month events list (mobile-friendly) */}
      {monthEvents.length > 0 && !selectedEvent && (
        <div className="mt-6 space-y-2">
          {monthEvents.map(e => (
            <button
              key={`${e.month}-${e.date}`}
              onClick={() => setSelectedEvent(e)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border hover:border-primary/40 transition-colors text-left"
            >
              <span className="text-2xl">{e.emoji}</span>
              <div className="flex-1">
                <p className="font-heading font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {MONTHS[e.month]} {e.date}
                  {e.tentative && " · Tentative"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container max-w-5xl mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GetLoveYVR logo" className="w-8 h-8" loading="eager" />
            <span className="font-heading font-bold text-lg">GetLoveYVR</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#events" className="hover:text-primary transition-colors">Events</a>
            <a href="#join" className="hover:text-primary transition-colors">Join</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="https://www.instagram.com/getloveyvr" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 hover:text-primary transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://www.tiktok.com/@getloveyvr" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="p-2 hover:text-primary transition-colors">
              <TikTokIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <img src={logo} alt="GetLoveYVR heart logo" className="w-24 h-24 mx-auto mb-6" loading="eager" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold tracking-tight mb-4">
            Making modern dating<br />fun again 💖
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
            8 events. 10 weeks. Will you find love?<br />
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

      {/* About */}
      <section id="about" className="py-20 px-4 bg-secondary/50">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-12">
            Stop swiping. Start connecting.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Activity-Based</h3>
              <p className="text-sm text-muted-foreground">
                From boxing to baking — bond over real experiences, not awkward small talk.
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
                Meet singles in person. No catfishing, no ghosting — just genuine human connection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Calendar */}
      <section id="events" className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-4">
            Upcoming Events
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            Tap on a date to see event details. New events added regularly!
          </p>
          <EventCalendar />
        </div>
      </section>

      {/* CTA */}
      <section id="join" className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4">
            Ready to find love? 💕
          </h2>
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
            <a href="https://www.instagram.com/getloveyvr" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity" aria-label="Instagram">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="https://www.tiktok.com/@getloveyvr" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity" aria-label="TikTok">
              <TikTokIcon className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
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
          <p>© {new Date().getFullYear()} GetLoveYVR</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
