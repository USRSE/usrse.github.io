import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";

export function CommunityAwardsPage() {
  const { ref: awardsRef, isInView: awardsVisible } = useInView(0.05);
  const { ref: timelineRef, isInView: timelineVisible } = useInView(0.1);
  const { ref: winnersRef, isInView: winnersVisible } = useInView(0.1);

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
      {/* Opening narrative */}
      <p className="text-xl text-neutral-700 leading-relaxed mb-16 max-w-2xl">
        The US-RSE Community Awards honor individuals who have made
        exceptional contributions to research software engineering — whether
        through technical excellence, community leadership, or both.
      </p>

      {/* ── Award Categories ──────────────────────────────────── */}
      <div ref={awardsRef} className="mb-20">
        {/* Technical Excellence Award */}
        <div
          className={`mb-16 ${awardsVisible ? "animate-slide-up" : "opacity-0"}`}
          style={{ animationDelay: "0ms" }}
        >
          <p className="font-mono text-xs text-teal-600 uppercase tracking-widest mb-3">
            Award 01
          </p>
          <h2 className="font-display text-3xl font-bold text-neutral-900 mb-6">
            Technical Excellence Award
          </h2>
          <p className="text-neutral-600 leading-relaxed mb-6">
            Recognizes outstanding technical contributions to research
            software. Awarded in two categories: Student/Early Career and
            Professional.
          </p>
          <div className="border-l-2 border-teal-200 pl-5 space-y-3 text-neutral-500 text-sm">
            <p>
              <strong className="text-neutral-700">Reproducibility &amp; Re-use</strong>{" "}
              — creating software that others can build upon
            </p>
            <p>
              <strong className="text-neutral-700">Modernization &amp; Sustainability</strong>{" "}
              — improving the long-term viability of research software
            </p>
            <p>
              <strong className="text-neutral-700">Mentorship in Craft</strong>{" "}
              — elevating the technical skills of others
            </p>
          </div>
        </div>

        {/* Community Impact Award */}
        <div
          className={`${awardsVisible ? "animate-slide-up" : "opacity-0"}`}
          style={{ animationDelay: "120ms" }}
        >
          <p className="font-mono text-xs text-teal-600 uppercase tracking-widest mb-3">
            Award 02
          </p>
          <h2 className="font-display text-3xl font-bold text-neutral-900 mb-6">
            Community Impact &amp; Leadership Award
          </h2>
          <p className="text-neutral-600 leading-relaxed mb-6">
            Recognizes individuals who have strengthened the RSE community
            through leadership, mentorship, and advocacy. Also awarded in
            Student/Early Career and Professional categories.
          </p>
          <div className="border-l-2 border-teal-200 pl-5 space-y-3 text-neutral-500 text-sm">
            <p>
              <strong className="text-neutral-700">Strategic Leadership</strong>{" "}
              — shaping the direction of the RSE movement
            </p>
            <p>
              <strong className="text-neutral-700">Mentorship &amp; Talent Development</strong>{" "}
              — investing in the next generation of RSEs
            </p>
            <p>
              <strong className="text-neutral-700">Outreach &amp; Advocacy</strong>{" "}
              — raising the visibility and recognition of RSEs
            </p>
          </div>
        </div>
      </div>

      {/* ── 2024 Winners ──────────────────────────────────────── */}
      <hr className="mb-16 border-neutral-100" />

      <div ref={winnersRef} className="mb-20">
        <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest mb-6">
          2024 Recipients
        </p>

        <div className="space-y-10">
          <div
            className={`${winnersVisible ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: "0ms" }}
          >
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 mb-1">
              Daniel S. Katz
            </h3>
            <p className="text-sm text-teal-600 font-medium mb-3">
              Community Impact Award
            </p>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-xl">
              Recognized for sustained strategic leadership and tireless
              advocacy for the recognition and value of research software
              engineers across institutions and disciplines.
            </p>
          </div>

          <div
            className={`${winnersVisible ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: "100ms" }}
          >
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 mb-1">
              Christina Maimone
            </h3>
            <p className="text-sm text-teal-600 font-medium mb-3">
              Excellence in Service Award
            </p>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-xl">
              Honored for exceptional service to the US-RSE community
              through organizational leadership and dedicated contributions
              to community infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* ── Nomination Timeline ───────────────────────────────── */}
      <hr className="mb-16 border-neutral-100" />

      <div ref={timelineRef} className="mb-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8">
          2025 Nomination Timeline
        </h2>

        {/* Horizontal step flow */}
        <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-0">
          {[
            {
              label: "Nominations Open",
              date: "June 2",
              active: true,
            },
            {
              label: "Nominations Close",
              date: "July 11",
              active: false,
            },
            {
              label: "Winners Announced",
              date: "September 8",
              active: false,
            },
          ].map((step, i) => (
            <div
              key={step.label}
              className={`flex-1 flex items-start gap-3 sm:flex-col sm:items-center sm:text-center ${
                timelineVisible ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Step indicator */}
              <div className="flex flex-col sm:flex-row items-center w-full">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    step.active ? "bg-teal-500" : "bg-neutral-300"
                  }`}
                />
                {i < 2 && (
                  <div className="hidden sm:block flex-1 h-px bg-neutral-200" />
                )}
              </div>
              <div className="sm:mt-3">
                <p className="font-mono text-xs text-teal-600 mb-0.5">
                  {step.date}
                </p>
                <p className="text-sm font-semibold text-neutral-700">
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Nomination Requirements ───────────────────────────── */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Nomination Requirements
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Nominations should include the following information. Self-nominations
          are not accepted.
        </p>
        <div className="border-l-2 border-neutral-200 pl-5 space-y-3 text-neutral-600 text-sm">
          <p>Nominator and nominee contact information</p>
          <p>Award category (Technical Excellence or Community Impact)</p>
          <p>Career stage (Student/Early Career or Professional)</p>
          <p>A statement of up to 500 words describing the nominee's contributions</p>
        </div>
      </div>

      {/* ── Eligibility & Prizes ──────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Eligibility &amp; Recognition
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Nominees must be current US-RSE members. Steering committee members
          and staff are not eligible. Priority is given to US-based
          contributors.
        </p>

        <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest mb-3">
          Awards include
        </p>
        <div className="border-l-2 border-teal-200 pl-5 space-y-3 text-neutral-500 text-sm">
          <p>Certificate of recognition</p>
          <p>Featured profile on the US-RSE website</p>
          <p>$250 gift card</p>
          <p>Recognition at the annual US-RSE conference</p>
        </div>
      </div>
    </CommunityLayout>
  );
}
