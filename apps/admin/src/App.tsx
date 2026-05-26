import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useActorContext } from "./hooks/useActorContext";
import { NotEntitled } from "./layout/NotEntitled";
import { AdminShell } from "./layout/AdminShell";
import { CallbackPage } from "./pages/auth/CallbackPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AuditPage } from "./pages/AuditPage";
import { MembersListPage } from "./pages/members/MembersListPage";
import { MemberDetailPage } from "./pages/members/MemberDetailPage";
import { DuplicatesPage } from "./pages/members/DuplicatesPage";
import { MergeWizardPage } from "./pages/members/MergeWizardPage";
import { OrganizationsListPage } from "./pages/organizations/OrganizationsListPage";
import { OrganizationDetailPage } from "./pages/organizations/OrganizationDetailPage";
import { OrganizationDuplicatesPage } from "./pages/organizations/OrganizationDuplicatesPage";
import { OrganizationMergeWizardPage } from "./pages/organizations/OrganizationMergeWizardPage";
import { VocabDetailPage } from "./pages/vocab/VocabDetailPage";
import { VocabListPage } from "./pages/vocab/VocabListPage";
import { VocabQueuePage } from "./pages/vocab/VocabQueuePage";
import { GroupDetailPage } from "./pages/groups/GroupDetailPage";
import { GroupsListPage } from "./pages/groups/GroupsListPage";
import { EventsListPage } from "./pages/events/EventsListPage";
import { NewEventPage } from "./pages/events/NewEventPage";
import { EventDetailPage } from "./pages/events/EventDetailPage";

export function App() {
  const { user: workosUser, isLoading: authLoading } = useAuth();
  const actor = useActorContext();

  if (authLoading) return <FullScreenStatus message="Loading…" />;
  if (!workosUser) return <SignInPage />;
  if (actor.status === "loading" || actor.status === "idle") {
    return <FullScreenStatus message="Loading actor context…" />;
  }
  if (actor.status === "forbidden") return <NotEntitled />;
  if (actor.status === "user_pending") {
    return (
      <FullScreenStatus message="Your account is being provisioned — try again in a moment." />
    );
  }
  if (actor.status === "error" || !actor.actor) {
    return (
      <FullScreenStatus
        message={`Couldn't load admin context. ${actor.error?.message ?? "Unknown error."}`}
      />
    );
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route element={<AdminShell actor={actor.actor} />}>
        <Route index element={<DashboardPage />} />
        <Route path="members" element={<MembersListPage />} />
        <Route path="members/duplicates/merge" element={<MergeWizardPage />} />
        <Route path="members/duplicates" element={<DuplicatesPage />} />
        <Route path="members/:id" element={<MemberDetailPage />} />
        <Route path="organizations" element={<OrganizationsListPage />} />
        <Route
          path="organizations/duplicates/merge"
          element={<OrganizationMergeWizardPage />}
        />
        <Route
          path="organizations/duplicates"
          element={<OrganizationDuplicatesPage />}
        />
        <Route path="organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="vocab/:kind/:id" element={<VocabDetailPage />} />
        <Route path="vocab/:kind" element={<VocabListPage />} />
        <Route path="vocab" element={<VocabQueuePage />} />
        <Route path="groups/:id" element={<GroupDetailPage />} />
        <Route path="groups" element={<GroupsListPage />} />
        <Route path="events" element={<EventsListPage />} />
        <Route path="events/new" element={<NewEventPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="recognition" element={<ComingSoon number="06" label="Recognition" blurb="Awards lifecycle, mentorship pairings, and community contribution logging — the source of dossier badges." />} />
        <Route path="settings" element={<ComingSoon number="07" label="Settings" blurb="Super-admin operations, integration toggles, and global flags." />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function FullScreenStatus({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--admin-paper)" }}>
      <div className="h-1" style={{ background: "var(--admin-ribbon)" }} aria-hidden="true" />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <p className="admin-classification">{message}</p>
      </main>
    </div>
  );
}

function ComingSoon({ label, number, blurb }: { label: string; number: string; blurb: string }) {
  // Convert "01" → "I", "02" → "II" etc., matching the sidebar's numerals.
  const arabic = parseInt(number, 10);
  const romanMap = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const roman = romanMap[arabic] ?? number;
  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-8">
        US-RSE · Admin · Register {roman}
      </p>
      <h2 className="admin-display mb-6" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {label}
      </h2>
      <div style={{ borderTop: "1px solid var(--admin-rule)" }} className="pt-6 mb-10">
        <p className="text-[17px] leading-[1.7]" style={{ color: "var(--admin-ink-medium)", maxWidth: "var(--admin-measure)" }}>
          {blurb}
        </p>
      </div>
      <div
        className="inline-flex items-center gap-3 px-4 py-2"
        style={{
          border: "1px solid var(--admin-rule)",
          background: "transparent",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
          style={{ background: "var(--admin-ribbon)" }}
          aria-hidden="true"
        />
        <span className="admin-classification" style={{ color: "var(--admin-ink-medium)" }}>
          In preparation
        </span>
      </div>
    </div>
  );
}
