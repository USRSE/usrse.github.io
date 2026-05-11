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
        <Route path="members" element={<Stub label="Members" />} />
        <Route path="organizations" element={<Stub label="Organizations" />} />
        <Route path="vocab" element={<Stub label="Vocab" />} />
        <Route path="groups" element={<Stub label="Groups" />} />
        <Route path="events" element={<Stub label="Events" />} />
        <Route path="recognition" element={<Stub label="Recognition" />} />
        <Route path="settings" element={<Stub label="Settings" />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Stub({ label }: { label: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{label}</h2>
      <p className="text-neutral-600">
        Coming soon — see <code>docs/superpowers/specs/</code>.
      </p>
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
      <div className="h-1 bg-purple-700" aria-hidden="true" />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-500 text-center max-w-md">
          {message}
        </p>
      </main>
    </div>
  );
}
