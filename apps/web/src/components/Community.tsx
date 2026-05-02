import { Link } from "react-router-dom";
import { useInView } from "@/hooks/useInView";

const testimonials = [
  {
    quote:
      "US-RSE gave me a professional identity I didn't know I was missing. I went from 'that person who writes code for the lab' to a recognized Research Software Engineer.",
    name: "Sarah Chen",
    role: "RSE, National Lab",
    initial: "S",
  },
  {
    quote:
      "The mentorship program connected me with experienced RSEs who helped me navigate the unique challenges of building software in an academic environment.",
    name: "Marcus Johnson",
    role: "Sr. RSE, University Research Computing",
    initial: "M",
  },
  {
    quote:
      "Through working groups, I've contributed to best practices that are now used across dozens of institutions. That kind of collective impact is only possible through community.",
    name: "Priya Patel",
    role: "Lead RSE, Climate Research Group",
    initial: "P",
  },
];

export function Community() {
  const { ref, isInView } = useInView(0.1);

  return (
    <section className="py-24 lg:py-32 bg-white overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 mb-3">
            Community Voices
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4 text-balance">
            Hear from our members
          </h2>
          <p className="text-lg text-neutral-500">
            The people building the software behind scientific breakthroughs.
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <blockquote
              key={t.name}
              className={`relative p-8 rounded-2xl bg-neutral-50 border border-neutral-100 ${
                isInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Quote mark */}
              <svg
                className="absolute top-6 left-6 w-8 h-8 text-teal-200"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
              </svg>

              <p className="relative text-neutral-600 leading-relaxed mb-6 pt-8">
                "{t.quote}"
              </p>

              <footer className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.initial}
                </div>
                <div>
                  <div className="font-semibold text-sm text-neutral-900">
                    {t.name}
                  </div>
                  <div className="text-xs text-neutral-400">{t.role}</div>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>

        {/* Join CTA */}
        <div
          className={`mt-20 border-t border-neutral-100 pt-12 ${isInView ? "animate-slide-up" : "opacity-0"}`}
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                Ready to join?
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                Membership is free and open to anyone supporting the RSE mission.
              </p>
            </div>
            <Link
              to="/sign-up"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors"
            >
              Become a Member
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
