import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EventsLayout } from "@/components/events/EventsLayout";
import { useInView } from "@/hooks/useInView";

interface HostGroup {
  id: string;
  name: string;
  slug: string;
}

interface HostOrg {
  id: string;
  name: string;
}

interface EventDetail {
  id: string;
  slug: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  url: string | null;
  description: string | null;
  scope: string;
  externalUrl: string | null;
  hostGroup: HostGroup | null;
  hostOrg: HostOrg | null;
  author: { id: string } | null;
}

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

function formatEventDate(
  startDate: string,
  endDate: string | null,
): FormattedEventDate {
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

const TYPE_LABEL: Record<string, string> = {
  conference: "Conference",
  workshop: "Workshop",
  meetup: "Meetup",
  community_call: "Community call",
  webinar: "Webinar",
  hackathon: "Hackathon",
  training: "Training",
  other: "Event",
};

function formatType(t: string): string {
  return TYPE_LABEL[t] ?? t.replace(/_/g, " ");
}

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const apiFetch = useApi();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setEvent(null);

    void (async () => {
      try {
        const res = await apiFetch(`/events/${slug}`);
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(`/events/${slug} responded ${res.status}`);
          setLoading(false);
          return;
        }
        const body = (await res.json()) as { event: EventDetail };
        setEvent(body.event);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, apiFetch]);

  if (loading) {
    return (
      <EventsLayout title="Loading…">
        <div className="animate-pulse space-y-6">
          <div className="h-3 w-32 bg-neutral-100 rounded" />
          <div className="h-10 w-3/4 bg-neutral-100 rounded" />
          <div className="h-4 w-1/2 bg-neutral-100 rounded" />
          <div className="h-40 w-full bg-neutral-100 rounded mt-8" />
        </div>
      </EventsLayout>
    );
  }

  if (notFound) {
    return (
      <EventsLayout
        title="Event not found"
        prevPage={{ path: "/events", label: "Upcoming Events" }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          404 · not published
        </p>
        <p className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight leading-tight mb-6 max-w-2xl">
          This event may have been archived, unpublished, or never existed at
          this address.
        </p>
        <Link
          to="/events"
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-purple-600 hover:text-purple-700 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to upcoming events
        </Link>
      </EventsLayout>
    );
  }

  if (error || !event) {
    return (
      <EventsLayout title="Event">
        <p className="font-mono text-sm text-neutral-500 py-6 px-6 border border-neutral-200 bg-neutral-50 rounded-lg">
          {error ?? "This event is temporarily unavailable."}
        </p>
      </EventsLayout>
    );
  }

  return <EventDetailBody event={event} />;
}

function EventDetailBody({ event }: { event: EventDetail }) {
  const { ref: headerRef, isInView: headerInView } = useInView(0.2);
  const { ref: dateRef, isInView: dateInView } = useInView(0.15);
  const { ref: hostRef, isInView: hostInView } = useInView(0.1);
  const { ref: descRef, isInView: descInView } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.1);

  const date = formatEventDate(event.startDate, event.endDate);
  const ctaLabel = event.externalUrl
    ? `Register at ${event.hostOrg?.name ?? "external site"}`
    : event.url
      ? "Event link"
      : null;
  const ctaHref = event.externalUrl ?? event.url ?? null;

  return (
    <EventsLayout
      title={event.name}
      prevPage={{ path: "/events", label: "Upcoming Events" }}
    >
      {/* ── Header — type chip + location ────────────────────────── */}
      <section
        ref={headerRef}
        className={`mb-12 ${headerInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            {formatType(event.type)}
          </span>
          {event.location ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {event.location}
            </span>
          ) : null}
        </div>

        <h1 className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-6 text-balance max-w-4xl">
          {event.name}
        </h1>
      </section>

      {/* ── Date — magazine-cover treatment ──────────────────────── */}
      <section
        ref={dateRef}
        className={`mb-16 ${dateInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10 py-8 border-y border-neutral-200">
          <div className="shrink-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-600 mb-3">
              When
            </p>
            <div className="flex items-end gap-3">
              <span className="font-display text-6xl lg:text-7xl font-black text-neutral-900 leading-none tracking-tight tabular-nums">
                {date.day}
              </span>
              <span className="font-display text-2xl lg:text-3xl font-bold text-neutral-300 leading-none mb-1.5 tabular-nums">
                {date.month}
              </span>
            </div>
            <p className="font-mono text-xs text-neutral-400 mt-2 tabular-nums">
              {date.year}
            </p>
          </div>

          <div className="flex-1 sm:pb-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-2">
              Full date
            </p>
            <p className="font-display text-lg lg:text-xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {date.full}
            </p>
          </div>
        </div>
      </section>

      {/* ── Host attribution ─────────────────────────────────────── */}
      {(event.hostGroup || event.hostOrg) && (
        <section
          ref={hostRef}
          className={`mb-16 ${hostInView ? "animate-slide-up" : "opacity-0"}`}
        >
          <div className="flex items-baseline gap-3 mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700">
              Hosted by
            </p>
            <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          </div>
          <ul className="space-y-3">
            {event.hostGroup ? (
              <li>
                <Link
                  to={`/community/groups/${event.hostGroup.id}`}
                  className="group inline-flex items-center gap-2 font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight hover:text-teal-700 transition-colors"
                >
                  {event.hostGroup.name}
                  <svg
                    className="w-4 h-4 text-neutral-300 group-hover:text-teal-700 transition-all group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </li>
            ) : null}
            {event.hostOrg ? (
              <li>
                <Link
                  to={`/orgs/${event.hostOrg.id}`}
                  className="group inline-flex items-center gap-2 font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight hover:text-teal-700 transition-colors"
                >
                  {event.hostOrg.name}
                  <svg
                    className="w-4 h-4 text-neutral-300 group-hover:text-teal-700 transition-all group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </li>
            ) : null}
          </ul>
        </section>
      )}

      {/* ── Description ──────────────────────────────────────────── */}
      {event.description ? (
        <section
          ref={descRef}
          className={`mb-16 ${descInView ? "animate-slide-up" : "opacity-0"}`}
        >
          <div className="flex items-baseline gap-3 mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
              About
            </p>
            <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          </div>
          <div className="whitespace-pre-wrap text-base text-neutral-700 leading-relaxed max-w-2xl">
            {event.description}
          </div>
        </section>
      ) : null}

      {/* ── CTA + back ───────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-4 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        {ctaHref && ctaLabel ? (
          <div className="flex flex-wrap items-center gap-5 mb-8">
            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {ctaLabel}
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
            </a>
            {event.externalUrl ? (
              <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                Opens on the host&rsquo;s site
              </p>
            ) : null}
          </div>
        ) : null}

        <Link
          to="/events"
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 hover:text-purple-700 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to events
        </Link>
      </section>
    </EventsLayout>
  );
}
