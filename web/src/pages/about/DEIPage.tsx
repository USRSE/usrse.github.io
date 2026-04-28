import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

const commitments = [
  {
    text: "Continuously educating ourselves through research on diversity, equity, and inclusion best practices",
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  },
  {
    text: "Embracing the culture and diversity of all of our members",
    icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
  },
  {
    text: "Welcoming and respecting the diverse ways that people think and learn",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
  },
  {
    text: "Making our membership and the broader RSE community more representative of the national population",
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  },
  {
    text: "Reducing both conscious and unconscious biases while working to eliminate systemic discrimination and marginalization",
    icon: "M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z",
  },
  {
    text: "Providing resources for members interested in learning more about diversity, equity, and inclusion",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  {
    text: "Engaging with other community-based DEI initiatives",
    icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
  },
  {
    text: "Approaching every situation and person with empathy, listening to difficult truths, and acting courageously on what we learn",
    icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z",
  },
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
      {/* Mission statement */}
      <div className="mb-12">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-teal-50 border border-purple-100 mb-8">
          <p className="text-lg text-neutral-700 leading-relaxed font-medium">
            The US-RSE Association is committed to providing an inclusive
            environment with equitable treatment for all and to promoting and
            encouraging diversity throughout the RSE community in the US.
          </p>
        </div>

        <p className="text-neutral-600 leading-relaxed mb-6">
          We recognize that integrating DEI practices into our education
          programs, governance structure, and culture is at the forefront of our
          mission to ensure a welcoming, nurturing, and robustly inclusive
          community.
        </p>

        <p className="text-neutral-600 leading-relaxed mb-6">
          We recognize that the amplification of diverse perspectives is
          essential for driving innovation, promoting creativity, and
          encouraging engagement for the success of RSEs.
        </p>

        <p className="text-neutral-600 leading-relaxed">
          We welcome and respect individuals of all dimensions of diversity,
          including but not limited to race, color, caste, economic status,
          gender expression, gender identity, sexual orientation, disability,
          neurocognitive differences, age, religion (or lack thereof), national
          origin, and ethnicity.
        </p>
      </div>

      {/* Commitments */}
      <div ref={ref} className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Our Commitments
        </h2>
        <p className="text-neutral-500 mb-8">
          The US-RSE Association commits to:
        </p>

        <div className="space-y-3">
          {commitments.map((commitment, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50 transition-all ${
                isInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d={commitment.icon} />
                </svg>
              </div>
              <p className="text-neutral-600 leading-relaxed text-sm pt-2">
                {commitment.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* DEI Working Group callout */}
      <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-100">
        <h3 className="font-bold text-neutral-900 mb-2">
          DEI Working Group
        </h3>
        <p className="text-sm text-neutral-600 leading-relaxed mb-4">
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
