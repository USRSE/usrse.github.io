import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthKitProvider } from "@workos-inc/authkit-react";
import "./index.css";
import { App } from "./App";
import { RootErrorBoundary } from "./components/RootErrorBoundary";

const clientId = import.meta.env.VITE_WORKOS_CLIENT_ID;
const redirectUri = import.meta.env.VITE_WORKOS_REDIRECT_URI;
const root = createRoot(document.getElementById("root")!);

if (!clientId) {
  root.render(
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "32rem",
        margin: "4rem auto",
        padding: "2rem",
        border: "1px solid #eaeced",
        borderRadius: "0.75rem",
        color: "#363c3e",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginTop: 0, color: "#741755" }}>
        Configuration error
      </h1>
      <p>
        <code>VITE_WORKOS_CLIENT_ID</code> is not set. The app can't initialize
        authentication.
      </p>
      <p style={{ fontSize: "0.875rem", color: "#6b7476" }}>
        Local dev: copy <code>apps/web/.env.example</code> to
        <code> apps/web/.env.local</code> and fill in the WorkOS values, then
        restart the dev server. Cloudflare Pages: add the variable under
        Settings → Variables and Secrets and redeploy.
      </p>
    </div>
  );
} else {
  root.render(
    <StrictMode>
      <RootErrorBoundary>
        <AuthKitProvider
          clientId={clientId}
          redirectUri={redirectUri}
          devMode={import.meta.env.DEV}
        >
          <App />
        </AuthKitProvider>
      </RootErrorBoundary>
    </StrictMode>
  );
}
