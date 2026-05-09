import { useMemo } from "react";
import { useInView } from "@/hooks/useInView";
import { IdentitySection } from "@/components/profile/IdentitySection";
import { AffiliationSection } from "@/components/profile/AffiliationSection";
import { CareerArcSection } from "@/components/profile/CareerArcSection";
import { CraftSection } from "@/components/profile/CraftSection";
import { CommunitySection } from "@/components/profile/CommunitySection";
import { OnStageSection } from "@/components/profile/OnStageSection";
import { RecognitionSection } from "@/components/profile/RecognitionSection";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileJourneyFooter } from "@/components/profile/ProfileJourneyFooter";
import { buildContactLinks } from "@/components/profile/ContactBylines";
import {
  ProfileSidebar,
  type SidebarSection,
} from "@/components/profile/ProfileSidebar";
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

export function ProfileView({
  member,
  isOwner,
  onMemberUpdated,
}: ProfileViewProps) {
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
        organizationName={profile?.organizationName ?? null}
        publicLocation={profile?.publicLocation ?? null}
        joinedIso={member.createdAt}
        isOwner={isOwner}
        badges={member.badges ?? []}
        contactLinks={contactLinks}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <ProfileSidebar sections={SIDEBAR_SECTIONS} />
          <div className="flex-1 min-w-0">
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
          <AffiliationSection
            member={isCurrentMember(member) ? member : asCurrentMemberShim(member)}
            isOwner={isOwner}
            jobTitle={profile?.jobTitle ?? null}
            careerStageLabel={profile?.careerStageLabel ?? null}
            publicLocation={profile?.publicLocation ?? null}
            countryName={profile?.countryName ?? null}
            onMemberUpdated={(next) => onMemberUpdated?.(next)}
          />
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
            languages={member.languages ?? []}
            certifications={member.certifications ?? []}
            isOwner={isOwner}
            onMemberUpdated={onMemberUpdated}
          />
        </RevealOnView>

        {/* ── 06 · COMMUNITY ────────────────────────────────────── */}
        <RevealOnView>
          <CommunitySection conferences={member.conferences ?? []} />
        </RevealOnView>

        {/* ── 07 · ON STAGE ─────────────────────────────────────── */}
        <RevealOnView>
          <OnStageSection works={member.works ?? []} />
        </RevealOnView>

          </div>
        </div>
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

// Sidebar section list. Recognition keeps its own anchor id
// ("recognition") because ProfileHero links to #recognition; the
// rest fall through to SectionFrame's default `section-${number}`.
// Account settings live at /account, not in the dossier.
const SIDEBAR_SECTIONS: SidebarSection[] = [
  { id: "section-01", number: "01", label: "Identity" },
  { id: "section-02", number: "02", label: "Affiliation" },
  { id: "section-03", number: "03", label: "Career Arc" },
  { id: "recognition", number: "04", label: "Recognition" },
  { id: "section-05", number: "05", label: "Craft" },
  { id: "section-06", number: "06", label: "Community" },
  { id: "section-07", number: "07", label: "On Stage" },
];

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
