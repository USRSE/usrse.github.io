import { Link } from "react-router-dom";
import { EventsLayout } from "@/components/events/EventsLayout";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { useInView } from "@/hooks/useInView";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "4th", label: "Annual gathering" },
  { value: "3 days", label: "Of programming" },
  { value: "100s", label: "RSEs expected" },
  { value: "San Jose", label: "Marriott, CA" },
];

interface Milestone {
  date: string;
  label: string;
  state: "past" | "active" | "upcoming";
}

const milestones: Milestone[] = [
  { date: "Mar 2026", label: "Call for proposals opens", state: "past" },
  { date: "Jun 2026", label: "Submissions close", state: "active" },
  { date: "Aug 2026", label: "Author notifications", state: "upcoming" },
  { date: "Sep 2026", label: "Registration closes", state: "upcoming" },
  { date: "Oct 19", label: "Conference begins", state: "upcoming" },
];

interface Involvement {
  num: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
  accent: "purple" | "teal";
}

const getInvolved: Involvement[] = [
  {
    num: "01",
    title: "Submit a proposal",
    desc: "Share your work as a talk, panel, workshop, or poster. The CFP is open and welcomes first-time speakers.",
    cta: "Open the CFP",
    href: "#cfp",
    accent: "purple",
  },
  {
    num: "02",
    title: "Review submissions",
    desc: "Help shape the program. Reviewers receive light training and read 6–10 proposals each cycle.",
    cta: "Volunteer to review",
    href: "#review",
    accent: "teal",
  },
  {
    num: "03",
    title: "Sponsor the conference",
    desc: "Back the gathering at any of several tiers. Sponsorship covers travel grants, scholarships, and venue costs.",
    cta: "See sponsor tiers",
    href: "#sponsor",
    accent: "purple",
  },
  {
    num: "04",
    title: "Attend",
    desc: "Register for three days alongside several hundred RSEs working across science, software, and AI.",
    cta: "Register interest",
    href: "#register",
    accent: "teal",
  },
];

const accentMap = {
  purple: {
    border: "border-purple-500",
    num: "text-purple-600",
    eyebrow: "text-purple-600",
    hover: "group-hover:text-purple-700",
  },
  teal: {
    border: "border-teal-500",
    num: "text-teal-600",
    eyebrow: "text-teal-700",
    hover: "group-hover:text-teal-700",
  },
};

interface PastConference {
  year: string;
  city: string;
  theme: string;
  photoLabel: string;
}

const pastConferences: PastConference[] = [
  {
    year: "'25",
    city: "Philadelphia",
    theme: "Sustaining the future of research software",
    photoLabel: "USRSE'25 — keynote",
  },
  {
    year: "'24",
    city: "Albuquerque",
    theme: "Software, science, and the people behind both",
    photoLabel: "USRSE'24 — workshop",
  },
  {
    year: "'23",
    city: "Chicago",
    theme: "First steps for a new community",
    photoLabel: "USRSE'23 — group photo",
  },
];

interface QuickLink {
  mono: string;
  label: string;
  desc: string;
  href: string;
}

const quickLinks: QuickLink[] = [
  {
    mono: "cfp",
    label: "Call for proposals",
    desc: "Submit talks, panels, workshops, posters",
    href: "#cfp",
  },
  {
    mono: "review",
    label: "Volunteer reviewer",
    desc: "Help shape the conference program",
    href: "#review",
  },
  {
    mono: "sponsor",
    label: "Sponsorship packages",
    desc: "Support the conference and community",
    href: "#sponsor",
  },
  {
    mono: "list",
    label: "Mailing list",
    desc: "Important dates and announcements",
    href: "#mailing-list",
  },
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Full schedule",
    title: "Calendar",
    teaser: "Every community gathering, including conference deadlines.",
    path: "/events/calendar",
  },
  {
    eyebrow: "Show up",
    title: "Volunteer",
    teaser: "Reviewers, session chairs, and on-site help wanted.",
    path: "/jobs/volunteer",
  },
  {
    eyebrow: "Backers",
    title: "Sponsors",
    teaser: "The organizations making this conference possible.",
    path: "/about/sponsors",
  },
  {
    eyebrow: "Year-round",
    title: "Community Calls",
    teaser: "How the network stays connected between conferences.",
    path: "/community/calls",
  },
];

export function ConferencePage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: dateRef, isInView: dateInView } = useInView(0.15);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: themeRef, isInView: themeInView } = useInView(0.1);
  const { ref: timelineRef, isInView: timelineInView } = useInView(0.1);
  const { ref: involvedRef, isInView: involvedInView } = useInView(0.05);
  const { ref: pastRef, isInView: pastInView } = useInView(0.1);
  const { ref: linksRef, isInView: linksInView } = useInView(0.1);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <EventsLayout
      title="USRSE'26 Conference"
      subtitle="Advancing Science in the Age of AI"
      prevPage={{ path: "/events/calendar", label: "Calendar" }}
    >
      {/* ── The stance — theme + invitation ──────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-14 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          The 4th annual US-RSE conference
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-10 text-balance max-w-4xl">
          Three days. Several hundred RSEs. One question:{" "}
          <span className="text-purple-600">what does science look like in the age of AI?</span>
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          USRSE&rsquo;26 brings the research software community together for
          talks, panels, workshops, and posters at the San Jose Marriott
          &mdash; the largest gathering of its kind in the United States.
        </p>
      </section>

      {/* ── The date — magazine-cover treatment ──────────────────── */}
      <section
        ref={dateRef}
        className={`mb-20 relative ${dateInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <div className="relative bg-neutral-900 rounded-2xl overflow-hidden px-6 py-12 lg:px-12 lg:py-16">
          {/* Decorative grid background */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            aria-hidden="true"
          />
          {/* Purple radial glow */}
          <div
            className="absolute -right-20 -top-20 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgb(168 85 247) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="relative flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-16">
            {/* Massive date typography */}
            <div className="shrink-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-purple-300 mb-3">
                Mark the calendar
              </p>
              <div className="flex items-end gap-3">
                <span className="font-display text-[8rem] lg:text-[12rem] font-black text-white leading-[0.85] tracking-[-0.04em] tabular-nums">
                  19
                </span>
                <span className="font-display text-5xl lg:text-7xl font-bold text-purple-400 leading-none mb-2">
                  &ndash;
                </span>
                <span className="font-display text-[8rem] lg:text-[12rem] font-black text-purple-400 leading-[0.85] tracking-[-0.04em] tabular-nums">
                  21
                </span>
              </div>
              <p className="font-display text-2xl lg:text-3xl font-bold text-white mt-3 tracking-tight">
                October 2026
              </p>
            </div>

            {/* Location & meta */}
            <div className="flex-1 lg:pb-6">
              <div className="space-y-5 max-w-md">
                <div className="border-t border-white/10 pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5">
                    Location
                  </p>
                  <p className="font-display text-xl font-bold text-white tracking-tight">
                    San Jose Marriott
                  </p>
                  <p className="text-sm text-white/60 mt-0.5">
                    San Jose, California
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5">
                    Format
                  </p>
                  <p className="text-base text-white/80 leading-relaxed">
                    Talks &middot; panels &middot; workshops &middot; posters
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conference identifier — bottom right */}
          <p className="absolute bottom-5 right-6 lg:bottom-6 lg:right-8 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30 tabular-nums">
            usrse&middot;26 &middot; 04
          </p>
        </div>
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
            <p className="font-display text-xl lg:text-2xl font-bold text-purple-700 tracking-tight leading-none tabular-nums">
              {f.value}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2.5">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── The theme — pull quote ───────────────────────────────── */}
      <section
        ref={themeRef}
        className="mb-20 py-16 border-y-2 border-neutral-900 bg-purple-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className={themeInView ? "animate-slide-up" : "opacity-0"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
            This year&rsquo;s theme
          </p>
          <blockquote className="font-display text-2xl lg:text-[2rem] font-bold text-neutral-900 leading-[1.15] tracking-tight mb-8 text-balance max-w-4xl">
            &ldquo;Advancing Science in the Age of AI &mdash; the role of
            research software engineers when the tools we build are reshaping
            the science we serve.&rdquo;
          </blockquote>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 max-w-4xl">
            <p className="text-base text-neutral-600 leading-relaxed">
              AI is changing what research software looks like, who builds it,
              and what makes it trustworthy. The 2026 program centers the
              conversations RSEs need to have with each other &mdash; about
              tooling, reproducibility, ethics, and what comes next.
            </p>
            <p className="text-base text-neutral-600 leading-relaxed">
              Expect sessions on LLMs in scientific workflows, AI-assisted
              development, validation in the era of foundation models, and the
              evolving definition of an RSE. Submissions outside the theme are
              welcome too &mdash; the program reflects the field.
            </p>
          </div>
        </div>
      </section>

      {/* ── Timeline — key conference dates ──────────────────────── */}
      <section ref={timelineRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Important dates
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            05 milestones
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          From CFP to closing keynote.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          The dates that matter between now and October. Track these, and
          subscribe to the mailing list for the exact deadlines.
        </p>

        <div
          className={`relative ${
            timelineInView ? "animate-fade-in" : "opacity-0"
          }`}
        >
          {/* Timeline rail */}
          <div
            className="absolute left-3 top-2 bottom-2 w-px bg-neutral-200"
            aria-hidden="true"
          />

          <ul className="space-y-6">
            {milestones.map((m, i) => {
              const isPast = m.state === "past";
              const isActive = m.state === "active";
              return (
                <li
                  key={m.label}
                  className={`relative pl-12 ${
                    timelineInView ? "animate-slide-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  {/* Node */}
                  <span
                    className={`absolute left-0 top-1 flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                      isPast
                        ? "bg-neutral-300 border-neutral-300"
                        : isActive
                        ? "bg-white border-purple-500 shadow-[0_0_0_4px_rgba(168,85,247,0.15)]"
                        : "bg-white border-neutral-300"
                    }`}
                    aria-hidden="true"
                  >
                    {isPast && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    )}
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6 pb-1">
                    <p
                      className={`font-display text-lg font-bold tracking-tight ${
                        isPast
                          ? "text-neutral-400 line-through decoration-1"
                          : isActive
                          ? "text-purple-700"
                          : "text-neutral-900"
                      }`}
                    >
                      {m.label}
                    </p>
                    <p
                      className={`font-mono text-[11px] uppercase tracking-[0.2em] tabular-nums shrink-0 ${
                        isPast
                          ? "text-neutral-300"
                          : isActive
                          ? "text-purple-600"
                          : "text-neutral-500"
                      }`}
                    >
                      {isActive ? "→ " : ""}
                      {m.date}
                      {isActive ? " · now" : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Get involved — 4 pillar cards ────────────────────────── */}
      <section ref={involvedRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Be part of it
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Four ways in.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          The conference runs because hundreds of people contribute &mdash; as
          speakers, reviewers, sponsors, and attendees. Pick the door that fits.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {getInvolved.map((item, i) => {
            const a = accentMap[item.accent];
            return (
              <a
                key={item.num}
                href={item.href}
                className={`group bg-white pt-9 pb-10 px-6 md:px-8 border-t-2 ${a.border} hover:bg-neutral-50/60 transition-colors ${
                  involvedInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  className={`font-display text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${a.num}`}
                >
                  {item.num}
                </span>
                <h3
                  className={`font-display text-xl lg:text-2xl font-bold text-neutral-900 mt-4 mb-3 tracking-tight transition-colors ${a.hover}`}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-6 max-w-md">
                  {item.desc}
                </p>
                <span
                  className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] ${a.eyebrow}`}
                >
                  {item.cta}
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
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* ── Past conferences — archive entries ───────────────────── */}
      <section ref={pastRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            The series so far
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            03 prior years
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Three years of gathering.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          USRSE has met every year since 2023. Each edition has shaped the
          next.
        </p>

        <div className="space-y-px bg-neutral-200">
          {pastConferences.map((c, i) => (
            <article
              key={c.year}
              className={`bg-white grid grid-cols-12 gap-6 lg:gap-10 items-center px-2 py-6 lg:px-4 lg:py-8 ${
                pastInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {/* Year + location */}
              <div className="col-span-12 sm:col-span-4 lg:col-span-3">
                <p className="font-display text-5xl lg:text-6xl font-black text-neutral-900 leading-none tracking-tight tabular-nums">
                  {c.year}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-purple-600 mt-3">
                  {c.city}
                </p>
              </div>

              {/* Theme */}
              <div className="col-span-12 sm:col-span-8 lg:col-span-5 sm:border-l sm:border-neutral-100 sm:pl-6 lg:pl-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-2">
                  Theme
                </p>
                <p className="font-display text-base lg:text-lg font-bold text-neutral-700 leading-snug tracking-tight max-w-md">
                  {c.theme}
                </p>
              </div>

              {/* Photo */}
              <div className="col-span-12 lg:col-span-4">
                <PhotoPlaceholder label={c.photoLabel} aspect="wide" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Quick links — pillar cards ───────────────────────────── */}
      <section ref={linksRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Where to go next
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Quick links.
        </h2>

        <div className="space-y-0">
          {quickLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className={`group flex items-center justify-between gap-6 py-5 ${
                i < quickLinks.length - 1 ? "border-b border-neutral-100" : ""
              } ${linksInView ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-baseline gap-4 min-w-0">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-purple-600 shrink-0 w-16">
                  {link.mono}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight group-hover:text-purple-700 transition-colors truncate">
                    {link.label}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">{link.desc}</p>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-neutral-300 group-hover:text-purple-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </a>
          ))}
        </div>
      </section>

      {/* ── CTA + contact ────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-4">
          See you in San Jose
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          The conference is built by the community that shows up.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Submit a proposal, sign up to review, sponsor a tier, or just
          register &mdash; every form of participation makes the program better.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="#cfp"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Submit a proposal
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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <span>Questions?</span>
            <a
              href="mailto:usrse26-conference@us-rse.org"
              className="text-neutral-700 hover:text-purple-700 transition-colors normal-case tracking-normal font-semibold"
            >
              usrse26-conference@us-rse.org
            </a>
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
          Around the conference.
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
                <h3 className="font-display text-lg font-bold text-neutral-900 tracking-tight mb-1 group-hover:text-purple-700 transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-neutral-500">{b.teaser}</p>
              </div>
              <svg
                className="w-5 h-5 text-neutral-400 group-hover:text-purple-700 transition-all group-hover:translate-x-1 shrink-0"
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
