import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CommandPalette } from "@/components/members/CommandPalette";
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
import { RegionalGroupsPage } from "@/pages/community/RegionalGroupsPage";
import { GroupPage } from "@/pages/community/GroupPage";
import { CommunityAwardsPage } from "@/pages/community/CommunityAwardsPage";
import { CommunityFundsPage } from "@/pages/community/CommunityFundsPage";
import { UpcomingEventsPage } from "@/pages/events/UpcomingEventsPage";
import { CalendarPage } from "@/pages/events/CalendarPage";
import { ConferencePage } from "@/pages/events/ConferencePage";
import { SubmitEventPage } from "@/pages/events/SubmitEventPage";
import { EventDetailPage as PublicEventDetail } from "@/pages/events/EventDetailPage";
import { FormPage } from "@/pages/forms/FormPage";
import { BrowseJobsPage } from "@/pages/jobs/BrowseJobsPage";
import { SubmitJobPage } from "@/pages/jobs/SubmitJobPage";
import { VolunteerPage } from "@/pages/jobs/VolunteerPage";
import { NewslettersPage } from "@/pages/news/NewslettersPage";
import { NewsUpdatesPage } from "@/pages/news/NewsUpdatesPage";
import { LearnPage } from "@/pages/resources/LearnPage";
import { OrgsDirectoryPage } from "@/pages/orgs/OrgsDirectoryPage";
import { OrgProfilePage } from "@/pages/orgs/OrgProfilePage";
import { SignInPage } from "@/pages/auth/SignInPage";
import { SignUpPage } from "@/pages/auth/SignUpPage";
import { CallbackPage } from "@/pages/auth/CallbackPage";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SiteBanner } from "@/components/SiteBanner";

// Profile pages share ProfileView and a heavy section graph (motion,
// per-section components). Code-splitting them keeps that bundle out
// of the initial download for visitors who never view a profile.
const AccountPage = lazy(() =>
  import("@/pages/account/AccountPage").then((m) => ({ default: m.AccountPage }))
);
const MemberPage = lazy(() =>
  import("@/pages/members/MemberPage").then((m) => ({ default: m.MemberPage }))
);
const MembersIndexPage = lazy(() =>
  import("@/pages/members/MembersIndexPage").then((m) => ({
    default: m.MembersIndexPage,
  }))
);
const MeRedirect = lazy(() =>
  import("@/pages/account/MeRedirect").then((m) => ({ default: m.MeRedirect }))
);

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen">
        <SiteBanner />
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
            <Route path="/community/regional-groups" element={<RegionalGroupsPage />} />
            <Route path="/community/groups/:id" element={<GroupPage />} />
            {/* TODO: replace target with /community/groups/<community-calls-id> after ingest run */}
            <Route path="/community/calls" element={<Navigate to="/community/working-groups" replace />} />
            <Route path="/community/awards" element={<CommunityAwardsPage />} />
            <Route path="/community/funds" element={<CommunityFundsPage />} />
            <Route path="/events" element={<UpcomingEventsPage />} />
            <Route path="/events/calendar" element={<CalendarPage />} />
            <Route path="/events/usrse26" element={<ConferencePage />} />
            <Route path="/events/submit" element={<SubmitEventPage />} />
            <Route path="/events/:slug" element={<PublicEventDetail />} />
            <Route path="/forms/:slug" element={<FormPage />} />
            <Route path="/jobs" element={<BrowseJobsPage />} />
            <Route path="/jobs/submit" element={<SubmitJobPage />} />
            <Route path="/jobs/volunteer" element={<VolunteerPage />} />
            <Route path="/news" element={<NewslettersPage />} />
            <Route path="/news/updates" element={<NewsUpdatesPage />} />
            <Route path="/resources" element={<LearnPage />} />
            <Route
              path="/resources/directory"
              element={<Navigate to="/orgs" replace />}
            />
            <Route path="/orgs" element={<OrgsDirectoryPage />} />
            <Route path="/orgs/:id" element={<OrgProfilePage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/auth/callback" element={<CallbackPage />} />
            <Route
              path="/account"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <AccountPage />
                </Suspense>
              }
            />
            <Route
              path="/me"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <MeRedirect />
                </Suspense>
              }
            />
            <Route
              path="/members"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <MembersIndexPage />
                </Suspense>
              }
            />
            <Route
              path="/members/:slug"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <MemberPage />
                </Suspense>
              }
            />
          </Routes>
        </main>
        <Footer />
        <CommandPalette />
      </div>
    </BrowserRouter>
  );
}

// Minimal placeholder during chunk fetch — both profile pages render
// their own richer skeleton/loading states once the chunk arrives,
// so this just reserves vertical space and avoids a flash of empty
// chrome on slow networks.
function RouteFallback() {
  return <div className="min-h-[60vh]" aria-hidden="true" />;
}
