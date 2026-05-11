import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useActorContext } from "./hooks/useActorContext";
import { NotEntitled } from "./layout/NotEntitled";
import { AdminShell } from "./layout/AdminShell";
import { CallbackPage } from "./pages/auth/CallbackPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AuditPage } from "./pages/AuditPage";

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
        <Route path="members" element={<ComingSoon number="01" label="Members" blurb="Member directory, manual edits, role assignment, and the cross-email merge tool. Currently 84 candidate duplicates waiting to be reviewed." />} />
        <Route path="organizations" element={<ComingSoon number="02" label="Organizations" blurb="Org details, logo uploads, recurring memberships, and per-event sponsorships. Schema is in; UI is next." />} />
        <Route path="vocab" element={<ComingSoon number="03" label="Vocab queue" blurb="Approve or reject pending disciplines, skills, languages, and organizations that members propose from their dossiers." />} />
        <Route path="groups" element={<ComingSoon number="04" label="Groups" blurb="Working, affinity, and regional groups. Chair assignments and group page content lifecycle." />} />
        <Route path="events" element={<ComingSoon number="05" label="Events" blurb="Event creation and approval, committee assignment, session scheduling, attendance, and sponsor wiring." />} />
        <Route path="recognition" element={<ComingSoon number="06" label="Recognition" blurb="Awards lifecycle, mentorship pairings, and community contribution logging — the source of dossier badges." />} />
        <Route path="settings" element={<ComingSoon number="07" label="Settings" blurb="Super-admin operations, integration toggles, and global flags." />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ComingSoon({ label, number, blurb }: { label: string; number: string; blurb: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-3">
        Section {number}
      </p>
      <h2 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900 mb-4">
        {label}
      </h2>
      <p className="text-base text-neutral-600 leading-relaxed mb-6">
        {blurb}
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse-soft" />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-700">
          In progress · see docs/superpowers/specs
        </span>
      </div>
    </div>
  );
}

/**
 * Branded transient state — shown for short-lived loading and
 * recoverable error conditions before the shell is mounted. Matches
 * the SignInPage chrome (purple top accent, centered content) so the
 * boot sequence reads as one continuous surface.
 */
function FullScreenStatus({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="h-1 bg-purple-500" aria-hidden="true" />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-500 text-center max-w-md">
          {message}
        </p>
      </main>
    </div>
  );
}
