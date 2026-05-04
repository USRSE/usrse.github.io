import { useMemo } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { useInView } from "@/hooks/useInView";
import { IdentitySection } from "@/components/profile/IdentitySection";
import { CareerArcSection } from "@/components/profile/CareerArcSection";
import { CraftSection } from "@/components/profile/CraftSection";
import { CommunitySection } from "@/components/profile/CommunitySection";
import { OnStageSection } from "@/components/profile/OnStageSection";
import { RecognitionSection } from "@/components/profile/RecognitionSection";
import {
  SectionFrame,
  NotYetWritten,
} from "@/components/profile/SectionFrame";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileJourneyFooter } from "@/components/profile/ProfileJourneyFooter";
import type { CurrentMember } from "@/hooks/useCurrentMember";
import type { PublicMember } from "@/hooks/usePublicMember";

type ProfileMember = CurrentMember | PublicMember;

interface ProfileViewProps {
  member: ProfileMember;
  isOwner: boolean;
  onMemberUpdated?: (next: CurrentMember) => void;
}

function initialsFor(displayName: string | undefined, fallback: string) {
  const source = (displayName || fallback || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function isCurrentMember(m: ProfileMember): m is CurrentMember {
  return "email" in m;
}

interface ContactLink {
  label: string;
  href: string;
  display: string;
}

function buildContactLinks(member: ProfileMember): ContactLink[] {
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

export function ProfileView({
  member,
  isOwner,
  onMemberUpdated,
}: ProfileViewProps) {
  const { ref: footRef, isInView: footInView } = useInView(0.05);

  const profile = member.profile;
  const fallback = isCurrentMember(member) ? member.email : member.memberId;
  const displayName =
    profile?.displayName ??
    (isCurrentMember(member) ? member.email.split("@")[0] : "Member");
  const initials = initialsFor(profile?.displayName, fallback);
  const contactLinks = useMemo(() => buildContactLinks(member), [member]);
  const slug = profile?.slug ?? null;

  return (
    <article className="bg-white">
      <ProfileHero
        displayName={displayName}
        memberId={member.memberId}
        slug={slug}
        role={member.role}
        jobTitle={profile?.jobTitle ?? null}
        institutionName={profile?.institutionName ?? null}
        publicLocation={profile?.publicLocation ?? null}
        joinedIso={member.createdAt}
        isOwner={isOwner}
        badges={member.badges ?? []}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        {/* ── 01 · IDENTITY ─────────────────────────────────────── */}
        <RevealOnView>
          <IdentitySection
            member={isCurrentMember(member) ? member : asCurrentMemberShim(member)}
            isOwner={isOwner}
            initials={initials}
            onSaved={(next) => onMemberUpdated?.(next)}
          />
        </RevealOnView>

        {/* ── 02 · AFFILIATION ──────────────────────────────────── */}
        <RevealOnView>
          <SectionFrame
            number="02"
            eyebrow="Affiliation"
            accent="teal"
            action={isOwner ? <EditStub /> : null}
          >
            <Affiliation
              jobTitle={profile?.jobTitle ?? null}
              institutionName={profile?.institutionName ?? null}
              careerStageLabel={profile?.careerStageLabel ?? null}
              location={profile?.publicLocation ?? null}
              countryName={profile?.countryName ?? null}
              disciplines={member.disciplines ?? []}
            />
          </SectionFrame>
        </RevealOnView>

        {/* ── 03 · CAREER ARC ───────────────────────────────────── */}
        <RevealOnView>
          <CareerArcSection
            experiences={member.experiences ?? []}
            education={member.education ?? []}
            certifications={member.certifications ?? []}
            isOwner={isOwner}
          />
        </RevealOnView>

        {/* ── 04 · RECOGNITION ──────────────────────────────────── */}
        <RevealOnView>
          <RecognitionSection
            badges={member.badges ?? []}
            isOwner={isOwner}
          />
        </RevealOnView>

        {/* ── 05 · CRAFT ────────────────────────────────────────── */}
        <RevealOnView>
          <CraftSection
            skills={member.skills ?? []}
            disciplines={member.disciplines ?? []}
            certifications={member.certifications ?? []}
            isOwner={isOwner}
          />
        </RevealOnView>

        {/* ── 06 · COMMUNITY ────────────────────────────────────── */}
        <RevealOnView>
          <CommunitySection conferences={member.conferences ?? []} />
        </RevealOnView>

        {/* ── 07 · ON STAGE ─────────────────────────────────────── */}
        <RevealOnView>
          <OnStageSection isOwner={isOwner} />
        </RevealOnView>

        {/* ── 08 · CONNECT ──────────────────────────────────────── */}
        <RevealOnView>
          <SectionFrame
            number="08"
            eyebrow="Connect"
            accent="purple"
            action={isOwner ? <EditStub /> : null}
          >
            {contactLinks.length > 0 ? (
              <ContactBylines links={contactLinks} displayName={displayName} />
            ) : (
              <NotYetWritten message="external links not yet added" />
            )}
          </SectionFrame>
        </RevealOnView>

        {/* ── 09 · ACCOUNT (owner only) ─────────────────────────── */}
        {isOwner && isCurrentMember(member) && (
          <div
            ref={footRef}
            className={`mt-16 pt-12 border-t border-neutral-200 ${
              footInView ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <AccountFooter member={member} />
          </div>
        )}
      </div>

      <ProfileJourneyFooter isOwner={isOwner} hasProfile={!!profile} />
    </article>
  );
}

function RevealOnView({ children }: { children: React.ReactNode }) {
  const { ref, isInView } = useInView(0.05);
  return (
    <div
      ref={ref}
      className={isInView ? "animate-slide-up" : "opacity-0"}
      style={{ animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

function EditStub() {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300">
      ✎ soon
    </span>
  );
}

function Affiliation({
  jobTitle,
  institutionName,
  careerStageLabel,
  location,
  countryName,
  disciplines,
}: {
  jobTitle: string | null;
  institutionName: string | null;
  careerStageLabel: string | null;
  location: string | null;
  countryName: string | null;
  disciplines: { name: string }[];
}) {
  if (!jobTitle && !location && !institutionName && disciplines.length === 0) {
    return (
      <NotYetWritten message="institution, discipline, and field will live here" />
    );
  }
  const placeLine = [location, countryName].filter(Boolean).join(" · ");
  return (
    <div className="space-y-10">
      {/* Three pillars — gap-px gradient seam, no per-cell shadow.
          Mirrors MissionPage's "gap-px bg-neutral-200" pillar pattern. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gradient-to-r from-purple-200 via-neutral-200 to-teal-200 rounded-3xl overflow-hidden">
        <Pillar
          label="Role"
          value={jobTitle}
          subValue={careerStageLabel}
          accent="purple"
        />
        <Pillar label="Institution" value={institutionName} accent="neutral" />
        <Pillar label="Based in" value={placeLine || null} accent="teal" />
      </div>

      {/* Disciplines — chip ribbon, no card */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-4">
          02.d · Disciplines
        </p>
        {disciplines.length === 0 ? (
          <NotYetWritten message="disciplines not yet tagged" />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {disciplines.map((d) => (
              <li
                key={d.name}
                className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:border-purple-300 hover:text-purple-700 transition-colors cursor-default"
              >
                {d.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Pillar({
  label,
  value,
  subValue,
  accent,
}: {
  label: string;
  value: string | null;
  subValue?: string | null;
  accent: "purple" | "teal" | "neutral";
}) {
  const accentBar = {
    purple: "bg-purple-500",
    teal: "bg-teal-500",
    neutral: "bg-neutral-300",
  }[accent];
  return (
    <article className="relative bg-white px-6 lg:px-7 py-7">
      <span
        aria-hidden="true"
        className={`absolute top-0 left-6 right-6 h-[3px] rounded-b-full ${accentBar}`}
      />
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mt-3 mb-3">
        {label}
      </p>
      {value ? (
        <p className="font-display text-xl lg:text-2xl font-semibold text-neutral-900 leading-tight tracking-tight text-balance">
          {value}
        </p>
      ) : (
        <p className="text-sm text-neutral-400 italic">not set</p>
      )}
      {subValue && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
          {subValue}
        </p>
      )}
    </article>
  );
}

function ContactBylines({
  links,
  displayName,
}: {
  links: ContactLink[];
  displayName: string;
}) {
  const firstName = displayName.split(/\s+/)[0] || "this member";
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-6 gap-y-4 flex-wrap">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 shrink-0">
        Find {firstName} on
      </p>
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-baseline gap-2 px-3 py-1.5 rounded-full border border-neutral-200 hover:border-purple-400 transition-colors"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 group-hover:text-purple-800 transition-colors">
                {l.label}
              </span>
              <span className="font-mono text-xs text-neutral-600 group-hover:text-neutral-900 transition-colors break-all">
                {l.display}
              </span>
              <span
                aria-hidden="true"
                className="text-neutral-300 group-hover:text-teal-500 transition-colors text-xs"
              >
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AccountFooter({ member }: { member: CurrentMember }) {
  const { signOut } = useAuth();
  return (
    <SectionFrame number="09" eyebrow="Account" accent="neutral">
      <div className="bg-neutral-50 rounded-3xl px-6 lg:px-8 py-6 mb-6">
        <dl className="space-y-3">
          <FootRow label="Email" value={member.email} />
          <FootRow
            label="Marketing"
            value={member.marketingConsent ? "Opted in" : "Not subscribed"}
          />
          {member.isLegacyImport && (
            <FootRow label="Origin" value="Imported from legacy roster" />
          )}
        </dl>
      </div>
      <button
        onClick={() => signOut()}
        className="font-mono text-[11px] uppercase tracking-[0.25em] text-neutral-500 hover:text-purple-700 transition-colors"
      >
        ↩ sign out
      </button>
    </SectionFrame>
  );
}

function FootRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 self-center">
        {label}
      </dt>
      <dd className="col-span-2 text-sm text-neutral-800 break-all self-center">
        {value}
      </dd>
    </div>
  );
}

/**
 * Public profiles don't carry email/marketing/legacy-import fields. Pad
 * those out so the rest of the layout can be shape-agnostic.
 */
function asCurrentMemberShim(m: PublicMember): CurrentMember {
  return {
    ...m,
    email: "",
    marketingConsent: false,
    isLegacyImport: false,
  };
}
