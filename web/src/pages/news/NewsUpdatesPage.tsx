import { NewsLayout } from "@/components/news/NewsLayout";
import { useInView } from "@/hooks/useInView";

interface NewsPost {
  title: string;
  date: string;
  type: string;
  tags?: string[];
  description?: string;
}

const featuredPost: NewsPost = {
  title: "Re: The Proposed Dismantling of NCAR",
  date: "Dec 19, 2025",
  type: "Statement",
  tags: ["leadership", "steering committee", "executive director"],
  description:
    "A leadership statement responding to proposed structural changes at a major research institution.",
};

const posts: NewsPost[] = [
  {
    title: "USRSE'25 Conference Recap",
    date: "Oct 2025",
    type: "Announcement",
  },
  {
    title: "2025 Community Awards Announced",
    date: "Sep 2025",
    type: "Announcement",
  },
  {
    title: "US-RSE Surpasses 4,000 Members",
    date: "Apr 2026",
    type: "Milestone",
  },
  {
    title: "New Organizational Membership Program",
    date: "Mar 2025",
    type: "Announcement",
  },
];

export function NewsUpdatesPage() {
  const { ref: featuredRef, isInView: featuredInView } = useInView(0.1);
  const { ref: listRef, isInView: listInView } = useInView(0.1);

  return (
    <NewsLayout
      title="News & Updates"
      subtitle="Announcements, statements, and milestones from the US-RSE community."
      prevPage={{ path: "/news", label: "Newsletters" }}
      nextPage={{ path: "/news/leadership", label: "From Leadership", teaser: "Messages from the board and executive director" }}
    >
      {/* ── Featured post ────────────────────────────────────────── */}
      <section className="mb-16" ref={featuredRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          Featured
        </p>
        <div
          className={`flex flex-col md:flex-row gap-6 md:gap-10 ${
            featuredInView ? "animate-slide-up" : "opacity-0"
          }`}
        >
          {/* Date column */}
          <div className="md:w-32 shrink-0">
            <p className="font-mono text-lg text-neutral-300 leading-tight">
              Dec 19
            </p>
            <p className="font-mono text-sm text-neutral-300">2025</p>
          </div>

          {/* Content column */}
          <div className="flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-purple-500 mb-2">
              {featuredPost.type}
            </p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 leading-tight">
              {featuredPost.title}
            </h2>
            <p className="text-neutral-500 mt-3 leading-relaxed max-w-xl">
              {featuredPost.description}
            </p>
            {featuredPost.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {featuredPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 border border-neutral-200 px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors mt-4"
            >
              Read statement
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <hr className="border-neutral-100 mb-16" />

      {/* ── Post list ────────────────────────────────────────────── */}
      <section ref={listRef}>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-6">
          All Updates
        </p>
        <div>
          {posts.map((post, i) => (
            <div
              key={post.title}
              className={`flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 py-5 border-b border-neutral-100 last:border-0 ${
                listInView ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3 sm:w-40 shrink-0">
                <span className="font-mono text-sm text-neutral-400">{post.date}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                  {post.type}
                </span>
              </div>
              <span className="font-semibold text-neutral-800">{post.title}</span>
            </div>
          ))}
        </div>
      </section>
    </NewsLayout>
  );
}
