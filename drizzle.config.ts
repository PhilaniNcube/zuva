import { defineConfig } from "drizzle-kit";

// Load .env.local for CLI usage (drizzle-kit does not auto-load it).
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional; fall back to real environment variables.
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
});
