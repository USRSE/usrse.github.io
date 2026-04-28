import { AboutLayout } from "@/components/about/AboutLayout";

export function StaffPage() {
  return (
    <AboutLayout
      title="Staff"
      subtitle="The dedicated team powering US-RSE's day-to-day operations."
      prevPage={{ path: "/about/sponsors", label: "Sponsors" }}
      nextPage={{
        path: "/about/financial-status",
        label: "Financial Status",
        teaser: "How US-RSE is funded and sustained",
      }}
    >
      {/* ── Sandra Gesing — Editorial Profile ──────────────────── */}
      <section className="mb-16">
        {/* Portrait + Name: asymmetric layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 mb-12">
          {/* Photo */}
          <div className="lg:w-72 shrink-0">
            <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-neutral-100">
              <img
                src="/images/board-of-directors/sandra-gesing.jpeg"
                alt="Sandra Gesing"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Name block */}
          <div className="flex-1 lg:pt-8">
            <p className="font-mono text-xs uppercase tracking-wider text-teal-600 mb-3">
              Executive Director
            </p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-none mb-4">
              Sandra Gesing
            </h2>

            {/* Contact links */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-8">
              <a
                href="mailto:sandra@us-rse.org"
                className="text-purple-600 hover:text-purple-800 transition-colors font-medium"
              >
                sandra@us-rse.org
              </a>
              <a
                href="https://www.linkedin.com/in/sandragesing/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://sandra-gesing.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                sandra-gesing.com
              </a>
            </div>

            <p className="text-neutral-600 leading-relaxed">
              Sandra Gesing brings more than 17 years of experience across
              research software engineering, academic research, and industry
              leadership. Her career spans systems development, programming group
              management, and administrative roles in industry before pivoting to
              academia, where she earned her PhD in bioinformatics.
            </p>
          </div>
        </div>

        {/* Editorial narrative */}
        <div className="space-y-5 mb-14">
          <p className="text-neutral-600 leading-relaxed">
            Sandra joined US-RSE in its earliest days, when the community
            numbered roughly 20 members. Under her leadership as Executive
            Director, the organization has grown into one of the most active RSE
            communities in the world, now exceeding 4,000 members as of 2026.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            She has been instrumental in securing grant funding from the Alfred
            P. Sloan Foundation and Schmidt Sciences, launching the annual
            US-RSE Conference with 280+ participants, establishing an
            organizational membership program, and building K-12 outreach
            efforts that have reached more than 900 students across 46
            classrooms.
          </p>
        </div>

        {/* Key stats — typographic callouts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6 py-8 border-t border-b border-neutral-200">
          <div>
            <p className="font-display text-3xl lg:text-4xl font-bold text-neutral-900">
              ~20
            </p>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              members in 2018
            </p>
          </div>
          <div>
            <p className="font-display text-3xl lg:text-4xl font-bold text-neutral-900">
              4,000+
            </p>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              members in 2025
            </p>
          </div>
          <div>
            <p className="font-display text-3xl lg:text-4xl font-bold text-neutral-900">
              280+
            </p>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              conference participants
            </p>
          </div>
          <div>
            <p className="font-display text-3xl lg:text-4xl font-bold text-neutral-900">
              900+
            </p>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              K-12 students reached
            </p>
          </div>
        </div>
      </section>
    </AboutLayout>
  );
}
