import { Hero } from "@/components/Hero";
import { LogoMarquee } from "@/components/LogoMarquee";
import { Mission } from "@/components/Mission";
import { Stats } from "@/components/Stats";
import { CommunityMap } from "@/components/CommunityMap";
import { PhotoStrip } from "@/components/PhotoPlaceholder";
import { WorkingGroups } from "@/components/WorkingGroups";
import { Events } from "@/components/Events";
import { Community } from "@/components/Community";
import { JobBoard } from "@/components/JobBoard";

export function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <Mission />
      <Stats />
      <CommunityMap />

      {/* Community in action — photo strip */}
      <PhotoStrip
        photos={[
          { label: "Conference keynote", span: "wide" },
          { label: "Workshop session" },
          { label: "Networking break" },
          { label: "Panel discussion", span: "wide" },
          { label: "Poster session" },
          { label: "Group photo" },
        ]}
      />

      <WorkingGroups />
      <Events />
      <Community />
      <JobBoard />
    </>
  );
}
