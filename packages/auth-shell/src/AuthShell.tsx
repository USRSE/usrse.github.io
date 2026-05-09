import { StrictMode, type ReactNode } from "react";
import { AuthKitProvider } from "@workos-inc/authkit-react";
import { RootErrorBoundary } from "./RootErrorBoundary";

interface AuthShellProps {
  /** WorkOS client ID. Pass the env var directly; AuthShell handles the missing case. */
  clientId: string | undefined;
  /** Which app is mounting this — used in the configuration-error message body. */
  appLabel: string;
  /** Where to send the user back after sign-in. Defaults to `${origin}/auth/callback`. */
  redirectUri?: string;
  /** Set to true in dev so AuthKit dev mode features turn on. */
  devMode?: boolean;
  children: ReactNode;
}

export function AuthShell({
  clientId,
  appLabel,
  redirectUri,
  devMode,
  children,
}: AuthShellProps) {
  if (!clientId) {
    return (
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
          <code>VITE_WORKOS_CLIENT_ID</code> is not set. {appLabel} can't
          initialize authentication.
        </p>
        <p style={{ fontSize: "0.875rem", color: "#6b7476" }}>
          Local dev: copy <code>.env.example</code> to <code>.env.local</code>
          and fill in the WorkOS values, then restart the dev server.
          Cloudflare Pages: add the variable under Settings → Variables and
          Secrets and redeploy.
        </p>
      </div>
    );
  }

  const effectiveRedirect =
    redirectUri ?? `${window.location.origin}/auth/callback`;

  return (
    <StrictMode>
      <RootErrorBoundary>
        <AuthKitProvider
          clientId={clientId}
          redirectUri={effectiveRedirect}
          devMode={devMode}
        >
          {children}
        </AuthKitProvider>
      </RootErrorBoundary>
    </StrictMode>
  );
}
