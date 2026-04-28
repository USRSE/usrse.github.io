import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

const commitments = [
  "Continuously educating ourselves through research on diversity, equity, and inclusion best practices",
  "Embracing the culture and diversity of all of our members",
  "Welcoming and respecting the diverse ways that people think and learn",
  "Making our membership and the broader RSE community more representative of the national population",
  "Reducing both conscious and unconscious biases while working to eliminate systemic discrimination and marginalization",
  "Providing resources for members interested in learning more about diversity, equity, and inclusion",
  "Engaging with other community-based DEI initiatives",
  "Approaching every situation and person with empathy, listening to difficult truths, and acting courageously on what we learn",
];

export function DEIPage() {
  const { ref, isInView } = useInView(0.05);

  return (
    <AboutLayout
      title="DEI Statement"
      subtitle="Our commitment to diversity, equity, and inclusion."
      prevPage={{ path: "/about/what-is-an-rse", label: "What is an RSE?" }}
      nextPage={{
        path: "/about/governance",
        label: "Governance",
        teaser: "How US-RSE is organized and led",
      }}
    >
      {/* ── Opening statement — large editorial quote ──────────────── */}
      <blockquote className="relative mb-14">
        <p className="text-xl lg:text-2xl text-neutral-800 leading-relaxed font-medium">
          "The US-RSE Association is committed to providing an inclusive
          environment with equitable treatment for all and to promoting and
          encouraging diversity throughout the RSE community in the US."
        </p>
        <div className="mt-4 w-16 h-0.5 bg-purple-500" />
      </blockquote>

      {/* ── Why DEI matters ────────────────────────────────────────── */}
      <div className="space-y-6 text-neutral-600 leading-relaxed mb-16">
        <p>
          We recognize that integrating DEI practices into our education
          programs, governance structure, and culture is at the forefront of our
          mission to ensure a welcoming, nurturing, and robustly inclusive
          community.
        </p>
        <p>
          We recognize that the amplification of diverse perspectives is
          essential for driving innovation, promoting creativity, and
          encouraging engagement for the success of RSEs.
        </p>
        <p>
          We welcome and respect individuals of all dimensions of diversity,
          including but not limited to race, color, caste, economic status,
          gender expression, gender identity, sexual orientation, disability,
          neurocognitive differences, age, religion (or lack thereof), national
          origin, and ethnicity.
        </p>
      </div>

      {/* ── Commitments — numbered prose, not icon cards ────────────── */}
      <div ref={ref} className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Our Commitments
        </h2>
        <p className="text-neutral-500 mb-8">
          The US-RSE Association commits to:
        </p>

        <div className="space-y-0">
          {commitments.map((commitment, i) => (
            <div
              key={i}
              className={`flex gap-5 lg:gap-6 py-5 ${
                i < commitments.length - 1 ? "border-b border-neutral-100" : ""
              } ${isInView ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="font-mono text-xs text-purple-500 shrink-0 pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-neutral-600 leading-relaxed">
                {commitment}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── DEI Working Group ──────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          DEI Working Group
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-4">
          Our Diversity, Equity, and Inclusion Working Group actively develops
          and implements initiatives to make the RSE community more welcoming
          and representative. All members are invited to participate.
        </p>
        <a
          href="/#wg"
          className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
        >
          Learn about our Working Groups
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </AboutLayout>
  );
}
