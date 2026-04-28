import { Link } from "react-router-dom";
import { NetworkCanvas } from "./NetworkCanvas";

export function Hero() {
  return (
    <section
      id="main-content"
      className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-purple-950 via-purple-700 to-purple-500"
    >
      {/* Network animation background */}
      <div className="absolute inset-0 opacity-60">
        <NetworkCanvas />
      </div>

      {/* Subtle grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-16">
          {/* Left — Text content */}
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse-soft" />
              <span className="text-xs font-medium text-white/80 tracking-wide uppercase">
                4,000+ Members Strong
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 animate-slide-up"
              style={{ animationDelay: "100ms" }}
            >
              <span className="text-teal-300">Great ideas</span>
              <br />
              <span className="text-white">deserve great</span>
              <br />
              <span className="text-white">software.</span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg lg:text-xl text-white/70 leading-relaxed max-w-xl mb-10 animate-slide-up"
              style={{ animationDelay: "250ms" }}
            >
              We are the United States Research Software Engineer Association — a
              community of people who make research software happen. We advocate,
              connect, and build the future of computational research.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-4 animate-slide-up"
              style={{ animationDelay: "400ms" }}
            >
              <a
                href="#join"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-400 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Join the Community
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <Link
                to="/about/what-is-an-rse"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                What is an RSE?
              </Link>
            </div>
          </div>

          {/* Right — Conference card */}
          <div
            className="shrink-0 animate-scale-in"
            style={{ animationDelay: "600ms" }}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full sm:w-72 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">
                Coming Soon
              </div>
              <h3 className="text-white font-heading font-bold text-lg mb-1">
                USRSE'26
              </h3>
              <p className="text-white/60 text-sm mb-3">
                October 19-21, 2026
                <br />
                San Jose, California
              </p>
              <a
                href="#conference"
                className="inline-flex items-center text-sm font-medium text-teal-300 hover:text-teal-200 transition-colors"
              >
                Learn more
                <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
