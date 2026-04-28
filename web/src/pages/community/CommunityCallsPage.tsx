import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useInView } from "@/hooks/useInView";

export function CommunityCallsPage() {
  const { ref: scheduleRef, isInView: scheduleVisible } = useInView(0.1);
  const { ref: joinRef, isInView: joinVisible } = useInView(0.1);

  return (
    <CommunityLayout
      title="Community Calls"
      subtitle="Monthly virtual meetings to connect, share, and discuss topics that matter to the RSE community."
      prevPage={{
        path: "/community/affinity-groups",
        label: "Affinity Groups",
      }}
      nextPage={{
        path: "/community/awards",
        label: "Community Awards",
        teaser: "Recognizing outstanding contributions",
      }}
    >
      {/* Opening narrative */}
      <p className="text-xl text-neutral-700 leading-relaxed mb-16 max-w-2xl">
        Community calls are the heartbeat of US-RSE — a monthly chance to
        hear from invited speakers, discuss emerging topics, and connect with
        fellow RSEs in small-group breakout sessions.
      </p>

      {/* ── Schedule ──────────────────────────────────────────── */}
      <div ref={scheduleRef} className="mb-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8">
          Meeting Schedule
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Odd months */}
          <div
            className={`border-l-2 border-teal-300 pl-5 ${
              scheduleVisible ? "animate-slide-up" : "opacity-0"
            }`}
            style={{ animationDelay: "0ms" }}
          >
            <p className="font-mono text-xs text-teal-600 uppercase tracking-widest mb-2">
              Odd Months
            </p>
            <p className="text-lg font-bold text-neutral-900 mb-1">
              Second Thursday
            </p>
            <p className="text-neutral-500 text-sm">
              12:00 &ndash; 1:00 PM ET
            </p>
            <p className="text-neutral-400 text-xs mt-2">
              January, March, May, July, September, November
            </p>
          </div>

          {/* Even months */}
          <div
            className={`border-l-2 border-teal-300 pl-5 ${
              scheduleVisible ? "animate-slide-up" : "opacity-0"
            }`}
            style={{ animationDelay: "100ms" }}
          >
            <p className="font-mono text-xs text-teal-600 uppercase tracking-widest mb-2">
              Even Months
            </p>
            <p className="text-lg font-bold text-neutral-900 mb-1">
              Second Friday
            </p>
            <p className="text-neutral-500 text-sm">
              2:00 &ndash; 3:00 PM ET
            </p>
            <p className="text-neutral-400 text-xs mt-2">
              February, April, June, August, October, December
            </p>
          </div>
        </div>
      </div>

      {/* ── Topics ────────────────────────────────────────────── */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Topics &amp; Suggestions
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Call topics are driven by the community. Past sessions have covered
          everything from CI/CD best practices to navigating RSE career
          paths. Have an idea for a future topic?
        </p>
        <div className="border-l-2 border-neutral-200 pl-5 space-y-3 text-neutral-600">
          <p>
            Browse and submit topic ideas through the{" "}
            <strong>GitHub Issues list</strong> maintained by the working
            group
          </p>
          <p>
            Volunteer to present — community calls welcome speakers at every
            career stage
          </p>
          <p>
            Suggest discussion themes in the{" "}
            <strong>#wg-community-calls</strong> Slack channel
          </p>
        </div>
      </div>

      {/* ── How to Join ───────────────────────────────────────── */}
      <hr className="mb-16 border-neutral-100" />

      <div ref={joinRef} className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          How to Join
        </h2>

        <div className="space-y-6">
          {[
            {
              num: "01",
              title: "Slack",
              body: "Join the #wg-community-calls channel on the US-RSE Slack workspace to get meeting links and updates.",
            },
            {
              num: "02",
              title: "Email",
              body: "Reach the working group directly at wg-community-calls@us-rse.org for questions or speaker proposals.",
            },
            {
              num: "03",
              title: "Just show up",
              body: "All US-RSE members are welcome. No sign-up required — just join the call when it happens.",
            },
          ].map((item, i) => (
            <div
              key={item.num}
              className={`flex gap-5 ${
                joinVisible ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="font-mono text-sm text-teal-600 shrink-0 pt-0.5">
                {item.num}
              </span>
              <div>
                <h3 className="text-base font-bold text-neutral-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Co-chairs ─────────────────────────────────────────── */}
      <hr className="mb-12 border-neutral-100" />

      <div>
        <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest mb-4">
          Co-Chairs
        </p>
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="font-heading text-base font-semibold text-neutral-900">
              Julia Damerow
            </p>
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-neutral-900">
              Abbey Roelofs
            </p>
          </div>
        </div>
      </div>
    </CommunityLayout>
  );
}
