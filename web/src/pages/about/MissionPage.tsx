import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

export function MissionPage() {
  const { ref, isInView } = useInView(0.1);

  return (
    <AboutLayout
      title="Our Mission"
      subtitle="A community-driven effort focused on the increasingly important role of the Research Software Engineer."
      nextPage={{
        path: "/about/what-is-an-rse",
        label: "What is an RSE?",
        teaser: "Learn who Research Software Engineers are",
      }}
    >
      {/* Opening narrative — editorial prose, not a summary block */}
      <p className="text-xl text-neutral-700 leading-relaxed mb-16 max-w-2xl">
        The US Research Software Engineer Association (US-RSE) is a
        community-driven effort focused on the increasingly important role of
        the Research Software Engineer. We focus on four overarching areas.
      </p>

      {/* ── Four Pillars — typographic, not cards ──────────────────── */}
      <div ref={ref} className="mb-20">
        {[
          {
            num: "01",
            title: "Community",
            color: "text-teal-600",
            body: "Building a connective, supportive, and diverse community of those who write and contribute to research software. Our community spans universities, laboratories, companies, and institutions of all sizes.",
          },
          {
            num: "02",
            title: "Advocacy",
            color: "text-purple-500",
            body: "Advocating for the recognition of the RSE role and career path, raising awareness of the importance of software in research, and promoting the value RSEs bring to the research enterprise.",
          },
          {
            num: "03",
            title: "Resources",
            color: "text-teal-600",
            body: "Providing useful shared resources to the community including a jobs board, educational materials, and connections to opportunities for professional development.",
          },
          {
            num: "04",
            title: "Diversity, Equity & Inclusion",
            color: "text-purple-500",
            body: "Ensuring an inclusive environment with equitable treatment for all, and promoting and encouraging diversity throughout the RSE community in the US.",
          },
        ].map((pillar, i) => (
          <div
            key={pillar.num}
            className={`flex gap-5 lg:gap-8 py-8 ${
              i < 3 ? "border-b border-neutral-100" : ""
            } ${isInView ? "animate-slide-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className={`font-mono text-sm ${pillar.color} shrink-0 pt-1`}>
              {pillar.num}
            </span>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                {pillar.title}
              </h3>
              <p className="text-neutral-500 leading-relaxed">
                {pillar.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Membership ─────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Membership
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Membership in US-RSE is easy and free. We welcome anyone who supports
          our organizational mission, regardless of location or institutional
          affiliation. Our members include:
        </p>

        {/* Indented text block — not bullet points in cards */}
        <div className="border-l-2 border-neutral-200 pl-5 space-y-3 text-neutral-600">
          <p>People who identify as Research Software Engineers</p>
          <p>People who are interested in a career as an RSE</p>
          <p>People who are allies of the RSE community</p>
          <p>People who are managers of RSEs</p>
        </div>
      </div>

      {/* ── Why Research Software Matters ───────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Why Research Software Matters
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          The increasing use of digital technologies across research communities
          has gone hand in hand with a strong growth and reliance on software
          written or customized to solve research problems. This growth presents
          great opportunities to:
        </p>

        <div className="border-l-2 border-purple-200 pl-5 space-y-3 text-neutral-600 mb-6">
          <p>Improve the development of research software</p>
          <p>Incentivize the sharing, curation, and maintenance of research software artifacts and knowledge</p>
        </div>

        <p className="text-neutral-600 leading-relaxed">
          Research software does not develop, curate, or maintain itself. RSEs
          create value both directly — by enabling specific research projects —
          and indirectly — by ensuring that research software meets standards for
          impact and reproducibility.
        </p>
      </div>

      {/* ── Origins — timeline style, not a card ───────────────────── */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          Our Origins
        </h2>
        <div className="flex gap-5 lg:gap-8">
          <div className="shrink-0 flex flex-col items-center">
            <span className="font-mono text-xs text-neutral-400">2017</span>
            <div className="w-px flex-1 bg-neutral-200 my-2" />
            <span className="font-mono text-xs text-neutral-400">2018</span>
          </div>
          <p className="text-neutral-600 leading-relaxed">
            US-RSE traces its origins to conversations at an international RSE
            survey and the first International RSE Leaders Workshop held in
            London. Five US representatives at that workshop were inspired to
            establish a formal US community, and the US-RSE Association has been
            growing ever since — from a handful of founding members to over
            4,000 today.
          </p>
        </div>
      </div>
    </AboutLayout>
  );
}
