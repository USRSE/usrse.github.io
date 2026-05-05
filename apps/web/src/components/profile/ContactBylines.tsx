import type { CurrentMember } from "@/hooks/useCurrentMember";
import type { PublicMember } from "@/hooks/usePublicMember";

type MemberLike = CurrentMember | PublicMember;

export interface ContactLink {
  label: string;
  href: string;
  display: string;
}

export type ContactTone = "light" | "dark";

/**
 * Pulls contact links off a member profile in a stable order. Returns
 * an empty array when the member has no profile or no links — the
 * caller decides whether to render anything at all.
 */
export function buildContactLinks(member: MemberLike): ContactLink[] {
  const p = member.profile;
  if (!p) return [];
  const out: ContactLink[] = [];
  if (p.websiteUrl)
    out.push({
      label: "Website",
      href: p.websiteUrl,
      display: p.websiteUrl.replace(/^https?:\/\/(www\.)?/, ""),
    });
  if (p.githubUrl)
    out.push({
      label: "GitHub",
      href: p.githubUrl,
      display: p.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "@"),
    });
  if (p.linkedinUrl)
    out.push({
      label: "LinkedIn",
      href: p.linkedinUrl,
      display: p.linkedinUrl.replace(
        /^https?:\/\/(www\.)?linkedin\.com\//,
        "/"
      ),
    });
  if (p.orcid)
    out.push({
      label: "ORCID",
      href: `https://orcid.org/${p.orcid}`,
      display: p.orcid,
    });
  return out;
}

// Two literal class string blocks so Tailwind's JIT picks both up.
// Templating tone-specific colors via interpolation breaks the
// purger; this is the boring-and-correct way.
const CHIP_STYLES: Record<
  ContactTone,
  {
    wrapper: string;
    label: string;
    display: string;
    arrow: string;
    eyebrow: string;
  }
> = {
  light: {
    wrapper:
      "group inline-flex items-baseline gap-2 px-3 py-1.5 rounded-full border border-neutral-200 hover:border-purple-400 transition-colors",
    label:
      "text-[10px] font-semibold uppercase tracking-wider text-purple-600 group-hover:text-purple-800 transition-colors",
    display:
      "font-mono text-xs text-neutral-600 group-hover:text-neutral-900 transition-colors break-all",
    arrow:
      "text-neutral-300 group-hover:text-teal-500 transition-colors text-xs",
    eyebrow:
      "font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 shrink-0",
  },
  dark: {
    wrapper:
      "group inline-flex items-baseline gap-2 px-3 py-1.5 rounded-full border border-white/15 hover:border-white/40 hover:bg-white/5 transition-colors",
    label:
      "text-[10px] font-semibold uppercase tracking-wider text-white/80 group-hover:text-white transition-colors",
    display:
      "font-mono text-xs text-white/60 group-hover:text-white/90 transition-colors break-all",
    arrow:
      "text-white/30 group-hover:text-teal-300 transition-colors text-xs",
    eyebrow:
      "font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 shrink-0",
  },
};

interface ContactBylinesProps {
  links: ContactLink[];
  displayName: string;
  tone?: ContactTone;
}

export function ContactBylines({
  links,
  displayName,
  tone = "light",
}: ContactBylinesProps) {
  const firstName = displayName.split(/\s+/)[0] || "this member";
  const styles = CHIP_STYLES[tone];

  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-6 gap-y-4 flex-wrap">
      <p className={styles.eyebrow}>Find {firstName} on</p>
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.wrapper}
            >
              <span className={styles.label}>{l.label}</span>
              <span className={styles.display}>{l.display}</span>
              <span aria-hidden="true" className={styles.arrow}>
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
