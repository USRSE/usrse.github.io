import { Route, Routes } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useActorContext } from "./hooks/useActorContext";
import { NotEntitled } from "./layout/NotEntitled";
import { CallbackPage } from "./pages/auth/CallbackPage";

export function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route path="/*" element={<Gate />} />
    </Routes>
  );
}

function Gate() {
  const { user: workosUser, isLoading: authLoading, signIn } = useAuth();
  const actor = useActorContext();

  if (authLoading) {
    return <main style={{ padding: "2rem" }}>Loading…</main>;
  }
  if (!workosUser) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>US-RSE Admin</h1>
        <button type="button" onClick={() => signIn()}>
          Sign in
        </button>
      </main>
    );
  }
  if (actor.status === "loading" || actor.status === "idle") {
    return <main style={{ padding: "2rem" }}>Loading actor context…</main>;
  }
  if (actor.status === "forbidden") return <NotEntitled />;
  if (actor.status === "user_pending") {
    return (
      <main style={{ padding: "2rem" }}>
        Your account is being provisioned — try again in a moment.
      </main>
    );
  }
  if (actor.status === "error" || !actor.actor) {
    return (
      <main style={{ padding: "2rem" }}>
        Couldn't load admin context. {actor.error?.message ?? "Unknown error."}
      </main>
    );
  }
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>US-RSE Admin</h1>
      <p>Signed in as {actor.actor.user.email}.</p>
      <p>System tier: {actor.actor.systemTier}.</p>
      <p>Shell lands in Task 10.</p>
    </main>
  );
}
