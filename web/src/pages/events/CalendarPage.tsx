import { Link } from "react-router-dom";
import { EventsLayout } from "@/components/events/EventsLayout";
import { useInView } from "@/hooks/useInView";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "12+", label: "Monthly events" },
  { value: "4", label: "Event types" },
  { value: "2", label: "Subscribe formats" },
  { value: "All ET", label: "Time zone" },
];

interface SubscribeOption {
  mono: string;
  label: string;
  detail: string;
  action: string;
  href: string;
  accent: "teal" | "purple";
}

const subscribeOptions: SubscribeOption[] = [
  {
    mono: "gcal",
    label: "Google Calendar",
    detail: "One-click add. Updates automatically as events change.",
    action: "Add to Google",
    href: "#subscribe-gcal",
    accent: "teal",
  },
  {
    mono: "ics",
    label: "iCal / Outlook",
    detail: "Subscribe by URL or download a one-time .ics export.",
    action: "Download feed",
    href: "#subscribe-ics",
    accent: "purple",
  },
];

interface EventType {
  num: string;
  type: string;
  freq: string;
  desc: string;
  rhythm: string[];
  accent: "teal" | "purple";
}

const eventTypes: EventType[] = [
  {
    num: "01",
    type: "Community Calls",
    freq: "Monthly",
    desc: "Open discussions on RSE topics, careers, and the field.",
    rhythm: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    accent: "teal",
  },
  {
    num: "02",
    type: "Working Group Meetings",
    freq: "Bi-weekly",
    desc: "Focused collaboration sessions where the work happens.",
    rhythm: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"],
    accent: "purple",
  },
  {
    num: "03",
    type: "Conferences",
    freq: "Annual",
    desc: "The USRSE conference series — three days, the whole community.",
    rhythm: ["", "", "", "", "", "", "", "", "Oct", "", "", ""],
    accent: "teal",
  },
  {
    num: "04",
    type: "Workshops & Seminars",
    freq: "Periodic",
    desc: "Skill-building sessions hosted by members and partners.",
    rhythm: ["", "Q1", "", "", "Q2", "", "", "Q3", "", "", "Q4", ""],
    accent: "purple",
  },
];

const accentMap = {
  teal: {
    border: "border-teal-500",
    num: "text-teal-600",
    eyebrow: "text-teal-700",
    chip: "bg-teal-50 text-teal-800 border-teal-100",
    rhythmOn: "bg-teal-500",
    rhythmOnText: "text-white",
    rhythmOff: "bg-neutral-100 text-neutral-300",
  },
  purple: {
    border: "border-purple-500",
    num: "text-purple-600",
    eyebrow: "text-purple-600",
    chip: "bg-purple-50 text-purple-800 border-purple-100",
    rhythmOn: "bg-purple-500",
    rhythmOnText: "text-white",
    rhythmOff: "bg-neutral-100 text-neutral-300",
  },
};

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Monthly rhythm",
    title: "Community Calls",
    teaser: "The recurring calls and how to join one this month.",
    path: "/community/calls",
  },
  {
    eyebrow: "Focused work",
    title: "Working Groups",
    teaser: "Where specialized meetings happen between the calls.",
    path: "/community/working-groups",
  },
  {
    eyebrow: "Annual gathering",
    title: "USRSE'26",
    teaser: "The October conference — three days, San Jose.",
    path: "/events/usrse26",
  },
  {
    eyebrow: "Show up",
    title: "Volunteer",
    teaser: "Help run the events on this calendar.",
    path: "/jobs/volunteer",
  },
];

export function CalendarPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: liveRef, isInView: liveInView } = useInView(0.1);
  const { ref: subscribeRef, isInView: subscribeInView } = useInView(0.1);
  const { ref: typesRef, isInView: typesInView } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <EventsLayout
      title="Calendar"
      subtitle="The full schedule of US-RSE events, meetings, and deadlines."
      prevPage={{ path: "/events", label: "Upcoming Events" }}
      nextPage={{
        path: "/events/usrse26",
        label: "USRSE'26 Conference",
        teaser: "Our annual gathering",
      }}
    >
      {/* ── The stance — one source of truth ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          One calendar, every gathering
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          If it&rsquo;s on this calendar, the community is there.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          Community calls, working group meetings, the annual conference, and
          everything in between &mdash; all in one feed you can subscribe to
          once and forget about.
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
            } ${i % 2 !== 0 ? "border-l border-neutral-200 md:border-l" : ""} ${
              i >= 2 ? "border-t border-neutral-200 md:border-t-0" : ""
            }`}
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

      {/* ── The live view — calendar embed ───────────────────────── */}
      <section ref={liveRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
            The live view
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
            Auto-updating
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          What&rsquo;s on the schedule.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          The embedded calendar below mirrors the source of truth. Click any
          event for the Zoom link, agenda, and notes.
        </p>

        {/* Framed embed — intentional chrome, not a dashed placeholder */}
        <div
          className={`relative rounded-2xl bg-neutral-900 p-3 lg:p-4 shadow-2xl ${
            liveInView ? "animate-slide-up" : "opacity-0"
          }`}
        >
          {/* Window-chrome top bar */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              calendar.us-rse.org
            </p>
            <span className="w-12" aria-hidden="true" />
          </div>

          {/* Embed surface */}
          <div className="w-full aspect-[4/3] lg:aspect-[16/9] bg-white rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
            {/* Subtle grid background — calendar grid feel */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
              aria-hidden="true"
            />
            <svg
              className="w-12 h-12 text-teal-600 mb-4 relative"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.25}
              aria-hidden="true"
            >
              <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="font-display text-base font-semibold text-neutral-700 relative">
              Google Calendar embed lives here
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 mt-2 relative">
              All community calls &middot; WG meetings &middot; deadlines
            </p>
          </div>
        </div>
      </section>

      {/* ── Subscribe — two pillar cards ─────────────────────────── */}
      <section ref={subscribeRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Take it with you
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Subscribe once.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Add the feed to the calendar app you already check. New events show
          up automatically &mdash; nothing for you to maintain.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {subscribeOptions.map((o, i) => {
            const a = accentMap[o.accent];
            return (
              <article
                key={o.mono}
                className={`bg-white pt-9 pb-10 px-6 md:px-8 border-t-2 ${a.border} ${
                  subscribeInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${a.chip}`}
                  >
                    {o.mono}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                    Feed
                  </span>
                </div>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight mb-3">
                  {o.label}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-7 max-w-md">
                  {o.detail}
                </p>
                <a
                  href={o.href}
                  className={`group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] ${a.eyebrow} hover:opacity-80 transition-opacity`}
                >
                  {o.action}
                  <svg
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Event types — 4 pillar cards with rhythm strips ──────── */}
      <section ref={typesRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What you&rsquo;ll see
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            04 event types
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Four kinds of gatherings.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Each event type follows its own cadence. The rhythm strip beneath
          each card shows when it lights up across the year.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {eventTypes.map((e, i) => {
            const a = accentMap[e.accent];
            return (
              <article
                key={e.num}
                className={`bg-white pt-9 pb-10 px-6 md:px-8 border-t-2 ${a.border} ${
                  typesInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <span
                    className={`font-display text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${a.num}`}
                  >
                    {e.num}
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${a.chip}`}
                  >
                    {e.freq}
                  </span>
                </div>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight mb-3">
                  {e.type}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-6 max-w-md">
                  {e.desc}
                </p>

                {/* Rhythm strip — 12-cell yearly cadence */}
                <div className="grid grid-cols-12 gap-1">
                  {e.rhythm.map((cell, idx) => (
                    <div
                      key={idx}
                      className={`h-7 rounded-sm flex items-center justify-center font-mono text-[8px] uppercase tracking-tight ${
                        cell ? `${a.rhythmOn} ${a.rhythmOnText}` : a.rhythmOff
                      }`}
                      aria-hidden="true"
                    >
                      {cell && cell.length <= 3 ? cell : ""}
                    </div>
                  ))}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-3">
                  Jan &rarr; Dec
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── CTA — show up, don't just subscribe ──────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          The calendar is just the start
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Don&rsquo;t just subscribe &mdash; show up.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          The community shows up for one another at every event on this
          calendar. Pick the next one that fits your schedule and join in.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <Link
            to="/events"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            See upcoming events
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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>or</span>
            <Link
              to="/community/calls"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Community calls
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/community/working-groups"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              Working groups
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/events/usrse26"
              className="text-neutral-700 hover:text-teal-700 transition-colors"
            >
              USRSE&rsquo;26
            </Link>
          </div>
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
          Where each kind of event lives.
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
