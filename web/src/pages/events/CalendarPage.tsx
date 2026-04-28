import { EventsLayout } from "@/components/events/EventsLayout";

export function CalendarPage() {
  return (
    <EventsLayout
      title="Calendar"
      subtitle="The full schedule of US-RSE events, meetings, and deadlines."
      prevPage={{ path: "/events", label: "Upcoming Events" }}
      nextPage={{ path: "/events/usrse26", label: "USRSE'26 Conference", teaser: "Our annual gathering" }}
    >
      {/* ── Calendar embed placeholder ──────────────────────────────── */}
      <section className="mb-16">
        <p className="text-neutral-600 leading-relaxed mb-8">
          The US-RSE community calendar includes all recurring community calls,
          working group meetings, conferences, deadlines, and special events.
          Subscribe to stay up to date.
        </p>

        {/* Placeholder for Google Calendar embed */}
        <div className="w-full aspect-[4/3] lg:aspect-[16/9] bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center">
          <svg className="w-12 h-12 text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
          </svg>
          <p className="text-sm font-medium text-neutral-400">
            Google Calendar will be embedded here
          </p>
          <p className="text-xs text-neutral-300 mt-1">
            Shows all community calls, WG meetings, and events
          </p>
        </div>
      </section>

      {/* ── Subscribe ──────────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Subscribe
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Add the US-RSE calendar to your own to never miss an event:
        </p>

        <div className="space-y-3">
          {[
            { label: "Google Calendar", action: "Add to Google Calendar", mono: "gcal" },
            { label: "iCal / Outlook", action: "Download .ics feed", mono: "ics" },
          ].map((option) => (
            <div key={option.mono} className="flex items-center justify-between py-4 border-b border-neutral-100">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-teal-600">{option.mono}</span>
                <span className="font-medium text-neutral-900">{option.label}</span>
              </div>
              <a href="#subscribe" className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
                {option.action}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Event types legend ──────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Event Types
        </h2>
        <div className="space-y-0">
          {[
            { type: "Community Calls", freq: "Monthly", desc: "Open discussions on RSE topics" },
            { type: "Working Group Meetings", freq: "Bi-weekly", desc: "Focused collaboration sessions" },
            { type: "Conferences", freq: "Annual", desc: "USRSE conference series" },
            { type: "Workshops & Seminars", freq: "Periodic", desc: "Skill-building sessions" },
          ].map((item, i) => (
            <div
              key={item.type}
              className={`flex items-baseline justify-between gap-4 py-4 ${
                i < 3 ? "border-b border-neutral-100" : ""
              }`}
            >
              <div>
                <h3 className="font-bold text-neutral-900">{item.type}</h3>
                <p className="text-sm text-neutral-400 mt-0.5">{item.desc}</p>
              </div>
              <span className="font-mono text-xs text-neutral-400 shrink-0">{item.freq}</span>
            </div>
          ))}
        </div>
      </section>
    </EventsLayout>
  );
}
