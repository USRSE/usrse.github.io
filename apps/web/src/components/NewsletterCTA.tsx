import { Link } from "react-router-dom";
import { useInView } from "@/hooks/useInView";

/**
 * Newsletter subscription CTA — a dark band that breaks the page rhythm.
 * Positioned on the homepage to capture visitors who've scrolled through
 * the value proposition but aren't ready to join yet.
 */
export function NewsletterCTA() {
  const { ref, isInView } = useInView(0.2);

  return (
    <section
      ref={ref}
      className="relative py-16 lg:py-20 bg-gradient-to-r from-purple-950 via-purple-900 to-teal-950 overflow-hidden"
    >
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "2rem 2rem",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 ${
            isInView ? "animate-fade-in" : "opacity-0"
          }`}
        >
          {/* Left — pitch */}
          <div className="max-w-lg">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal-400/60 mb-3">
              Stay connected
            </p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight mb-2">
              The US-RSE Newsletter
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Monthly updates on community events, job openings, working group
              activity, and the latest in research software engineering.
              Published since 2019 — 50+ issues and counting.
            </p>
          </div>

          {/* Right — action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href="https://us-rse.org/join"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 font-bold text-sm rounded-xl hover:bg-teal-50 transition-colors shadow-lg"
            >
              Subscribe to the Newsletter
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <Link
              to="/news"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Browse the archive
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
