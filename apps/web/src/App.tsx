import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HomePage } from "@/pages/HomePage";
import { MissionPage } from "@/pages/about/MissionPage";
import { WhatIsRSEPage } from "@/pages/about/WhatIsRSEPage";
import { DEIPage } from "@/pages/about/DEIPage";
import { GovernancePage } from "@/pages/about/GovernancePage";
import { BoardPage } from "@/pages/about/BoardPage";
import { ElectionsPage } from "@/pages/about/ElectionsPage";
import { CodeOfConductPage } from "@/pages/about/CodeOfConductPage";
import { SponsorsPage } from "@/pages/about/SponsorsPage";
import { StaffPage } from "@/pages/about/StaffPage";
import { FinancialStatusPage } from "@/pages/about/FinancialStatusPage";
import { WorkingGroupsPage } from "@/pages/community/WorkingGroupsPage";
import { AffinityGroupsPage } from "@/pages/community/AffinityGroupsPage";
import { CommunityCallsPage } from "@/pages/community/CommunityCallsPage";
import { CommunityAwardsPage } from "@/pages/community/CommunityAwardsPage";
import { CommunityFundsPage } from "@/pages/community/CommunityFundsPage";
import { UpcomingEventsPage } from "@/pages/events/UpcomingEventsPage";
import { CalendarPage } from "@/pages/events/CalendarPage";
import { ConferencePage } from "@/pages/events/ConferencePage";
import { BrowseJobsPage } from "@/pages/jobs/BrowseJobsPage";
import { SubmitJobPage } from "@/pages/jobs/SubmitJobPage";
import { VolunteerPage } from "@/pages/jobs/VolunteerPage";
import { NewslettersPage } from "@/pages/news/NewslettersPage";
import { NewsUpdatesPage } from "@/pages/news/NewsUpdatesPage";
import { LearnPage } from "@/pages/resources/LearnPage";
import { DirectoryPage } from "@/pages/resources/DirectoryPage";
import { SignInPage } from "@/pages/auth/SignInPage";
import { SignUpPage } from "@/pages/auth/SignUpPage";
import { CallbackPage } from "@/pages/auth/CallbackPage";
import { AccountPage } from "@/pages/account/AccountPage";
import { ScrollToTop } from "@/components/ScrollToTop";

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen">
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about/mission" element={<MissionPage />} />
            <Route path="/about/what-is-an-rse" element={<WhatIsRSEPage />} />
            <Route path="/about/dei" element={<DEIPage />} />
            <Route path="/about/governance" element={<GovernancePage />} />
            <Route path="/about/board" element={<BoardPage />} />
            <Route path="/about/elections" element={<ElectionsPage />} />
            <Route path="/about/code-of-conduct" element={<CodeOfConductPage />} />
            <Route path="/about/sponsors" element={<SponsorsPage />} />
            <Route path="/about/staff" element={<StaffPage />} />
            <Route path="/about/financial-status" element={<FinancialStatusPage />} />
            <Route path="/community/working-groups" element={<WorkingGroupsPage />} />
            <Route path="/community/affinity-groups" element={<AffinityGroupsPage />} />
            <Route path="/community/calls" element={<CommunityCallsPage />} />
            <Route path="/community/awards" element={<CommunityAwardsPage />} />
            <Route path="/community/funds" element={<CommunityFundsPage />} />
            <Route path="/events" element={<UpcomingEventsPage />} />
            <Route path="/events/calendar" element={<CalendarPage />} />
            <Route path="/events/usrse26" element={<ConferencePage />} />
            <Route path="/jobs" element={<BrowseJobsPage />} />
            <Route path="/jobs/submit" element={<SubmitJobPage />} />
            <Route path="/jobs/volunteer" element={<VolunteerPage />} />
            <Route path="/news" element={<NewslettersPage />} />
            <Route path="/news/updates" element={<NewsUpdatesPage />} />
            <Route path="/resources" element={<LearnPage />} />
            <Route path="/resources/directory" element={<DirectoryPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/auth/callback" element={<CallbackPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
