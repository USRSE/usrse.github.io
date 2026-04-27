import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Mission } from "@/components/Mission";
import { Stats } from "@/components/Stats";
import { WorkingGroups } from "@/components/WorkingGroups";
import { Events } from "@/components/Events";
import { Community } from "@/components/Community";
import { JobBoard } from "@/components/JobBoard";
import { Footer } from "@/components/Footer";

export function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Mission />
        <Stats />
        <WorkingGroups />
        <Events />
        <Community />
        <JobBoard />
      </main>
      <Footer />
    </div>
  );
}
