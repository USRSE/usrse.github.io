import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";

const platinumSponsors = [
  "University of Illinois Urbana-Champaign",
  "Princeton University",
  "SHI",
  "Dell Technologies",
  "Schmidt Sciences",
];

const goldSponsors = [
  "Globus",
  "Los Alamos National Laboratory",
  "IBM",
  "HPE / AMD",
];

const travelSupportSponsors = [
  "Sustainable Horizons Institute",
  "Schmidt Sciences",
];

export function SponsorsPage() {
  return (
    <AboutLayout
      title="Sponsors"
      subtitle="The organizations and individuals who make our mission possible."
      prevPage={{ path: "/about/code-of-conduct", label: "Code of Conduct" }}
      nextPage={{
        path: "/about/staff",
        label: "Staff",
        teaser: "The team behind the community",
      }}
    >
      {/* ── Primary Funder ──────────────────────────────────────── */}
      <section className="mb-20">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-3">
          Primary Grant Funding
        </p>
        <h2 className="font-display text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
          Alfred P. Sloan Foundation
        </h2>
        <p className="text-neutral-500 leading-relaxed max-w-2xl">
          The Alfred P. Sloan Foundation has been the primary funder of US-RSE,
          providing the grant support that has enabled the organization to grow
          from a grassroots initiative into a thriving professional community
          with dedicated staff, annual conferences, and sustained programs.
        </p>
      </section>

      {/* ── Conference Sponsors ─────────────────────────────────── */}
      <section className="mb-20">
        <div className="flex items-baseline gap-3 mb-10">
          <h2 className="text-2xl font-bold text-neutral-900">
            Conference Sponsors
          </h2>
          <span className="font-mono text-sm text-purple-500">USRSE'25</span>
        </div>

        {/* Platinum tier */}
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-4">
            Platinum
          </p>
          <div className="space-y-1.5">
            {platinumSponsors.map((name) => (
              <p
                key={name}
                className="font-display text-2xl lg:text-3xl font-bold text-neutral-800 leading-tight"
              >
                {name}
              </p>
            ))}
          </div>
        </div>

        {/* Gold tier */}
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-4">
            Gold
          </p>
          <div className="space-y-1">
            {goldSponsors.map((name) => (
              <p
                key={name}
                className="font-heading text-lg lg:text-xl font-semibold text-neutral-700 leading-snug"
              >
                {name}
              </p>
            ))}
          </div>
        </div>

        {/* Travel Support */}
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-4">
            Travel Support
          </p>
          <div className="space-y-1">
            {travelSupportSponsors.map((name) => (
              <p
                key={name}
                className="text-base font-medium text-neutral-600 leading-snug"
              >
                {name}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── Individual Sponsors ─────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">
          Individual Sponsors
        </h2>
        <p className="text-neutral-500 leading-relaxed">
          We gratefully acknowledge the many individuals who have contributed
          personal donations to support US-RSE's programs, events, and community
          infrastructure. Every contribution, regardless of size, strengthens the
          RSE movement.
        </p>
      </section>

      {/* ── Fiscal Sponsorship ──────────────────────────────────── */}
      <section className="mb-16">
        <div className="py-6 border-t border-b border-neutral-200">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-2">
            Fiscal Sponsor
          </p>
          <p className="font-heading text-lg font-bold text-neutral-900">
            Community Initiatives
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            US-RSE operates as a fiscally sponsored project of Community
            Initiatives, a 501(c)(3) nonprofit organization. This structure
            allows tax-deductible donations and provides organizational
            governance.
          </p>
        </div>
      </section>

      {/* ── Support CTA ─────────────────────────────────────────── */}
      <section>
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
          Support US-RSE
        </h2>
        <p className="text-neutral-500 leading-relaxed mb-6 max-w-xl">
          Your support helps sustain the community, fund conferences, and
          advance the recognition of research software engineering as a
          profession.
        </p>
        <Link
          to="/#join"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-700 text-white text-sm font-semibold rounded-lg hover:bg-purple-800 transition-colors"
        >
          Make a Contribution
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>
    </AboutLayout>
  );
}
