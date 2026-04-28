import { Link } from "react-router-dom";
import { EventsLayout } from "@/components/events/EventsLayout";
import { useInView } from "@/hooks/useInView";

const recurringEvents = [
  {
    name: "Odd-Month Community Call",
    schedule: "2nd Thursday, 12:00–1:00 PM ET",
    months: "Jan, Mar, May, Jul, Sep, Nov",
    platform: "Zoom",
  },
  {
    name: "Even-Month Community Call",
    schedule: "2nd Friday, 2:00–3:00 PM ET",
    months: "Feb, Apr, Jun, Aug, Oct, Dec",
    platform: "Zoom",
  },
  {
    name: "Community Call Planning",
    schedule: "4th Thursday, 12:00–1:00 PM ET",
    months: "Monthly",
    platform: "Zoom",
  },
];

export function UpcomingEventsPage() {
  const { ref, isInView } = useInView(0.1);

  return (
    <EventsLayout
      title="Upcoming Events"
      subtitle="What's happening in the US-RSE community — conferences, calls, and gatherings."
      nextPage={{ path: "/events/calendar", label: "Calendar", teaser: "Full event schedule" }}
    >
      {/* ── Featured: USRSE'26 ─────────────────────────────────────── */}
      <section className="mb-20">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-3">
          Featured Event
        </p>
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
          {/* Date column — large typographic date */}
          <div className="shrink-0">
            <p className="font-display text-6xl lg:text-7xl font-bold text-neutral-900 leading-none">
              Oct
            </p>
            <p className="font-display text-4xl lg:text-5xl font-bold text-neutral-300 leading-none mt-1">
              19–21
            </p>
            <p className="font-mono text-xs text-neutral-400 mt-2">2026</p>
          </div>

          {/* Details */}
          <div className="flex-1 pt-2">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
              USRSE'26 Conference
            </h2>
            <p className="text-lg text-neutral-500 italic mb-4">
              Advancing Science in the Age of AI
            </p>
            <p className="text-neutral-600 leading-relaxed mb-4">
              The 4th annual US-RSE conference, bringing together several hundred
              research software engineers for three days of talks, panels,
              workshops, and posters.
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 mb-6">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                San Jose Marriott, CA
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                October 19–21, 2026
              </span>
            </div>

            <Link
              to="/events/usrse26"
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              Conference details
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recurring Events ───────────────────────────────────────── */}
      <section ref={ref}>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Recurring Events
        </h2>
        <p className="text-neutral-500 mb-8">
          Regular community gatherings. Topics and Zoom links are posted to
          Slack and the US-RSE email list.
        </p>

        <div className="space-y-0">
          {recurringEvents.map((event, i) => (
            <div
              key={event.name}
              className={`flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 py-5 ${
                i < recurringEvents.length - 1 ? "border-b border-neutral-100" : ""
              } ${isInView ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div>
                <h3 className="font-bold text-neutral-900">{event.name}</h3>
                <p className="text-sm text-neutral-400 mt-0.5">{event.months}</p>
              </div>
              <div className="text-right sm:text-right">
                <p className="text-sm font-mono text-teal-600">{event.schedule}</p>
                <p className="text-xs text-neutral-400">{event.platform}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-neutral-400 mt-6">
          View the full schedule on the{" "}
          <Link to="/events/calendar" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
            community calendar
          </Link>.
        </p>
      </section>
    </EventsLayout>
  );
}
