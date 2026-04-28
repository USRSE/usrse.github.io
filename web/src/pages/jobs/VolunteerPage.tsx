import { JobsLayout } from "@/components/jobs/JobsLayout";

const opportunities = [
  {
    number: "01",
    title: "Working Group Participation",
    desc: "Join any of the active working groups — no application required, just show up. Groups include Code Review, DEI, Testing, Education & Training, Mentorship, and more. Each group sets its own meeting cadence and welcomes new contributors at any time.",
  },
  {
    number: "02",
    title: "Conference Organizing",
    desc: "Help plan USRSE'26 and future conferences. Opportunities span proposal review, logistics coordination, program committee service, session moderation, and day-of support. Conference planning typically kicks off six to nine months before the event.",
  },
  {
    number: "03",
    title: "Mentorship",
    desc: "Mentor newer research software engineers through the US-RSE mentorship program, or share your expertise via community calls and lightning talks. Mentoring relationships are flexible — you set the pace and format that works for both parties.",
  },
  {
    number: "04",
    title: "Website & Infrastructure",
    desc: "Contribute to the US-RSE website, documentation, or community tools. The site is open source on GitHub and welcomes pull requests of all sizes — from typo fixes to new features. No approval required to get started.",
  },
  {
    number: "05",
    title: "Outreach & Advocacy",
    desc: "Help spread the word about RSE careers through writing, conference speaking, K-12 outreach, or social media. Advocacy work includes representing US-RSE at partner events, contributing to newsletters, and engaging with institutional leadership.",
  },
  {
    number: "06",
    title: "Event Support",
    desc: "Help organize community calls, affinity group meetups, or regional events. This ranges from scheduling and Zoom moderation to coordinating speakers and curating discussion topics. Great for people who prefer behind-the-scenes work.",
  },
];

export function VolunteerPage() {
  return (
    <JobsLayout
      title="Volunteer with US-RSE"
      subtitle="Contribute your skills to strengthen the research software engineering community."
      prevPage={{ path: "/jobs/submit", label: "Post a Job" }}
      nextPage={null}
    >
      {/* ── Intro ─────────────────────────────────────────────────── */}
      <section className="mb-16">
        <p className="text-neutral-600 leading-relaxed text-lg">
          US-RSE runs on volunteer effort. Every working group, conference, and community
          initiative is built by people who show up and contribute. Here are the ways you
          can get involved.
        </p>
      </section>

      {/* ── Opportunities ─────────────────────────────────────────── */}
      <section className="mb-16">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-8">
          Opportunities
        </p>
        <div className="space-y-12">
          {opportunities.map((opp) => (
            <div key={opp.number} className="flex gap-6">
              <span className="font-mono text-2xl font-bold text-neutral-200 leading-none shrink-0 w-10">
                {opp.number}
              </span>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">{opp.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{opp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Getting Started ───────────────────────────────────────── */}
      <section>
        <hr className="border-neutral-100 mb-10" />
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          Getting Started
        </p>
        <div className="border-l-2 border-neutral-200 pl-6 space-y-4">
          <p className="text-neutral-600 leading-relaxed">
            There is no formal application to volunteer. Start by joining the{" "}
            <a
              href="https://us-rse.org/join"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              US-RSE Slack workspace
            </a>{" "}
            and introducing yourself in <span className="font-mono text-sm text-neutral-500">#general</span>.
            From there, browse the working group channels, attend a community call, or reply to
            an open call for help. Most groups operate on a "show up and contribute" basis.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            Questions? Reach the community team at{" "}
            <a
              href="mailto:contact@us-rse.org"
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              contact@us-rse.org
            </a>.
          </p>
        </div>
      </section>
    </JobsLayout>
  );
}
