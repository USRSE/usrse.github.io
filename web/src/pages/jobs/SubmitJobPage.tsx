import { JobsLayout } from "@/components/jobs/JobsLayout";

const steps = [
  {
    number: "01",
    title: "Review the posting policy",
    desc: "Positions must involve significant RSE responsibility or be adjacent enough that research software engineers would be interested. The role must be open to US-based applicants.",
  },
  {
    number: "02",
    title: "Complete the Google Form",
    desc: "Provide the job title, organization, location, a brief description, and a link to the full posting. The form takes about two minutes.",
  },
  {
    number: "03",
    title: "Your post goes live within days",
    desc: "Submissions are reviewed by the organizing team within a few business days. Once approved, your listing appears on the Job Board and is shared with the community.",
  },
];

export function SubmitJobPage() {
  return (
    <JobsLayout
      title="Post a Job"
      subtitle="Share your RSE opportunity with the community — it's free."
      prevPage={{ path: "/jobs", label: "Browse Jobs" }}
      nextPage={{ path: "/jobs/volunteer", label: "Volunteer", teaser: "Help build the RSE community" }}
    >
      {/* ── Display callout ───────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-display text-5xl lg:text-6xl font-bold text-neutral-900 leading-none">
          It's free.
        </p>
        <p className="text-lg text-neutral-500 mt-3">
          No cost, no catch. We want RSE positions to reach the right people.
        </p>
      </section>

      {/* ── Who can post ──────────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          Who Can Post
        </p>
        <p className="text-neutral-600 leading-relaxed">
          Academic institutions, national laboratories, industry organizations, and non-profits
          are all welcome to submit positions. If your role touches research software engineering,
          it belongs here.
        </p>
      </section>

      {/* ── Eligibility ───────────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          Eligibility
        </p>
        <div className="border-l-2 border-neutral-200 pl-6 space-y-4">
          <p className="text-neutral-600 leading-relaxed">
            The position must contain significant research software engineering responsibility,
            or be closely adjacent enough that RSEs would be a strong fit. Roles must be open
            to applicants based in the United States.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            Submissions are reviewed by organizers within a few business days. The team may
            decline posts that are inappropriate, inapplicable to the RSE community, or that
            do not meet the posting criteria.
          </p>
        </div>
      </section>

      {/* ── Process steps ─────────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-8">
          How It Works
        </p>
        <div className="space-y-10">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6">
              <span className="font-mono text-2xl font-bold text-neutral-200 leading-none shrink-0 w-10">
                {step.number}
              </span>
              <div>
                <h3 className="font-bold text-neutral-900 mb-1">{step.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Org member note ───────────────────────────────────────── */}
      <section className="mb-16">
        <div className="border-l-2 border-purple-200 pl-6">
          <p className="text-sm text-neutral-500 leading-relaxed">
            <span className="font-semibold text-neutral-700">Organizational members:</span>{" "}
            Listings from US-RSE member organizations receive priority placement at the top
            of the Job Board, giving your posting greater visibility.
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section>
        <hr className="border-neutral-100 mb-10" />
        <a
          href="#submit-form"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors shadow-sm"
        >
          Submit a Job
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </section>
    </JobsLayout>
  );
}
