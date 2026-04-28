import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";

export function FinancialStatusPage() {
  return (
    <AboutLayout
      title="Financial Status"
      subtitle="Transparency in how US-RSE is funded, governed financially, and sustained."
      prevPage={{ path: "/about/staff", label: "Staff" }}
      nextPage={null}
    >
      {/* ── Fiscal Structure ────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Fiscal Structure
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          US-RSE operates as a fiscally sponsored project of Community
          Initiatives, a 501(c)(3) nonprofit organization based in California.
          This structure provides the organizational and financial framework for
          US-RSE to accept tax-deductible donations, manage funds, and operate
          as a recognized nonprofit entity without requiring independent
          incorporation.
        </p>
        <div className="flex gap-5 lg:gap-8">
          <div className="shrink-0 pt-1">
            <span className="font-mono text-xs text-teal-600">501(c)(3)</span>
          </div>
          <p className="text-sm text-neutral-500 leading-relaxed">
            All donations to US-RSE are tax-deductible to the extent permitted
            by law. Community Initiatives provides fiduciary oversight,
            accounting, and compliance management.
          </p>
        </div>
      </section>

      {/* ── Funding Sources ─────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Funding Sources
        </h2>
        <p className="text-neutral-500 mb-8">
          US-RSE is sustained through a combination of grants, sponsorships,
          and individual contributions.
        </p>

        <div className="space-y-0">
          {[
            {
              num: "01",
              label: "Grant Funding",
              accent: "text-purple-500",
              body: "The Alfred P. Sloan Foundation has been the primary funder of US-RSE, providing the grant support that enabled the organization to hire staff, launch annual conferences, and build sustainable programs.",
            },
            {
              num: "02",
              label: "Conference Sponsorships",
              accent: "text-purple-500",
              body: "Annual conference sponsors at Platinum, Gold, and Travel Support tiers fund the USRSE conference series, making it accessible to the broadest possible audience.",
            },
            {
              num: "03",
              label: "Organizational Memberships",
              accent: "text-teal-600",
              body: "Premier, Standard, and Basic tier organizational memberships from universities, national labs, and industry partners provide sustaining revenue for community programs.",
            },
            {
              num: "04",
              label: "Individual Donations",
              accent: "text-teal-600",
              body: "Community members contribute personal donations of all sizes. Every contribution directly supports the RSE mission — events, resources, outreach, and advocacy.",
            },
          ].map((source, i) => (
            <div
              key={source.num}
              className={`flex gap-5 lg:gap-8 py-7 ${
                i < 3 ? "border-b border-neutral-100" : ""
              }`}
            >
              <span className={`font-mono text-sm ${source.accent} shrink-0 pt-0.5`}>
                {source.num}
              </span>
              <div>
                <h3 className="font-bold text-neutral-900 mb-1">
                  {source.label}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {source.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How Funds Are Used ──────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          How Funds Are Used
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          US-RSE directs its resources toward programs that directly serve the
          community:
        </p>

        <div className="border-l-2 border-teal-200 pl-5 space-y-3 text-neutral-600">
          <p>Staff salaries and operations (Executive Director, Community Manager)</p>
          <p>Annual conference planning, venue, and accessibility support</p>
          <p>Travel grants for conference attendees and community participants</p>
          <p>K-12 and educational outreach programs</p>
          <p>Community infrastructure (website, Slack, event tooling)</p>
          <p>Working group and affinity group support</p>
        </div>
      </section>

      {/* ── Transparency ────────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Transparency
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Financial transparency is a core organizational value. The Board of
          Directors oversees all financial decisions, and meeting minutes —
          including budget discussions — are published regularly.
        </p>
        <p className="text-neutral-600 leading-relaxed">
          As a fiscally sponsored project, US-RSE's finances are subject to
          Community Initiatives' annual audits and IRS reporting requirements.
          Members with questions about finances are encouraged to contact the
          Board directly.
        </p>
      </section>

      {/* ── Support CTA ─────────────────────────────────────────────── */}
      <div className="border-t border-neutral-100 pt-10">
        <h3 className="text-lg font-bold text-neutral-900 mb-2">
          Support the Mission
        </h3>
        <p className="text-neutral-600 mb-5">
          Contributions of any size help sustain US-RSE's programs and
          community. All donations are tax-deductible.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="#donate"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 text-white text-sm font-bold rounded-xl hover:bg-purple-800 transition-colors"
          >
            Make a Donation
          </a>
          <Link
            to="/about/sponsors"
            className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors py-2.5"
          >
            View our sponsors
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </AboutLayout>
  );
}
