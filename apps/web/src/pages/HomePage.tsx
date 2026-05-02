import { Hero } from "@/components/Hero";
import { LogoMarquee } from "@/components/LogoMarquee";
import { Mission } from "@/components/Mission";
import { WhatIsRSE } from "@/components/WhatIsRSE";
import { Stats } from "@/components/Stats";
import { CommunityMap } from "@/components/CommunityMap";
import { PhotoStrip } from "@/components/PhotoPlaceholder";
import { WorkingGroups } from "@/components/WorkingGroups";
import { JobBoard } from "@/components/JobBoard";
import { Events } from "@/components/Events";
import { NewsletterCTA } from "@/components/NewsletterCTA";
import { Community } from "@/components/Community";

export function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <Mission />
      <WhatIsRSE />
      <Stats />
      <CommunityMap />

      {/* Community in action — swap these with real conference photos */}
      <PhotoStrip
        photos={[
          { label: "USRSE'25 keynote speaker", span: "wide" },
          { label: "Workshop hands-on session" },
          { label: "Hallway networking" },
          { label: "Panel discussion at USRSE'24", span: "wide" },
          { label: "Poster session" },
          { label: "USRSE'25 group photo" },
        ]}
      />

      <WorkingGroups />
      <JobBoard />
      <Events />
      <NewsletterCTA />
      <Community />
    </>
  );
}
