import { defineConfig } from "drizzle-kit";

// Load env file for CLI usage (drizzle-kit does not auto-load it).
const envFile = process.env.ENV_FILE || ".env.local";
try {
  process.loadEnvFile(envFile);
} catch {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // env files are optional; fall back to real environment variables.
  }
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
