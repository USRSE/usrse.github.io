import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useActorContext } from "./hooks/useActorContext";
import { NotEntitled } from "./layout/NotEntitled";
import { AdminShell } from "./layout/AdminShell";
import { CallbackPage } from "./pages/auth/CallbackPage";

export function App() {
  const { user: workosUser, isLoading: authLoading, signIn } = useAuth();
  const actor = useActorContext();

  if (authLoading) return <main className="p-8">Loading…</main>;
  if (!workosUser) {
    return (
      <main className="p-8 font-sans">
        <h1 className="text-xl font-semibold">US-RSE Admin</h1>
        <button
          type="button"
          onClick={() => signIn()}
          className="mt-4 px-4 py-2 rounded bg-purple-700 text-white"
        >
          Sign in
        </button>
      </main>
    );
  }
  if (actor.status === "loading" || actor.status === "idle") {
    return <main className="p-8">Loading actor context…</main>;
  }
  if (actor.status === "forbidden") return <NotEntitled />;
  if (actor.status === "user_pending") {
    return (
      <main className="p-8">
        Your account is being provisioned — try again in a moment.
      </main>
    );
  }
  if (actor.status === "error" || !actor.actor) {
    return (
      <main className="p-8">
        Couldn't load admin context. {actor.error?.message ?? "Unknown error."}
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route element={<AdminShell actor={actor.actor} />}>
        <Route index element={<DashboardStub />} />
        <Route path="members" element={<Stub label="Members" />} />
        <Route path="organizations" element={<Stub label="Organizations" />} />
        <Route path="vocab" element={<Stub label="Vocab" />} />
        <Route path="groups" element={<Stub label="Groups" />} />
        <Route path="events" element={<Stub label="Events" />} />
        <Route path="recognition" element={<Stub label="Recognition" />} />
        <Route path="settings" element={<Stub label="Settings" />} />
        <Route path="audit" element={<Stub label="Audit" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function DashboardStub() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <p className="text-neutral-600">Tiles land in Task 11.</p>
    </div>
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
