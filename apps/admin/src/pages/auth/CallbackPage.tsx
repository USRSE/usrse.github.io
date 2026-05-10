import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function CallbackPage() {
  const navigate = useNavigate();
  // The AuthKit provider mounted in main.tsx detects the code param
  // and exchanges it for a token automatically. Once the user is
  // populated, useAuth().user becomes truthy and we can move on.
  // For simplicity, redirect home after a tick — the shell will
  // re-render with the populated user.
  useEffect(() => {
    const t = setTimeout(() => navigate("/", { replace: true }), 200);
    return () => clearTimeout(t);
  }, [navigate]);
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      Signing you in…
    </main>
  );
}
