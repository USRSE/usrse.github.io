import { Hero } from "@/components/Hero";
import { LogoMarquee } from "@/components/LogoMarquee";
import { Mission } from "@/components/Mission";
import { Stats } from "@/components/Stats";
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
      <WorkingGroups />
      <Events />
      <Community />
      <JobBoard />
    </>
  );
}
