import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";
import { useInView } from "@/hooks/useInView";

/**
 * Thirteen dimensions of human difference the Association recognizes,
 * drawn directly from the official statement. Order mirrors the source
 * document.
 */
const dimensions = [
  "Race",
  "Color",
  "Caste",
  "Economic status",
  "Gender expression",
  "Gender identity",
  "Sexual orientation",
  "Disability",
  "Neurocognitive differences",
  "Age",
  "Religion (or lack thereof)",
  "National origin",
  "Ethnicity",
];

interface Commitment {
  num: string;
  title: string;
  body: string;
}

const commitments: Commitment[] = [
  {
    num: "01",
    title: "Keep learning",
    body: "Continuously educate ourselves through research on diversity, equity, and inclusion best practices.",
  },
  {
    num: "02",
    title: "Embrace difference",
    body: "Embrace the culture and diversity of all of our members.",
  },
  {
    num: "03",
    title: "Respect how people think",
    body: "Welcome and respect the diverse ways that people think and learn.",
  },
  {
    num: "04",
    title: "Grow our representation",
    body: "Make our membership and the broader RSE community more representative of the national population.",
  },
  {
    num: "05",
    title: "Confront bias",
    body: "Reduce both conscious and unconscious biases while working to eliminate systemic discrimination and marginalization.",
  },
  {
    num: "06",
    title: "Share what we learn",
    body: "Provide resources for members interested in learning more about diversity, equity, and inclusion.",
  },
  {
    num: "07",
    title: "Collaborate broadly",
    body: "Engage with other community-based DEI initiatives.",
  },
  {
    num: "08",
    title: "Listen with courage",
    body: "Approach every situation and person with empathy, listen to difficult truths, and act courageously on what we learn.",
  },
];

const pillarAccent = {
  teal: { border: "border-teal-500", num: "text-teal-600" },
  purple: { border: "border-purple-500", num: "text-purple-500" },
};

interface Bridge {
  eyebrow: string;
  title: string;
  teaser: string;
  path: string;
}

const bridges: Bridge[] = [
  {
    eyebrow: "Accountability",
    title: "Code of Conduct",
    teaser: "The standards we hold ourselves and each other to.",
    path: "/about/code-of-conduct",
  },
  {
    eyebrow: "Belonging",
    title: "Affinity Groups",
    teaser: "Communities within the community.",
    path: "/community/affinity",
  },
  {
    eyebrow: "Access",
    title: "Community Funds",
    teaser: "Travel support and financial access for members.",
    path: "/community/funds",
  },
  {
    eyebrow: "Action",
    title: "Working Groups",
    teaser: "Where this work happens day-to-day, including the DEI WG.",
    path: "/community/working-groups",
  },
];

export function DEIPage() {
  const { ref: stanceRef, isInView: stanceInView } = useInView(0.2);
  const { ref: whyRef, isInView: whyInView } = useInView(0.1);
  const { ref: dimensionsRef, isInView: dimensionsInView } = useInView(0.1);
  const { ref: commitmentsRef, isInView: commitmentsInView } = useInView(0.05);
  const { ref: ctaRef, isInView: ctaInView } = useInView(0.2);
  const { ref: bridgeRef, isInView: bridgeInView } = useInView(0.1);

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
      {/* ── The stance — manifesto + official commitment ─────────── */}
      <section
        ref={stanceRef}
        className={`mb-20 ${stanceInView ? "animate-slide-up" : "opacity-0"}`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          Where we stand
        </p>
        <p className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-10 text-balance max-w-4xl">
          Research is better when the people doing it reflect the world it
          serves.
        </p>
        <blockquote className="border-l-2 border-purple-500 pl-6 max-w-3xl">
          <p className="text-lg text-neutral-700 leading-relaxed italic">
            &ldquo;The US-RSE Association is committed to providing an
            inclusive environment with equitable treatment for all and to
            promoting and encouraging diversity throughout the RSE community
            in the US.&rdquo;
          </p>
          <footer className="mt-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            The official commitment
          </footer>
        </blockquote>
      </section>

      {/* ── Why it matters — pull quote + supporting prose ──────── */}
      <section
        ref={whyRef}
        className="mb-20 py-16 border-y-2 border-neutral-900 bg-purple-50/40 -mx-6 lg:-mx-10 px-6 lg:px-10"
      >
        <div className={whyInView ? "animate-slide-up" : "opacity-0"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
            Why it matters
          </p>
          <blockquote className="font-display text-2xl lg:text-[2rem] font-bold text-neutral-900 leading-[1.15] tracking-tight mb-8 text-balance max-w-4xl">
            &ldquo;Diverse perspectives aren&rsquo;t a nice-to-have — they are
            how research gets better.&rdquo;
          </blockquote>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 max-w-4xl">
            <p className="text-base text-neutral-600 leading-relaxed">
              Integrating DEI practices into our education programs,
              governance structure, and culture is central to building a
              welcoming, nurturing, and robustly inclusive community. The
              amplification of diverse perspectives drives innovation,
              promotes creativity, and fuels engagement for the success of
              RSEs.
            </p>
            <p className="text-base text-neutral-600 leading-relaxed">
              A research software community that looks like the country it
              serves produces software that serves the country. The opposite
              is also true: blind spots in who builds research software
              become blind spots in the research itself.
            </p>
          </div>
        </div>
      </section>

      {/* ── Every dimension of diversity ─────────────────────────── */}
      <section ref={dimensionsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Every dimension of human difference
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          We welcome all of it.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-10">
          Our definition of diversity is intentionally expansive. The work
          benefits from every perspective — including, but not limited to:
        </p>

        <div
          className={`flex flex-wrap gap-2 mb-6 ${
            dimensionsInView ? "animate-fade-in" : "opacity-0"
          }`}
        >
          {dimensions.map((d) => (
            <span
              key={d}
              className="font-mono text-[12px] px-3 py-1.5 rounded-full bg-white border border-purple-200 text-purple-900"
            >
              {d}
            </span>
          ))}
        </div>
        <p className="text-sm text-neutral-400 max-w-2xl font-mono">
          &hellip; and any dimension we haven&rsquo;t yet learned to name.
        </p>
      </section>

      {/* ── Our commitments — 8 pillar blocks in 2×4 grid ────────── */}
      <section ref={commitmentsRef} className="mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            What we commit to
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          Eight commitments.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-12">
          The US-RSE Association commits to these ongoing practices. Hold us
          to them — and help us live them.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {commitments.map((c, i) => {
            const a = i % 2 === 0 ? pillarAccent.teal : pillarAccent.purple;
            return (
              <article
                key={c.num}
                className={`bg-white pt-9 pb-10 px-6 md:px-8 border-t-2 ${a.border} ${
                  commitmentsInView ? "animate-slide-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span
                  className={`font-display text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${a.num}`}
                >
                  {c.num}
                </span>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 mt-4 mb-3 tracking-tight">
                  {c.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed max-w-md">
                  {c.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Join us in this work — CTA + inline exit ramps ──────── */}
      <section
        ref={ctaRef}
        className={`mb-20 pt-12 border-t border-neutral-100 ${
          ctaInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-4">
          Be part of this
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance max-w-3xl">
          This is ongoing work. Help us do it.
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl mb-8">
          Our DEI Working Group turns these commitments into initiatives.
          Members at every career stage are welcome — no expertise required,
          only care.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="mailto:info@us-rse.org?subject=DEI%20Working%20Group"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Join the DEI Working Group
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
            <span>or</span>
            <Link
              to="/community/affinity"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Affinity groups
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/community/funds"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Community funds
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link
              to="/about/code-of-conduct"
              className="text-neutral-700 hover:text-purple-700 transition-colors"
            >
              Code of Conduct
            </Link>
          </div>
        </div>
      </section>

      {/* ── Continue exploring — bridge cards ───────────────────── */}
      <section ref={bridgeRef} className="mb-4 pt-12 border-t-2 border-neutral-900">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Continue exploring
          </p>
          <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight mb-10">
          How this work actually happens.
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
    </AboutLayout>
  );
}
