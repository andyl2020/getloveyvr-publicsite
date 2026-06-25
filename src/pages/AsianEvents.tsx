import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock,
  ExternalLink,
  Film,
  Filter,
  MapPin,
  Music,
  Search,
  Sparkles,
  Ticket,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type EventCategory = "Arts" | "Film" | "Food" | "Literary" | "Market" | "Festival";
type SourceType = "Official" | "Eventbrite" | "Meetup";

type SourceLink = {
  label: string;
  href: string;
  type: SourceType;
};

type AsianEvent = {
  id: string;
  title: string;
  culture: string;
  category: EventCategory;
  dateLabel: string;
  timeLabel: string;
  location: string;
  price: string;
  summary: string;
  tags: string[];
  dateSort: string;
  accentClass: string;
  sourceLinks: SourceLink[];
  featured?: boolean;
};

const logo = `${import.meta.env.BASE_URL}logo-mark.png`;

const eventCategoryIcons: Record<EventCategory, typeof Sparkles> = {
  Arts: Music,
  Film,
  Food: Utensils,
  Literary: BookOpen,
  Market: Ticket,
  Festival: Sparkles,
};

const asianEvents: AsianEvent[] = [
  {
    id: "richmond-night-market",
    title: "Richmond Night Market",
    culture: "Pan-Asian night market",
    category: "Market",
    dateLabel: "Weekends through September 20, 2026",
    timeLabel: "Fri/Sat/stat Sundays 7 PM-midnight; Sundays/stat holidays 7-11 PM",
    location: "8351 River Road, Richmond",
    price: "About $7; children under 7 and adults 60+ free",
    summary:
      "Metro Vancouver's large Asian-themed night market with food stalls, retail booths, entertainment and easy Bridgeport Station access.",
    tags: ["Pan-Asian", "Food", "Market", "Ongoing"],
    dateSort: "2026-06-25",
    accentClass: "bg-teal-600",
    sourceLinks: [{ label: "Official site", href: "https://www.richmondnightmarket.com/", type: "Official" }],
  },
  {
    id: "literasian",
    title: "LiterASIAN 2026: Re-Generation",
    culture: "Asian Canadian literature",
    category: "Literary",
    dateLabel: "June 27-28, 2026",
    timeLabel: "Panels and workshops from 1 PM to 7 PM",
    location: "Chinese Cultural Centre, Centre A, Chinatown Storytelling Centre and 1111 Union",
    price: "Mostly low-cost or free ticketed sessions",
    summary:
      "Canada's Asian Canadian writing festival returns with author panels, Chinatown walking tours, poetry chapbook workshops and community salons.",
    tags: ["Asian Canadian", "Literary", "Chinatown", "Eventbrite"],
    dateSort: "2026-06-27",
    accentClass: "bg-rose-600",
    featured: true,
    sourceLinks: [
      { label: "Festival schedule", href: "https://literasian.com/tickets/", type: "Official" },
      { label: "Eventbrite collection", href: "https://www.eventbrite.com/cc/literasian-2026-re-generation-4822894", type: "Eventbrite" },
    ],
  },
  {
    id: "taiwanese-canadian-cultural-festival",
    title: "Taiwanese Canadian Cultural Festival",
    culture: "Taiwanese Heritage Month",
    category: "Festival",
    dateLabel: "July 4-11, 2026",
    timeLabel: "Opening weekend starts July 4 at 2 PM",
    location: "Vancouver Art Gallery North Plaza and Burnaby Bonsor Recreation Complex",
    price: "Free admission",
    summary:
      "A Taiwan-focused summer program with traditional performance troupes, street food, workshops, artist alley, wellness activities and cinema.",
    tags: ["Taiwanese", "Food", "Arts", "Festival", "Free"],
    dateSort: "2026-07-04",
    accentClass: "bg-sky-600",
    featured: true,
    sourceLinks: [{ label: "Official program", href: "https://tccfestival.ca/", type: "Official" }],
  },
  {
    id: "indian-summer-festival",
    title: "Indian Summer Festival",
    culture: "South Asian arts",
    category: "Arts",
    dateLabel: "July 9-19, 2026",
    timeLabel: "Times vary by performance",
    location: "Venues across Vancouver, Burnaby and Surrey",
    price: "Ticketed; prices vary",
    summary:
      "A multidisciplinary South Asian arts festival with comedy, music, theatre, literature and interdisciplinary exchange under the 2026 theme Ragas for a Ruptured World.",
    tags: ["South Asian", "Arts", "Performance", "Festival"],
    dateSort: "2026-07-09",
    accentClass: "bg-amber-600",
    featured: true,
    sourceLinks: [{ label: "Official site", href: "https://indiansummerfest.ca/", type: "Official" }],
  },
  {
    id: "colour-fest",
    title: "Colour Fest 2026",
    culture: "South Asian Holi celebration",
    category: "Festival",
    dateLabel: "July 18, 2026",
    timeLabel: "Daytime festival",
    location: "Town Centre Park, Coquitlam",
    price: "$5 registration",
    summary:
      "Diwali Fest's summer Colour Fest brings a Holi-inspired community celebration to the Tri-Cities with colour, music and family-friendly cultural programming.",
    tags: ["South Asian", "Holi", "Festival", "Family"],
    dateSort: "2026-07-18",
    accentClass: "bg-fuchsia-600",
    sourceLinks: [{ label: "Diwali Fest listing", href: "https://diwalifest.ca/upcoming-events/", type: "Official" }],
  },
  {
    id: "korean-cultural-heritage-festival",
    title: "Korean Cultural Heritage Festival",
    culture: "Korean",
    category: "Festival",
    dateLabel: "July 18, 2026",
    timeLabel: "10 AM-8 PM",
    location: "Swangard Stadium, Burnaby",
    price: "Free entry",
    summary:
      "A full day of Korean cultural performances, traditional wedding ceremony, K-pop contest, taekwondo, food vendors, exhibitors and family activities.",
    tags: ["Korean", "Food", "Performance", "Free", "Meetup"],
    dateSort: "2026-07-18",
    accentClass: "bg-red-600",
    sourceLinks: [
      { label: "Official festival page", href: "https://kculture.ca/festival-2026/", type: "Official" },
      { label: "Meetup search listing", href: "https://www.meetup.com/find/ca--vancouver/korean/", type: "Meetup" },
    ],
  },
  {
    id: "surrey-fusion-festival",
    title: "Surrey Fusion Festival",
    culture: "Multicultural with Asian pavilions",
    category: "Festival",
    dateLabel: "July 18-19, 2026",
    timeLabel: "11 AM-10 PM",
    location: "Holland Park, Surrey",
    price: "Free admission",
    summary:
      "A large City of Surrey cultural festival with 50 pavilions, eight stages, food, music, cooking demos and a strong South Asian and pan-Asian presence.",
    tags: ["Multicultural", "South Asian", "Food", "Free"],
    dateSort: "2026-07-18",
    accentClass: "bg-emerald-600",
    sourceLinks: [{ label: "City of Surrey listing", href: "https://www.surrey.ca/news-events/events/surrey-fusion-festival-2026", type: "Official" }],
  },
  {
    id: "vancouver-chinatown-festival",
    title: "BMO Vancouver Chinatown Festival",
    culture: "Chinese Canadian",
    category: "Festival",
    dateLabel: "July 25-26, 2026",
    timeLabel: "12 PM-6 PM",
    location: "Keefer and Columbia Street, Vancouver",
    price: "Free admission",
    summary:
      "The 24th annual Chinatown Festival is a two-day community celebration with vendors, food trucks and summer programming in the heart of Chinatown.",
    tags: ["Chinese Canadian", "Chinatown", "Food", "Free"],
    dateSort: "2026-07-25",
    accentClass: "bg-orange-600",
    sourceLinks: [{ label: "Official festival page", href: "https://www.vancouver-chinatown.com/festival", type: "Official" }],
  },
  {
    id: "powell-street-festival",
    title: "Powell Street Festival",
    culture: "Japanese Canadian",
    category: "Festival",
    dateLabel: "August 1-2, 2026",
    timeLabel: "11:30 AM-7 PM",
    location: "Oppenheimer Park, Vancouver",
    price: "Free admission",
    summary:
      "The 50th Powell Street Festival celebrates Japanese Canadian art and culture with community programming around historic Paueru Gai.",
    tags: ["Japanese Canadian", "Arts", "Food", "Free"],
    dateSort: "2026-08-01",
    accentClass: "bg-pink-600",
    sourceLinks: [{ label: "Official site", href: "https://powellstreetfestival.com/", type: "Official" }],
  },
  {
    id: "thai-festival-vancouver",
    title: "Thai Festival Vancouver",
    culture: "Thai",
    category: "Food",
    dateLabel: "August 8-9, 2026",
    timeLabel: "11 AM-8 PM",
    location: "Vancouver Art Gallery",
    price: "Free admission",
    summary:
      "A downtown Thai culture and food festival with performances, vendors and family-friendly programming at the Vancouver Art Gallery.",
    tags: ["Thai", "Food", "Festival", "Eventbrite", "Free"],
    dateSort: "2026-08-08",
    accentClass: "bg-violet-600",
    sourceLinks: [{ label: "Eventbrite listing", href: "https://www.eventbrite.ca/e/thai-festival-vancouver-2026-tickets-1991398993998", type: "Eventbrite" }],
  },
  {
    id: "kimchi-k-food-festival",
    title: "Kimchi & K-Food Festival",
    culture: "Korean food and culture",
    category: "Food",
    dateLabel: "August 28-29, 2026",
    timeLabel: "11 AM-8 PM",
    location: "Coquitlam Town Centre Park",
    price: "Free admission",
    summary:
      "Western Canada's Korean food and cultural festival with K-street food, hanbok photo zone, K-beauty workshops, performances and dance battles.",
    tags: ["Korean", "Food", "Performance", "Free"],
    dateSort: "2026-08-28",
    accentClass: "bg-lime-700",
    sourceLinks: [{ label: "Official site", href: "https://www.kimchifest.ca/", type: "Official" }],
  },
  {
    id: "mamm-gala",
    title: "MAMM21 Gala Screening & Awards",
    culture: "Asian Canadian film",
    category: "Film",
    dateLabel: "August 29, 2026",
    timeLabel: "Evening screening; time TBA",
    location: "Vancouver; venue TBA",
    price: "Ticket details TBA",
    summary:
      "VAFF's Mighty Asian Moviemaking Marathon screens finished short films from emerging Asian and mixed Asian Canadian filmmakers.",
    tags: ["Asian Canadian", "Film", "Arts"],
    dateSort: "2026-08-29",
    accentClass: "bg-indigo-600",
    sourceLinks: [{ label: "VAFF MAMM page", href: "https://vaff.org/mamm/", type: "Official" }],
  },
  {
    id: "nikkei-matsuri",
    title: "Nikkei Matsuri",
    culture: "Japanese Canadian",
    category: "Festival",
    dateLabel: "September 4-6, 2026",
    timeLabel: "Matsuri Eve starts September 4 at 3 PM",
    location: "Nikkei National Museum & Cultural Centre, Burnaby",
    price: "Admission varies; free community booth zone",
    summary:
      "A Japanese summer festival with taiko, traditional dance, martial arts, J-pop, yatai street food, tea lounge, sake garden and community booths.",
    tags: ["Japanese Canadian", "Food", "Performance", "Family"],
    dateSort: "2026-09-04",
    accentClass: "bg-cyan-700",
    sourceLinks: [{ label: "Nikkei Centre listing", href: "https://centre.nikkeiplace.org/events/nikkei-matsuri-2026/", type: "Official" }],
  },
  {
    id: "vancouver-taiwanfest",
    title: "Vancouver TAIWANfest",
    culture: "Taiwanese",
    category: "Arts",
    dateLabel: "September 5-7, 2026",
    timeLabel: "Noon start; venue times vary",
    location: "Vancouver Art Gallery North Plaza, Granville Street, Vancouver Playhouse and more",
    price: "Free admission for outdoor festival",
    summary:
      "The 2026 theme Islands in the Wind explores Taiwan's dialogue with Scotland through live performance, films, talks, food, exhibitions and workshops.",
    tags: ["Taiwanese", "Arts", "Food", "Film", "Free"],
    dateSort: "2026-09-05",
    accentClass: "bg-blue-700",
    sourceLinks: [{ label: "Official site", href: "https://vancouvertaiwanfest.ca/", type: "Official" }],
  },
  {
    id: "isaff",
    title: "International South Asian Film Festival",
    culture: "South Asian film",
    category: "Film",
    dateLabel: "September 23-27, 2026",
    timeLabel: "Schedule varies",
    location: "Guildford, Surrey",
    price: "Passes and tickets available",
    summary:
      "iSAFF 2026: Dreamscapes focuses on South Asian filmmakers expanding narrative, form and perspective across documentaries, shorts and features.",
    tags: ["South Asian", "Film", "Arts", "Surrey"],
    dateSort: "2026-09-23",
    accentClass: "bg-purple-700",
    sourceLinks: [{ label: "Official festival page", href: "https://isaff.ca/film-festival/", type: "Official" }],
  },
  {
    id: "diwali-fest",
    title: "Diwali Fest 2026",
    culture: "South Asian",
    category: "Festival",
    dateLabel: "October 24-November 15, 2026",
    timeLabel: "Times vary by city",
    location: "New Westminster, Surrey, Coquitlam and Vancouver",
    price: "Free admission",
    summary:
      "A Lower Mainland series of Diwali arts and culture celebrations with music, dance, chai, South Asian royal traditions and family-friendly programming.",
    tags: ["South Asian", "Diwali", "Arts", "Free"],
    dateSort: "2026-10-24",
    accentClass: "bg-yellow-600",
    sourceLinks: [{ label: "Official upcoming events", href: "https://diwalifest.ca/upcoming-events/", type: "Official" }],
  },
  {
    id: "vaff",
    title: "Vancouver Asian Film Festival",
    culture: "Pan-Asian diaspora film",
    category: "Film",
    dateLabel: "November 5-15, 2026",
    timeLabel: "Program announced in fall 2026",
    location: "Hybrid festival with Vancouver screenings",
    price: "Ticket details TBA",
    summary:
      "VAFF30 marks the longest-running pan-Asian diaspora film festival in Canada, with screenings, talks, industry sessions and Asian representation in media.",
    tags: ["Pan-Asian", "Film", "Arts"],
    dateSort: "2026-11-05",
    accentClass: "bg-zinc-700",
    sourceLinks: [{ label: "VAFF festival details", href: "https://vaff.org/open-call/", type: "Official" }],
  },
];

const filterOptions = [
  { id: "all", label: "All", match: () => true },
  { id: "free", label: "Free", match: (event: AsianEvent) => event.tags.includes("Free") },
  { id: "south-asian", label: "South Asian", match: (event: AsianEvent) => event.tags.includes("South Asian") },
  { id: "east-asian", label: "East Asian", match: (event: AsianEvent) => ["Chinese Canadian", "Japanese Canadian", "Korean", "Taiwanese"].some((tag) => event.tags.includes(tag)) },
  { id: "food", label: "Food", match: (event: AsianEvent) => event.tags.includes("Food") },
  { id: "film-arts", label: "Film & Arts", match: (event: AsianEvent) => event.category === "Film" || event.category === "Arts" || event.category === "Literary" },
  { id: "eventbrite", label: "Eventbrite", match: (event: AsianEvent) => event.sourceLinks.some((source) => source.type === "Eventbrite") },
  { id: "meetup", label: "Meetup", match: (event: AsianEvent) => event.sourceLinks.some((source) => source.type === "Meetup") },
];

const sourceLinkCount = asianEvents.reduce((total, event) => total + event.sourceLinks.length, 0);
const marketplaceSourceCount = asianEvents.reduce(
  (total, event) => total + event.sourceLinks.filter((source) => source.type !== "Official").length,
  0,
);

function installHiddenPageMeta() {
  const previousTitle = document.title;
  const existingRobotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  const previousRobotsContent = existingRobotsMeta?.getAttribute("content") ?? null;
  const robotsMeta = existingRobotsMeta ?? document.createElement("meta");

  if (!existingRobotsMeta) {
    robotsMeta.setAttribute("name", "robots");
    document.head.appendChild(robotsMeta);
  }

  document.title = "Asian Cultural Events | GetLoveYVR";
  robotsMeta.setAttribute("content", "noindex, nofollow");

  return () => {
    document.title = previousTitle;

    if (previousRobotsContent) {
      robotsMeta.setAttribute("content", previousRobotsContent);
      return;
    }

    if (!existingRobotsMeta) {
      robotsMeta.remove();
    }
  };
}

const AsianEvents = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => installHiddenPageMeta(), []);

  const activeFilterOption = filterOptions.find((filter) => filter.id === activeFilter) ?? filterOptions[0];
  const normalizedQuery = query.trim().toLowerCase();

  const filteredEvents = useMemo(() => {
    return asianEvents.filter((event) => {
      const matchesFilter = activeFilterOption.match(event);
      const searchableText = [
        event.title,
        event.culture,
        event.category,
        event.location,
        event.summary,
        ...event.tags,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeFilterOption, normalizedQuery]);

  const featuredEvents = asianEvents.filter((event) => event.featured);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf4_0%,#ffffff_34%,#f7fbf8_100%)] text-foreground">
      <header className="border-b border-border/70 bg-background/88 backdrop-blur">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img src={logo} alt="GetLoveYVR logo" className="h-8 w-8 shrink-0" loading="eager" />
            <span className="truncate font-heading text-lg font-bold">GetLoveYVR</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              Main site
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b border-border/70 px-4 py-10 sm:py-14">
          <div className="container mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-950">
                <Sparkles className="h-4 w-4" />
                Updated June 25, 2026
              </div>
              <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-5xl">
                Asian cultural events around Vancouver
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                A curated list of higher-quality cultural festivals, film nights, food events, markets, literature
                gatherings and arts programs across Metro Vancouver. Every listing links back to its source.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-border bg-background/85 p-4 shadow-sm">
                <p className="text-3xl font-heading font-bold">{asianEvents.length}</p>
                <p className="text-sm text-muted-foreground">Curated listings</p>
              </div>
              <div className="rounded-lg border border-border bg-background/85 p-4 shadow-sm">
                <p className="text-3xl font-heading font-bold">{sourceLinkCount}</p>
                <p className="text-sm text-muted-foreground">Source links</p>
              </div>
              <div className="rounded-lg border border-border bg-background/85 p-4 shadow-sm">
                <p className="text-3xl font-heading font-bold">{marketplaceSourceCount}</p>
                <p className="text-sm text-muted-foreground">Eventbrite/Meetup picks</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Next up
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {featuredEvents.map((event) => (
                <FeaturedEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search culture, city, food, film or festival"
                  className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </label>

              <div className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Event filters">
                <Filter className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                {filterOptions.map((filter) => {
                  const isActive = filter.id === activeFilter;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={[
                        "shrink-0 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent",
                      ].join(" ")}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredEvents.length} of {asianEvents.length} listings
            </div>

            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const FeaturedEventCard = ({ event }: { event: AsianEvent }) => {
  const CategoryIcon = eventCategoryIcons[event.category];

  return (
    <article className="relative overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className={`h-2 ${event.accentClass}`} />
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            <CategoryIcon className="h-3.5 w-3.5" />
            {event.category}
          </span>
          <span className="text-xs font-medium text-muted-foreground">{event.culture}</span>
        </div>
        <h2 className="font-heading text-xl font-semibold leading-snug">{event.title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.summary}</p>
        <div className="mt-4 space-y-2 text-sm">
          <IconRow icon={CalendarDays} text={event.dateLabel} />
          <IconRow icon={MapPin} text={event.location} />
        </div>
        <SourceLinks links={event.sourceLinks} className="mt-5" />
      </div>
    </article>
  );
};

const EventCard = ({ event }: { event: AsianEvent }) => {
  const CategoryIcon = eventCategoryIcons[event.category];

  return (
    <article className="grid gap-0 overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-colors hover:border-primary/35 md:grid-cols-[10px_1fr]">
      <div className={`hidden md:block ${event.accentClass}`} />
      <div className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-sm ${event.accentClass}`} />
              <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                <CategoryIcon className="h-3.5 w-3.5" />
                {event.category}
              </span>
              <span className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {event.culture}
              </span>
            </div>

            <h2 className="break-words font-heading text-2xl font-semibold leading-tight">{event.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{event.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-secondary/70 p-4">
            <div className="space-y-3 text-sm">
              <IconRow icon={CalendarDays} text={event.dateLabel} />
              <IconRow icon={Clock} text={event.timeLabel} />
              <IconRow icon={MapPin} text={event.location} />
              <IconRow icon={Ticket} text={event.price} />
            </div>
            <SourceLinks links={event.sourceLinks} className="mt-5" />
          </div>
        </div>
      </div>
    </article>
  );
};

const IconRow = ({ icon: Icon, text }: { icon: typeof CalendarDays; text: string }) => (
  <div className="flex min-w-0 gap-2">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <span className="min-w-0 break-words">{text}</span>
  </div>
);

const SourceLinks = ({ links, className = "" }: { links: SourceLink[]; className?: string }) => (
  <div className={`flex flex-wrap gap-2 ${className}`}>
    {links.map((link) => (
      <a
        key={`${link.type}-${link.href}`}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        <span className="break-words">{link.label}</span>
      </a>
    ))}
  </div>
);

export default AsianEvents;
