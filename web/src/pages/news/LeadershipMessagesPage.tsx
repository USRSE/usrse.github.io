import { NewsLayout } from "@/components/news/NewsLayout";
import { useInView } from "@/hooks/useInView";

interface LeadershipMessage {
  title: string;
  date: string;
  author: string;
  type: "Statement" | "Letter";
  description: string;
}

const messages: LeadershipMessage[] = [
  {
    title: "Re: The Proposed Dismantling of NCAR",
    date: "Dec 19, 2025",
    author: "Steering Committee & Executive Director",
    type: "Statement",
    description:
      "A public statement on the proposed dismantling of a critical research institution.",
  },
  {
    title: "Message from the Executive Director",
    date: "Dec 15, 2025",
    author: "Sandra Gesing",
    type: "Letter",
    description:
      "Year-end reflection on community growth, achievements, and vision.",
  },
  {
    title: "Message from the Executive Director",
    date: "Dec 1, 2024",
    author: "Sandra Gesing",
    type: "Letter",
    description:
      "Reflecting on 2024 accomplishments and community milestones.",
  },
  {
    title: "Message from the Executive Director",
    date: "Oct 1, 2023",
    author: "Sandra Gesing",
    type: "Letter",
    description:
      "Mid-year update on organizational initiatives.",
  },
];

export function LeadershipMessagesPage() {
  const { ref: messagesRef, isInView: messagesInView } = useInView(0.1);

  return (
    <NewsLayout
      title="From Leadership"
      subtitle="Messages from the Board of Directors and Executive Director."
      prevPage={{ path: "/news/updates", label: "News & Updates" }}
      nextPage={null}
    >
      {/* ── Messages ─────────────────────────────────────────────── */}
      <section ref={messagesRef}>
        <div className="space-y-16">
          {messages.map((msg, i) => (
            <article
              key={`${msg.title}-${msg.date}`}
              className={`${messagesInView ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Date + type */}
              <div className="flex items-center gap-4 mb-3">
                <span className="font-mono text-sm text-neutral-400">{msg.date}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-purple-500">
                  {msg.type}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-display text-xl lg:text-2xl font-bold text-neutral-900 leading-tight">
                {msg.title}
              </h2>

              {/* Author */}
              <p className="text-sm text-neutral-500 mt-1">{msg.author}</p>

              {/* Description */}
              <p className="text-neutral-500 mt-3 leading-relaxed max-w-xl border-l-2 border-neutral-200 pl-4">
                {msg.description}
              </p>

              {/* Read link */}
              <a
                href="#"
                className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors mt-4"
              >
                Read full {msg.type === "Statement" ? "statement" : "letter"}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>

              {/* Separator between entries (not after last) */}
              {i < messages.length - 1 && (
                <hr className="border-neutral-100 mt-16" />
              )}
            </article>
          ))}
        </div>
      </section>
    </NewsLayout>
  );
}
