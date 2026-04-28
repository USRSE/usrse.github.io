import { ResourcesLayout } from "@/components/resources/ResourcesLayout";

export function MapPage() {
  return (
    <ResourcesLayout
      title="RSE Map"
      subtitle="An interactive map of the US-RSE community."
      prevPage={{ path: "/resources/organizations", label: "RSE Organizations" }}
      nextPage={null}
    >
      {/* ── Map Placeholder ───────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="border border-dashed border-neutral-200 bg-neutral-50/50 py-20 px-8 text-center">
          <div className="max-w-md mx-auto">
            <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-4">
              Coming Soon
            </p>
            <h2 className="font-display text-2xl font-bold text-neutral-900 mb-4">
              Interactive RSE Map
            </h2>
            <p className="text-neutral-500 leading-relaxed mb-6">
              An interactive map showing RSE community members, institutional groups, and
              organizational members across the United States. Explore geographic distribution,
              find collaborators, and discover RSE teams near you.
            </p>
            <hr className="border-neutral-200 mb-6 mx-auto max-w-[120px]" />
            <p className="text-sm text-neutral-400 leading-relaxed">
              This feature is being developed and will be integrated into the site soon.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section>
        <hr className="border-neutral-100 mb-10" />
        <p className="text-lg text-neutral-600 mb-2">
          Want to be notified when the map launches?
        </p>
        <p className="text-sm text-neutral-400 mb-4">
          Join the US-RSE mailing list for updates on new features and community resources.
        </p>
        <a
          href="https://us-rse.org/join"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
        >
          Join the mailing list
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </section>
    </ResourcesLayout>
  );
}
