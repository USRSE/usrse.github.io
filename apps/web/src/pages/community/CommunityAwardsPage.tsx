import { Link } from "react-router-dom";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "02", label: "Award categories" },
  { value: "02", label: "Career stages each" },
  { value: "Annual", label: "Nomination cycle" },
  { value: "$250", label: "Plus recognition" },
];

interface Award {
  num: string;
  title: string;
  summary: string;
  criteria: { title: string; body: string }[];
  accent: "teal" | "purple";
}

const awards: Award[] = [
  {
    num: "01",
    title: "Technical Excellence Award",
    summary:
      "Outstanding technical contributions to research software. Awarded in two categories: Student/Early Career and Professional.",
    criteria: [
      {
        title: "Reproducibility & Re-use",
        body: "Creating software that others can build upon.",
      },
      {
        title: "Modernization & Sustainability",
        body: "Improving the long-term viability of research software.",
      },
      {
        title: "Mentorship in Craft",
        body: "Elevating the technical skills of others.",
      },
    ],
    accent: "teal",
  },
  {
    num: "02",
    title: "Community Impact & Leadership Award",
    summary:
      "Individuals who have strengthened the RSE community through leadership, mentorship, and advocacy. Awarded in Student/Early Career and Professional categories.",
    criteria: [
      {
        title: "Strategic Leadership",
        body: "Shaping the direction of the RSE movement.",
      },
      {
        title: "Mentorship & Talent Development",
        body: "Investing in the next generation of RSEs.",
      },
      {
        title: "Outreach & Advocacy",
        body: "Raising the visibility and recognition of RSEs.",
      },
    ],
    accent: "purple",
  },
];

const awardAccent = {
  teal: {
    border: "border-teal-500",
    num: "text-teal-600",
    bullet: "text-teal-600",
  },
  purple: {
    border: "border-purple-500",
    num: "text-purple-500",
    bullet: "text-purple-500",
  },
};

interface Recipient {
  name: string;
  award: string;
  citation: string;
  photo: string;
}

const recipients2024: Recipient[] = [
  {
    name: "Daniel S. Katz",
    award: "Community Impact Award",
    citation:
      "Recognized for sustained strategic leadership and tireless advocacy for the recognition and value of research software engineers across institutions and disciplines.",
    photo: "/images/board-of-directors/daniel-katz.jpeg",
  },
  {
    name: "Christina Maimone",
    award: "Excellence in Service Award",
    citation:
      "Honored for exceptional service to the US-RSE community through organizational leadership and dedicated contributions to community infrastructure.",
    photo: "/images/board-of-directors/christina-maimone.jpeg",
  },
];

interface TimelineStep {
  label: string;
  date: string;
}

const timelineSteps: TimelineStep[] = [
  { label: "Nominations open", date: "June 2" },
  { label: "Nominations close", date: "July 11" },
  { label: "Winners announced", date: "September 8" },
];

const requirements = [
  "Nominator and nominee contact information",
  "Award category (Technical Excellence or Community Impact)",
  "Career stage (Student/Early Career or Professional)",
  "A statement of up to 500 words describing the nominee's contributions",
];

const recognition = [
  "Certificate of recognition",
  "Featured profile on the US-RSE website",
  "$250 gift card",
  "Recognition at the annual US-RSE conference",
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Conference",
    title: "Upcoming Events",
    teaser: "Where awards are celebrated each year.",
    path: "/events/upcoming",
  },
  {
    eyebrow: "Focus",
    title: "Working Groups",
    teaser: "Where the work being recognized gets done.",
    path: "/community/working-groups",
  },
  {
    eyebrow: "Belonging",
    title: "Affinity Groups",
    teaser: "Communities within the community.",
    path: "/community/affinity-groups",
  },
  {
    eyebrow: "Helping",
    title: "Volunteer",
    teaser: "Another way to contribute beyond nomination season.",
    path: "/jobs/volunteer",
  },
];

export function CommunityAwardsPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: awardsRef, isInView: awardsInView } = useInView(0.05);
  const { ref: recipientsRef, isInView: recipientsInView } = useInView(0.05);
  const { ref: nominateRef, isInView: nominateInView } = useInView(0.1);
  const { ref: recognitionRef, isInView: recognitionInView } = useInView(0.15);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <CommunityLayout
      title="Community Awards"
      subtitle="Recognizing the people and contributions that make the RSE community extraordinary."
      prevPage={{
        path: "/community/calls",
        label: "Community Calls",
      }}
      nextPage={{
        path: "/community/funds",
        label: "Community Funds",
        teaser: "Funding for community initiatives",
      }}
    >
      {/* ── The stance — manifesto ───────────────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          The people behind the work
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          The community recognizes its own.
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          Each year, US-RSE honors members who&rsquo;ve made exceptional
          contributions to research software engineering &mdash; whether
          through technical excellence, community leadership, or the hundreds
          of smaller acts of service that make a community possible.
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

      {/* ── The two awards — 2 pillar blocks ─────────────────────── */}
      <section ref={awardsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Two categories
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          The awards.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {awards.map((a, i) => {
            const acc = awardAccent[a.accent];
            return (
              <article
                key={a.num}
                className={`bg-white pt-10 pb-12 px-6 md:px-8 border-t-2 ${acc.border} ${
                  awardsInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span
                  className={`font-display text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${acc.num}`}
                >
                  {a.num}
                </span>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 mt-5 mb-3 tracking-tight text-balance">
                  {a.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-6 text-pretty">
                  {a.summary}
                </p>
                <div className="pt-5 border-t border-neutral-100">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
                    Evaluation criteria
                  </p>
                  <ul className="space-y-3">
                    {a.criteria.map((c) => (
                      <li
                        key={c.title}
                        className="grid grid-cols-[auto_1fr] gap-3 items-baseline"
                      >
                        <span
                          className={`${acc.bullet} select-none text-sm leading-none`}
                          aria-hidden="true"
                        >
                          →
                        </span>
                        <div>
                          <p className="font-semibold text-sm text-neutral-900">
                            {c.title}
                          </p>
                          <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">
                            {c.body}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Recent recipients — humanized cards ──────────────────── */}
      <section ref={recipientsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Recent recipients
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            2024
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          Honored in 2024.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Two members recognized for work that has shaped the direction of
          research software engineering &mdash; and the community that
          practices it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {recipients2024.map((r, i) => (
            <div
              key={r.name}
              className={`group bg-white p-6 md:p-8 border-t-2 border-purple-500 flex flex-col ${
                recipientsInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <div className="flex items-start gap-5 mb-5">
                <div className="relative overflow-hidden rounded-xl w-24 h-24 md:w-28 md:h-28 bg-neutral-100 shrink-0">
                  <img
                    src={r.photo}
                    alt={r.name}
                    className="absolute inset-0 w-full h-full object-cover object-top grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-600 mb-1.5">
                    {r.award}
                  </p>
                  <h3 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight leading-tight">
                    {r.name}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {r.citation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nominate someone — timeline + requirements + CTA ────── */}
      <section
        ref={nominateRef}
        className="mb-20 pt-12 border-t border-neutral-100"
      >
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Know someone who deserves this?
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Nominate them.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Nominations come from the community &mdash; self-nominations
          aren&rsquo;t accepted. Point someone out who deserves the
          recognition.
        </p>

        {/* Timeline */}
        <div className="mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 mb-5">
            Annual timeline
          </p>
          <div
            className={`flex flex-col sm:flex-row items-start sm:items-stretch gap-0 ${
              nominateInView ? "animate-slide-up" : "opacity-0"
            }`}
          >
            {timelineSteps.map((step, i) => (
              <div
                key={step.label}
                className="flex-1 flex items-start gap-3 sm:flex-col sm:items-center sm:text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row items-center w-full">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      i === 0 ? "bg-teal-500" : "bg-neutral-300"
                    }`}
                    aria-hidden="true"
                  />
                  {i < timelineSteps.length - 1 && (
                    <div className="hidden sm:block flex-1 h-px bg-neutral-200" />
                  )}
                </div>
                <div className="sm:mt-3">
                  <p className="font-mono text-xs text-teal-700 mb-0.5 tabular-nums">
                    {step.date}
                  </p>
                  <p className="text-sm font-semibold text-neutral-800">
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
            Dates shown reflect the 2025 cycle &mdash; 2026 timeline to be
            announced.
          </p>
        </div>

        {/* Requirements */}
        <div className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
            What to include in a nomination
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 max-w-3xl">
            {requirements.map((req, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr] gap-3 items-baseline text-sm text-neutral-700"
              >
                <span className="font-mono text-[11px] text-teal-600 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Nominees must be current US-RSE members. Steering committee members
          and staff are not eligible. Priority is given to US-based
          contributors.
        </p>

        <a
          href="mailto:info@us-rse.org?subject=Community%20Award%20Nomination"
          className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          Submit a nomination
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
      </section>

      {/* ── Recognition — what winners receive ───────────────────── */}
      <section ref={recognitionRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What winners receive
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-12">
          Recognition, in four forms.
        </h2>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 ${
            recognitionInView ? "animate-fade-in" : "opacity-0"
          }`}
        >
          {recognition.map((item, i) => (
            <div key={item} className="bg-white p-6 md:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 tabular-nums mb-3">
                0{i + 1}
              </p>
              <p className="font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight leading-snug">
                {item}
              </p>
            </div>
          ))}
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
          The rest of how the community shows up.
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
    </CommunityLayout>
  );
}
