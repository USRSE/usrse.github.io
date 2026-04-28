import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";

export function CommunityFundsPage() {
  const { ref: detailsRef, isInView: detailsVisible } = useInView(0.05);
  const { ref: processRef, isInView: processVisible } = useInView(0.1);

  return (
    <CommunityLayout
      title="Community Funds"
      subtitle="Financial support for activities that grow and strengthen the RSE community."
      prevPage={{
        path: "/community/awards",
        label: "Community Awards",
      }}
      nextPage={null}
    >
      {/* ── Status Callout ────────────────────────────────────── */}
      <div className="border-l-4 border-amber-400 bg-amber-50/50 pl-5 pr-4 py-4 mb-16">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          Applications Paused
        </p>
        <p className="text-sm text-amber-700 leading-relaxed">
          The Community Funds program is{" "}
          <strong>not currently accepting applications</strong>. Check back
          for updates or follow announcements on Slack and the US-RSE
          newsletter.
        </p>
      </div>

      {/* Opening narrative */}
      <p className="text-xl text-neutral-700 leading-relaxed mb-16 max-w-2xl">
        Supported by a grant from the Alfred P. Sloan Foundation, the
        Community Funds program provides financial support for activities
        that expand, diversify, and strengthen the RSE community.
        Individual proposals range from $100 to $10,000, with most funded
        at up to $2,500.
      </p>

      {/* ── Program Goals ─────────────────────────────────────── */}
      <div ref={detailsRef} className="mb-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8">
          Program Goals
        </h2>

        {[
          {
            num: "01",
            title: "Expand & Diversify",
            body: "Grow and diversify the US-RSE community by supporting activities that reach new audiences and underrepresented groups.",
          },
          {
            num: "02",
            title: "Foster Connections",
            body: "Strengthen relationships within the community through events, meetups, and collaborative projects.",
          },
          {
            num: "03",
            title: "Support Career Development",
            body: "Help members develop professional skills through training, certifications, and conference attendance.",
          },
          {
            num: "04",
            title: "Elevate RSE Visibility",
            body: "Raise the profile of research software engineering through outreach, media production, and sponsorships.",
          },
        ].map((goal, i) => (
          <div
            key={goal.num}
            className={`flex gap-5 lg:gap-8 py-7 ${
              i < 3 ? "border-b border-neutral-100" : ""
            } ${detailsVisible ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="font-mono text-sm text-teal-600 shrink-0 pt-1">
              {goal.num}
            </span>
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-1.5">
                {goal.title}
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {goal.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Eligible Activities ───────────────────────────────── */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Eligible Activities
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          The program supports a wide range of community-building
          activities. Examples include but are not limited to:
        </p>
        <div className="border-l-2 border-teal-200 pl-5 space-y-3 text-neutral-600 text-sm">
          <p>Local events, workshops, and regional meetups</p>
          <p>Training programs and professional certifications</p>
          <p>Conference attendance and travel support</p>
          <p>Media production (podcasts, videos, written content)</p>
          <p>Working group infrastructure and tooling</p>
          <p>Sponsorships that promote RSE visibility</p>
        </div>
      </div>

      {/* ── Application Process ───────────────────────────────── */}
      <hr className="mb-16 border-neutral-100" />

      <div ref={processRef} className="mb-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8">
          Application &amp; Review Process
        </h2>

        {[
          {
            num: "01",
            title: "Submit a Proposal",
            body: "Applications are evaluated quarterly. Proposals should describe the activity, its expected community impact, a budget, and a brief timeline.",
          },
          {
            num: "02",
            title: "Review Criteria",
            body: "Each proposal is assessed on community impact, alignment with the US-RSE mission, funding availability, and the applicant's qualifications to carry out the activity.",
          },
          {
            num: "03",
            title: "Post-Award Reporting",
            body: "Successful applicants submit a brief report after completing their activity, which US-RSE publishes to share outcomes with the community.",
          },
        ].map((step, i) => (
          <div
            key={step.num}
            className={`flex gap-5 lg:gap-8 py-6 ${
              i < 2 ? "border-b border-neutral-100" : ""
            } ${processVisible ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="font-mono text-sm text-teal-600 shrink-0 pt-0.5">
              {step.num}
            </span>
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-1.5">
                {step.title}
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Eligibility & Limits ──────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Eligibility &amp; Limits
        </h2>
        <div className="border-l-2 border-neutral-200 pl-5 space-y-3 text-neutral-600 text-sm">
          <p>Applicants must be current US-RSE members</p>
          <p>Individual funding is limited to once per rolling 12-month period</p>
          <p>
            Travel support covers future events only — economy airfare,
            hotel, and registration (meals and per diem are not covered)
          </p>
          <p>Most awards are $2,500 or less; proposals up to $10,000 are considered for larger initiatives</p>
        </div>
      </div>
    </CommunityLayout>
  );
}
