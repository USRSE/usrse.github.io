import { createRoot } from "react-dom/client";
import { AuthShell } from "@us-rse/auth-shell";
import "./index.css";
import { App } from "./App";

const clientId = import.meta.env.VITE_WORKOS_CLIENT_ID;
const root = createRoot(document.getElementById("root")!);

root.render(
  <AuthShell
    clientId={clientId}
    appLabel="The marketing site"
    devMode={import.meta.env.DEV}
  >
    <App />
  </AuthShell>
);
