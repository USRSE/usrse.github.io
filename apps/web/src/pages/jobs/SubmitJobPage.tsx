import { Link } from "react-router-dom";
import { JobsLayout } from "@/components/jobs/JobsLayout";
import { useInView } from "@/hooks/useInView";

interface Fact {
  value: string;
  label: string;
}

const keyFacts: Fact[] = [
  { value: "$0", label: "Cost to post" },
  { value: "~2 min", label: "Form length" },
  { value: "2–5 days", label: "Review time" },
  { value: "US-based", label: "Roles only" },
];

interface OrgType {
  label: string;
  desc: string;
}

const orgTypes: OrgType[] = [
  { label: "Academic", desc: "Universities & colleges" },
  { label: "National lab", desc: "Federal research centers" },
  { label: "Industry", desc: "Companies hiring RSEs" },
  { label: "Non-profit", desc: "Foundations & institutes" },
];

interface Step {
  num: string;
  title: string;
  desc: string;
  meta: string;
  accent: "teal" | "purple";
}

const steps: Step[] = [
  {
    num: "01",
    title: "Review the policy",
    desc: "Confirm your role involves significant RSE responsibility, is open to US-based applicants, and fits the community's scope.",
    meta: "1 min · self-check",
    accent: "teal",
  },
  {
    num: "02",
    title: "Complete the form",
    desc: "Job title, organization, location, a short description, and a link to the full posting. That's it.",
    meta: "~2 min · Google Form",
    accent: "purple",
  },
  {
    num: "03",
    title: "We publish",
    desc: "Organizers review submissions within a few business days. Once approved, your listing goes live on the Job Board.",
    meta: "2–5 days · automatic",
    accent: "teal",
  },
];

const accentMap = {
  teal: {
    border: "border-teal-500",
    num: "text-teal-600",
    eyebrow: "text-teal-700",
    chip: "bg-teal-50 text-teal-800 border-teal-100",
  },
  purple: {
    border: "border-purple-500",
    num: "text-purple-600",
    eyebrow: "text-purple-600",
    chip: "bg-purple-50 text-purple-800 border-purple-100",
  },
};

interface FormField {
  mono: string;
  label: string;
  required: boolean;
  hint: string;
}

const formFields: FormField[] = [
  { mono: "title", label: "Job title", required: true, hint: "e.g. Senior Research Software Engineer" },
  { mono: "org", label: "Organization", required: true, hint: "Hiring institution or company" },
  { mono: "loc", label: "Location", required: true, hint: "City, state — or Remote (US)" },
  { mono: "desc", label: "Short description", required: true, hint: "1–2 sentences for the listing" },
  { mono: "url", label: "Link to posting", required: true, hint: "Official application URL" },
  { mono: "contact", label: "Contact email", required: false, hint: "Optional — for questions" },
];

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Browse",
    title: "Job Board",
    teaser: "See what's already posted and how listings are presented.",
    path: "/jobs",
  },
  {
    eyebrow: "Backers",
    title: "Sponsors",
    teaser: "Organizations that fund the work behind this board.",
    path: "/about/sponsors",
  },
  {
    eyebrow: "Volunteer",
    title: "Help build US-RSE",
    teaser: "Reviewers, organizers, and program leads are always welcome.",
    path: "/jobs/volunteer",
  },
  {
    eyebrow: "Connect",
    title: "Community Calls",
    teaser: "Where your future hires already gather every month.",
    path: "/community/calls",
  },
];

export function SubmitJobPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: factsRef, isInView: factsInView } = useInView(0.3);
  const { ref: whoRef, isInView: whoInView } = useInView(0.1);
  const { ref: stepsRef, isInView: stepsInView } = useInView(0.05);
  const { ref: formRef, isInView: formInView } = useInView(0.1);
  const { ref: eligRef, isInView: eligInView } = useInView(0.1);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

  return (
    <JobsLayout
      title="Post a Job"
      subtitle="Share your RSE opportunity with the community — it's free."
      prevPage={{ path: "/jobs", label: "Browse Jobs" }}
      nextPage={{
        path: "/jobs/volunteer",
        label: "Volunteer",
        teaser: "Help build the RSE community",
      }}
    >
      {/* ── The stance — it's free, it works ─────────────────────── */}
      <section
        ref={stanceRef}
        className={`mb-12 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
          Free posting for RSE positions
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-10 text-balance max-w-4xl">
          Two minutes of your time.{" "}
          <span className="text-teal-700">Hundreds of RSEs see your role.</span>
        </p>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
          No fee. No paywall. No catch. The Job Board exists because the
          community wants RSE openings to reach the right people &mdash; the
          fastest path to that is making it easy for hiring organizations to
          post.
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

      {/* ── Who can post — chips + supporting prose ──────────────── */}
      <section ref={whoRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Who can post
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Anyone hiring an RSE.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          If your role touches research software engineering, it belongs here.
          We welcome listings from across the research-computing ecosystem.
        </p>

        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200 ${
            whoInView ? "animate-fade-in" : "opacity-0"
          }`}
        >
          {orgTypes.map((o, i) => (
            <div
              key={o.label}
              className={`bg-white px-5 py-6 ${
                whoInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <p className="font-display text-base lg:text-lg font-bold text-neutral-900 tracking-tight">
                {o.label}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 mt-2">
                {o.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works — 3 process pillars with flow arrow ─────── */}
      <section ref={stepsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            How it works
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            03 steps
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          From submission to live in days.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          Three steps, mostly automated. The bottleneck is you, not us.
        </p>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
            {steps.map((s, i) => {
              const a = accentMap[s.accent];
              return (
                <article
                  key={s.num}
                  className={`bg-white pt-9 pb-10 px-6 md:px-7 border-t-2 ${a.border} ${
                    stepsInView ? "animate-slide-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span
                    className={`font-display text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${a.num}`}
                  >
                    {s.num}
                  </span>
                  <h3 className="font-display text-lg lg:text-xl font-bold text-neutral-900 mt-4 mb-3 tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-5 max-w-md">
                    {s.desc}
                  </p>
                  <p
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] inline-block px-2 py-0.5 rounded-full border ${a.chip}`}
                  >
                    {s.meta}
                  </p>
                </article>
              );
            })}
          </div>

          {/* Forward-flow arrows — overlaid above the grid so they always paint last */}
          {[1, 2].map((boundary) => (
            <span
              key={boundary}
              className="hidden md:flex absolute top-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-white rounded-full border border-neutral-200 text-neutral-400 pointer-events-none"
              style={{ left: `${(boundary / 3) * 100}%` }}
              aria-hidden="true"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          ))}
        </div>
      </section>

      {/* ── What you'll need — form-field preview ────────────────── */}
      <section ref={formRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600">
            What you&rsquo;ll need
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            06 fields
          </span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          The form, previewed.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          Have these ready before you start &mdash; the whole thing takes
          about two minutes.
        </p>

        {/* Form-stub list — each field is a styled "row" */}
        <div
          className={`rounded-2xl border border-neutral-200 bg-neutral-50/40 overflow-hidden ${
            formInView ? "animate-slide-up" : "opacity-0"
          }`}
        >
          {formFields.map((f, i) => (
            <div
              key={f.mono}
              className={`flex items-center gap-4 px-5 py-4 bg-white ${
                i < formFields.length - 1 ? "border-b border-neutral-100" : ""
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-purple-600 tabular-nums w-16 shrink-0">
                {f.mono}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm lg:text-base font-bold text-neutral-900 tracking-tight">
                  {f.label}
                  {f.required && (
                    <span className="text-purple-500 ml-1" aria-label="required">
                      *
                    </span>
                  )}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">
                  {f.hint}
                </p>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-neutral-300 shrink-0">
                {f.required ? "Required" : "Optional"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Eligibility — pull-quote treatment ───────────────────── */}
      <section
        ref={eligRef}
        className="mb-20 py-16 border-y-2 border-neutral-900 bg-teal-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className={eligInView ? "animate-slide-up" : "opacity-0"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
            Eligibility
          </p>
          <blockquote className="font-display text-2xl lg:text-[2rem] font-bold text-neutral-900 leading-[1.15] tracking-tight mb-8 text-balance max-w-4xl">
            &ldquo;If RSEs would be a strong fit and the role is open to
            US-based applicants, it belongs on the board.&rdquo;
          </blockquote>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 max-w-4xl">
            <p className="text-base text-neutral-600 leading-relaxed">
              The position must contain significant research software
              engineering responsibility, or be closely adjacent enough that
              RSEs would be strong candidates. Roles must be open to
              applicants based in the United States.
            </p>
            <p className="text-base text-neutral-600 leading-relaxed">
              Submissions are reviewed by organizers within a few business
              days. Posts that fall outside the criteria, or are otherwise
              inappropriate for the community, may be declined.
            </p>
          </div>

          {/* Org member highlight */}
          <div className="mt-10 pt-8 border-t border-neutral-300/50 max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-600 mb-2">
              Organizational members
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              <span className="font-display font-bold text-neutral-900">
                Priority placement at the top of the Job Board.
              </span>{" "}
              Member organizations get featured visibility on every listing
              they post &mdash; one of the perks of supporting the community.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA — submit a job ───────────────────────────────────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-4">
          Ready when you are
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          Submit your listing.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Have the details handy? The Google Form is the fastest path to a
          live listing. Questions? Reach out before you submit.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="#submit-form"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Open the form
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
              href="mailto:info@us-rse.org?subject=Job%20Posting"
              className="text-neutral-700 hover:text-teal-700 transition-colors normal-case tracking-normal font-semibold"
            >
              info@us-rse.org
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
          Where this listing lands.
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
    </JobsLayout>
  );
}
