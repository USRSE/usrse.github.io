import { Link } from "react-router-dom";
import { EventsLayout } from "@/components/events/EventsLayout";
import { useInView } from "@/hooks/useInView";
import { useEvents, type PublicEvent } from "@/hooks/useEvents";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "Oct 19–21", label: "Next conference" },
  { value: "Monthly", label: "Community calls" },
  { value: "Zoom", label: "Recurring gatherings" },
  { value: "All members", label: "Welcome" },
];

interface RecurringEvent {
  name: string;
  eyebrow: string;
  schedule: string;
  months: string[];
  platform: string;
  accent: "teal" | "purple";
}

const recurringEvents: RecurringEvent[] = [
  {
    name: "Odd-Month Community Call",
    eyebrow: "Open to all",
    schedule: "2nd Thursday · 12:00 – 1:00 PM ET",
    months: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
    platform: "Zoom",
    accent: "teal",
  },
  {
    name: "Even-Month Community Call",
    eyebrow: "Open to all",
    schedule: "2nd Friday · 2:00 – 3:00 PM ET",
    months: ["Feb", "Apr", "Jun", "Aug", "Oct", "Dec"],
    platform: "Zoom",
    accent: "purple",
  },
  {
    name: "Community Call Planning",
    eyebrow: "Working group",
    schedule: "4th Thursday · 12:00 – 1:00 PM ET",
    months: ["Monthly"],
    platform: "Zoom",
    accent: "teal",
  },
];

const eventAccent = {
  teal: {
    border: "border-teal-500",
    eyebrow: "text-teal-700",
    chip: "bg-teal-50 text-teal-800 border-teal-100",
  },
  purple: {
    border: "border-purple-500",
    eyebrow: "text-purple-600",
    chip: "bg-purple-50 text-purple-800 border-purple-100",
  },
};

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface FormattedEventDate {
  month: string;
  day: string;
  year: string;
  full: string;
}

function formatEventDate(startDate: string, endDate: string | null): FormattedEventDate {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const month = MONTH_ABBR[start.getUTCMonth()] ?? "";
  const startDay = String(start.getUTCDate());
  const year = String(start.getUTCFullYear());

  let day = startDay;
  let full = `${month} ${startDay}, ${year}`;
  if (end) {
    const endDay = String(end.getUTCDate());
    const sameMonth =
      end.getUTCMonth() === start.getUTCMonth() &&
      end.getUTCFullYear() === start.getUTCFullYear();
    if (sameMonth) {
      day = `${startDay}–${endDay}`;
      full = `${month} ${startDay}–${endDay}, ${year}`;
    } else {
      const endMonth = MONTH_ABBR[end.getUTCMonth()] ?? "";
      day = `${startDay}–${endMonth} ${endDay}`;
      full = `${month} ${startDay} – ${endMonth} ${endDay}, ${year}`;
    }
  }
  return { month, day, year, full };
}

function isUpcoming(e: PublicEvent): boolean {
  const ref = e.endDate ?? e.startDate;
  const t = new Date(ref).getTime();
  if (Number.isNaN(t)) return false;
  // Inclusive: events ending today still count as upcoming
  return t >= Date.now() - 24 * 60 * 60 * 1000;
}

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Monthly calls",
    title: "Community Calls",
    teaser: "Deep dive on the monthly rhythm and co-chairs.",
    path: "/community/calls",
  },
  {
    eyebrow: "Focus",
    title: "Working Groups",
    teaser: "Where specialized meetings happen between gatherings.",
    path: "/community/working-groups",
  },
  {
    eyebrow: "Support",
    title: "Sponsors",
    teaser: "Who backs the annual conference.",
    path: "/about/sponsors",
  },
  {
    eyebrow: "Helping",
    title: "Volunteer",
    teaser: "Help run events, programs, and community gatherings.",
    path: "/jobs/volunteer",
  },
];

export function UpcomingEventsPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: featuredRef, isInView: featuredInView } = useInView(0.15);
  const { ref: dynamicRef, isInView: dynamicInView } = useInView(0.05);
  const { ref: recurringRef, isInView: recurringInView } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  const { events, error: eventsError } = useEvents();
  // Hide the dedicated featured-event entry (USRSE'26) so it doesn't
  // duplicate the hand-curated featured section above.
  const dynamicEvents = (events ?? [])
    .filter(isUpcoming)
    .filter((e) => e.slug !== "usrse26")
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  return (
    <EventsLayout
      title="Upcoming Events"
      subtitle="What's happening in the US-RSE community — conferences, calls, and gatherings."
      nextPage={{
        path: "/events/calendar",
        label: "Calendar",
        teaser: "Full event schedule",
      }}
    >
      {/* ── The stance — manifesto ───────────────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          The calendar that keeps us connected
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          Where the community shows up.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          From the annual USRSE conference to monthly community calls, this
          is the calendar of gatherings that keep the network connected
          &mdash; in person and online.
        </p>
      </section>

      {/* ── At a glance — 4-column facts strip ───────────────────── */}
      <section
        ref={factsRef}
        className={`mb-20 py-8 border-y border-neutral-200 grid grid-cols-2 md:grid-cols-4 ${
          factsInView ? "animate-fade-in" : "opacity-0"
        }`}
      >
        {keyFacts.map((f, i) => (
          <div
            key={f.label}
            className={`py-3 px-4 md:px-6 ${
              i > 0 ? "md:border-l md:border-neutral-200" : ""
            } ${
              i % 2 !== 0 ? "border-l border-neutral-200 md:border-l" : ""
            } ${i >= 2 ? "border-t border-neutral-200 md:border-t-0" : ""}`}
          >
            <p className="font-display text-xl lg:text-2xl font-bold text-teal-700 tracking-tight leading-none tabular-nums">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2.5">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── Featured event — USRSE'26 ────────────────────────────── */}
      <section ref={featuredRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
            Featured event
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            4th annual
          </span>
        </div>

        <div
          className={`flex flex-col sm:flex-row gap-8 sm:gap-12 ${
            featuredInView ? "animate-slide-up" : "opacity-0"
          }`}
        >
          {/* Date column — preserved big typographic date */}
          <div className="shrink-0">
            <p className="font-display text-6xl lg:text-7xl font-black text-neutral-900 leading-none tracking-tight">
              Oct
            </p>
            <p className="font-display text-4xl lg:text-5xl font-bold text-neutral-300 leading-none mt-1 tabular-nums">
              19–21
            </p>
            <p className="font-mono text-xs text-neutral-400 mt-3 tabular-nums">
              2026
            </p>
          </div>

          {/* Details */}
          <div className="flex-1 pt-2">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-2 text-balance">
              USRSE&rsquo;26 Conference
            </h2>
            <p className="text-lg text-neutral-500 italic mb-5">
              Advancing Science in the Age of AI
            </p>
            <p className="text-neutral-600 leading-relaxed mb-6 max-w-2xl">
              The 4th annual US-RSE conference brings together several
              hundred research software engineers for three days of talks,
              panels, workshops, and posters.
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 mb-8">
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                San Jose Marriott, CA
              </span>
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                October 19–21, 2026
              </span>
            </div>

            <Link
              to="/events/usrse26"
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Conference details
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Dynamic upcoming events — from API ───────────────────── */}
      <section ref={dynamicRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
            From the community
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {events === null && !eventsError
              ? "loading…"
              : `${dynamicEvents.length.toString().padStart(2, "0")} upcoming`}
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          What&rsquo;s on the calendar.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Workshops, meetups, sponsored sessions, and community-submitted
          gatherings &mdash; the latest updates from across the network.
        </p>

        {eventsError ? (
          <p className="font-mono text-sm text-neutral-500 py-6 px-6 border border-neutral-200 bg-neutral-50 rounded-lg">
            We couldn&rsquo;t load the latest events right now. Please try
            again shortly.
          </p>
        ) : events === null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-white py-10 px-6 md:px-7 border-t-2 border-neutral-200 animate-pulse"
              >
                <div className="h-3 w-24 bg-neutral-100 rounded mb-4" />
                <div className="h-6 w-2/3 bg-neutral-100 rounded mb-3" />
                <div className="h-4 w-1/2 bg-neutral-100 rounded" />
              </div>
            ))}
          </div>
        ) : dynamicEvents.length === 0 ? (
          <p className="font-mono text-sm text-neutral-500 py-6 px-6 border border-neutral-200 bg-neutral-50 rounded-lg">
            No additional upcoming events have been posted yet &mdash; check
            back soon or submit one of your own.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
            {dynamicEvents.map((e, i) => {
              const d = formatEventDate(e.startDate, e.endDate);
              const accent = i % 2 === 0 ? "purple" : "teal";
              const borderClass =
                accent === "purple" ? "border-purple-500" : "border-teal-500";
              const eyebrowClass =
                accent === "purple" ? "text-purple-600" : "text-teal-700";
              return (
                <article
                  key={e.id}
                  className={`bg-white pt-8 pb-9 px-6 md:px-7 border-t-2 ${borderClass} flex flex-col sm:flex-row gap-6 ${
                    dynamicInView ? "animate-slide-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Date column — echoes the featured event treatment */}
                  <div className="shrink-0 sm:w-24">
                    <p className="font-display text-3xl font-black text-neutral-900 leading-none tracking-tight">
                      {d.month}
                    </p>
                    <p className="font-display text-2xl font-bold text-neutral-300 leading-none mt-1 tabular-nums">
                      {d.day}
                    </p>
                    <p className="font-mono text-[10px] text-neutral-400 mt-2 tabular-nums">
                      {d.year}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-mono text-[10px] uppercase tracking-[0.2em] ${eyebrowClass} mb-2`}
                    >
                      {e.type.replace(/_/g, " ")}
                    </p>
                    <h3 className="font-display text-lg lg:text-xl font-bold text-neutral-900 tracking-tight leading-[1.2] mb-3 text-balance">
                      {e.name}
                    </h3>
                    {e.description ? (
                      <p className="text-sm text-neutral-600 leading-relaxed mb-4 line-clamp-3">
                        {e.description}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-neutral-500 font-mono">
                      <span className="tabular-nums">{d.full}</span>
                      {e.location ? <span>{e.location}</span> : null}
                    </div>
                    {e.externalUrl ? (
                      <a
                        href={e.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900 hover:text-purple-700 transition-colors"
                      >
                        Event details
                        <svg
                          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        >
                          <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Submit an event CTA — anonymous click is redirected to sign-in
            by SubmitEventPage itself, so we always render the link. */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/events/submit"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Submit an event
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            Hosting something? Send it to the community.
          </p>
        </div>
      </section>

      {/* ── Recurring events — 3 pillar cards ────────────────────── */}
      <section ref={recurringRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Recurring events
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {recurringEvents.length.toString().padStart(2, "0")} regular gatherings
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          What happens monthly.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Zoom links and topics post to Slack and the US-RSE email list
          ahead of each call.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
          {recurringEvents.map((e, i) => {
            const a = eventAccent[e.accent];
            return (
              <article
                key={e.name}
                className={`bg-white pt-8 pb-9 px-6 md:px-7 border-t-2 ${a.border} ${
                  recurringInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <p
                  className={`font-mono text-[10px] uppercase tracking-[0.2em] ${a.eyebrow} mb-3`}
                >
                  {e.eyebrow}
                </p>
                <h3 className="font-display text-lg lg:text-xl font-bold text-neutral-900 tracking-tight leading-[1.2] mb-4 text-balance">
                  {e.name}
                </h3>
                <p className="font-mono text-[13px] text-neutral-700 mb-5 leading-relaxed">
                  {e.schedule}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {e.months.map((m) => (
                    <span
                      key={m}
                      className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${a.chip}`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  via {e.platform}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── See the full schedule — CTA ──────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Want everything?
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          See the full community calendar.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Working group meetings, planning sessions, ad-hoc gatherings, and
          every recurring call &mdash; one view of it all.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <Link
            to="/events/calendar"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Open the calendar
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            Or subscribe on Slack &amp; email
          </p>
        </div>
      </section>

      {/* ── Continue exploring — bridge cards ────────────────────── */}
      <section
        ref={bridgeRef}
        className="mb-4 pt-12 border-t-2 border-neutral-900"
      >
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Continue exploring
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-10">
          Everywhere else the community meets.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {bridges.map((b, i) => (
            <Link
              key={b.path}
              to={b.path}
              className={`group bg-white p-6 md:p-7 flex items-center gap-5 hover:bg-neutral-50 transition-colors ${
                bridgeInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-1.5">
                  {b.eyebrow}
                </p>
                <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1 group-hover:text-teal-700 transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-neutral-500">{b.teaser}</p>
              </div>
              <svg
                className="w-5 h-5 text-neutral-400 group-hover:text-teal-700 transition-all group-hover:translate-x-1 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </EventsLayout>
  );
}
