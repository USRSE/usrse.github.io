import { Link } from "react-router-dom";
import { AboutLayout } from "@/components/about/AboutLayout";

export function GovernancePage() {
  return (
    <AboutLayout
      title="Governance"
      subtitle="How US-RSE is organized, led, and sustained as a community."
      prevPage={{ path: "/about/dei", label: "DEI Statement" }}
      nextPage={{
        path: "/about/board",
        label: "Board of Directors",
        teaser: "Meet the elected leadership",
      }}
    >
      {/* Overview */}
      <div className="mb-14">
        <p className="text-neutral-600 leading-relaxed mb-4">
          US-RSE is governed by an elected Board of Directors that sets the
          strategic direction of the organization, manages community resources,
          and represents the interests of the membership. The organization
          operates as a fiscally sponsored project of Community Initiatives, a
          501(c)(3) nonprofit organization.
        </p>
        <p className="text-neutral-600 leading-relaxed">
          All governance documents are publicly accessible and open to
          community contribution through our GitHub repository. Transparency is
          a core value — board meeting minutes are published regularly.
        </p>
      </div>

      {/* ── How We're Organized ────────────────────────────────────── */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          How We're Organized
        </h2>

        <div className="relative">
          {/* Vertical connector — centered through dots */}
          <div className="absolute left-[9px] lg:left-[10px] top-5 bottom-5 w-px bg-neutral-200" />

          {/* Community Initiatives */}
          <div className="relative pb-10 lg:pb-12 pl-[30px] lg:pl-8">
            <div className="absolute left-0 top-2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border-2 border-neutral-300 bg-white z-10" />
            <p className="text-xs lg:text-sm font-mono uppercase tracking-wider text-neutral-400">Fiscal sponsor</p>
            <p className="text-base lg:text-lg font-semibold text-neutral-600 mt-1">Community Initiatives</p>
            <p className="text-sm text-neutral-400 mt-0.5">501(c)(3) nonprofit organization</p>
          </div>

          {/* Board of Directors */}
          <div className="relative pb-10 lg:pb-12 pl-[30px] lg:pl-8">
            <div className="absolute left-0 top-2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border-2 border-purple-500 bg-purple-500 z-10" />
            <p className="text-xs lg:text-sm font-mono uppercase tracking-wider text-purple-500">Elected leadership</p>
            <p className="text-lg lg:text-xl font-bold text-neutral-900 mt-1">Board of Directors</p>
            <p className="text-sm text-neutral-400 mt-0.5">9 members serving staggered terms, elected annually by the membership</p>
            <Link
              to="/about/board"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors mt-2"
            >
              Meet the board
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Staff */}
          <div className="relative pb-10 lg:pb-12 pl-[30px] lg:pl-8">
            <div className="absolute left-0 top-2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border-2 border-teal-500 bg-teal-500 z-10" />
            <p className="text-xs lg:text-sm font-mono uppercase tracking-wider text-teal-600">Operations</p>
            <p className="text-lg lg:text-xl font-bold text-neutral-900 mt-1">Staff</p>
            <p className="text-sm text-neutral-400 mt-0.5">Dedicated team supporting day-to-day community operations and programs</p>
            <Link
              to="/about/staff"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors mt-2"
            >
              Meet the staff
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Working Groups + Affinity Groups — same level */}
          <div className="relative pl-[30px] lg:pl-8">
            <div className="absolute left-0 top-2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border-2 border-neutral-300 bg-white z-10" />
            <p className="text-xs lg:text-sm font-mono uppercase tracking-wider text-neutral-400">Community-led</p>

            <div className="mt-1 space-y-5">
              <div>
                <p className="text-lg lg:text-xl font-bold text-neutral-900">Working Groups</p>
                <p className="text-sm text-neutral-400 mt-0.5">Code review, DEI, mentorship, testing, education, outreach, and more</p>
              </div>

              <div>
                <p className="text-lg lg:text-xl font-bold text-neutral-900">Affinity Groups</p>
                <p className="text-sm text-neutral-400 mt-0.5">RSE Group Leaders' Network, Neuro-RSE, R-RSE, Institutional RSE Networking</p>

                {/* Regional Groups — sub-branch */}
                <div className="relative mt-4 ml-2 pl-7 lg:pl-8 border-l border-neutral-200">
                  <div className="absolute left-[-5px] top-0 w-[10px] h-[10px] lg:w-3 lg:h-3 rounded-full border-2 border-neutral-300 bg-white" />
                  <p className="text-[11px] lg:text-xs font-mono uppercase tracking-wider text-neutral-400">Regional chapters</p>
                  <p className="text-base lg:text-lg font-semibold text-neutral-900 mt-0.5">Regional Groups</p>
                  <p className="text-sm text-neutral-400 mt-0.5">DMV-RSE, North Carolina, St. Louis Metro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fiscal sponsorship */}
      <div className="border-t border-neutral-100 pt-10">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Fiscal Sponsorship
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-4">
          US-RSE is a fiscally sponsored project of Community Initiatives, a
          501(c)(3) nonprofit organization. This structure provides the
          organizational and financial framework needed to accept donations,
          manage funds, and operate as a recognized nonprofit entity without
          requiring independent incorporation.
        </p>
        <Link
          to="/about/financial-status"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
        >
          View financial status
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </AboutLayout>
  );
}
