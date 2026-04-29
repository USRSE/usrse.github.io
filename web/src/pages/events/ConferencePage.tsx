import { EventsLayout } from "@/components/events/EventsLayout";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { useInView } from "@/hooks/useInView";

const getInvolved = [
  {
    num: "01",
    title: "Submit a Proposal",
    desc: "Share your work through talks, panels, workshops, or posters. The call for proposals is open.",
  },
  {
    num: "02",
    title: "Review Submissions",
    desc: "Help shape the program by providing constructive feedback on proposals as a volunteer reviewer.",
  },
  {
    num: "03",
    title: "Sponsor the Conference",
    desc: "Support the community by sponsoring USRSE'26. Multiple sponsorship tiers are available.",
  },
  {
    num: "04",
    title: "Attend",
    desc: "Register to join several hundred RSEs for three days of learning, sharing, and community building.",
  },
];

export function ConferencePage() {
  const { ref, isInView } = useInView(0.1);

  return (
    <EventsLayout
      title="USRSE'26 Conference"
      subtitle="Advancing Science in the Age of AI"
      prevPage={{ path: "/events/calendar", label: "Calendar" }}
    >
      {/* ── Hero details — large typographic date ──────────────────── */}
      <section className="mb-20">
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
          {/* Date block */}
          <div className="shrink-0">
            <p className="font-display text-7xl lg:text-8xl font-bold text-neutral-900 leading-none tracking-tight">
              '26
            </p>
            <div className="mt-3 space-y-1">
              <p className="font-mono text-sm text-teal-600">October 19–21</p>
              <p className="font-mono text-sm text-neutral-400">San Jose, CA</p>
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 pt-2">
            <p className="text-xl text-neutral-700 leading-relaxed mb-6">
              The 4th annual US-RSE conference brings together research software
              engineers from across the country for three days of talks, panels,
              workshops, and poster sessions at the San Jose Marriott.
            </p>

            <div className="border-l-2 border-teal-200 pl-5 space-y-2 text-neutral-500">
              <p>Talks, panels, workshops, and posters</p>
              <p>Several hundred expected attendees</p>
              <p>San Jose Marriott, San Jose, California</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Get Involved ───────────────────────────────────────────── */}
      <section className="mb-20" ref={ref}>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Get Involved
        </h2>
        <p className="text-neutral-500 mb-8">
          There are many ways to participate in USRSE'26.
        </p>

        <div className="space-y-0">
          {getInvolved.map((item, i) => (
            <div
              key={item.num}
              className={`flex gap-5 lg:gap-8 py-7 ${
                i < getInvolved.length - 1 ? "border-b border-neutral-100" : ""
              } ${isInView ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="font-mono text-sm text-teal-600 shrink-0 pt-0.5">
                {item.num}
              </span>
              <div>
                <h3 className="font-bold text-neutral-900 mb-1">{item.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Past Conferences Gallery ──────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Past Conferences
        </h2>
        <p className="text-neutral-500 mb-6">
          Moments from USRSE'23 (Chicago), USRSE'24 (Albuquerque), and USRSE'25 (Philadelphia).
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <PhotoPlaceholder label="USRSE'25 group photo" aspect="wide" className="col-span-2 lg:col-span-2" />
          <PhotoPlaceholder label="Keynote speaker" aspect="wide" />
          <PhotoPlaceholder label="Workshop session" aspect="wide" />
          <PhotoPlaceholder label="Poster session" aspect="wide" />
          <PhotoPlaceholder label="Networking event" aspect="wide" />
        </div>
      </section>

      {/* ── Key Links ──────────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          Quick Links
        </h2>

        <div className="space-y-0">
          {[
            { label: "Call for Proposals", desc: "Submit talks, panels, workshops, and posters", href: "#cfp" },
            { label: "Volunteer as a Reviewer", desc: "Help shape the conference program", href: "#review" },
            { label: "Sponsorship Packages", desc: "Support the conference and community", href: "#sponsor" },
            { label: "Mailing List", desc: "Get updates on important dates and announcements", href: "#mailing-list" },
          ].map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className={`group flex items-center justify-between py-5 ${
                i < 3 ? "border-b border-neutral-100" : ""
              }`}
            >
              <div>
                <h3 className="font-bold text-neutral-900 group-hover:text-purple-700 transition-colors">
                  {link.label}
                </h3>
                <p className="text-sm text-neutral-400 mt-0.5">{link.desc}</p>
              </div>
              <svg className="w-4 h-4 text-neutral-300 group-hover:text-purple-500 transition-colors shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </a>
          ))}
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-100 pt-10">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-2">
          Questions?
        </p>
        <a
          href="mailto:usrse26-conference@us-rse.org"
          className="text-lg font-display font-bold text-purple-700 hover:text-purple-900 transition-colors"
        >
          usrse26-conference@us-rse.org
        </a>
      </div>
    </EventsLayout>
  );
}
