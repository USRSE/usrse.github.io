import { defineConfig } from "drizzle-kit";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDevVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const contents = readFileSync(resolve(__dirname, ".dev.vars"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && m[1] === name) {
        return m[2].replace(/^"(.*)"$/, "$1");
      }
    }
  } catch {
    /* .dev.vars not present in CI is fine */
  }
  return undefined;
}

const databaseUrl = loadDevVar("DATABASE_URL");

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to packages/api/.dev.vars (local) " +
      "or export it in your shell before running drizzle-kit."
  );
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
