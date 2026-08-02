import { createClient } from "@libsql/client";

process.loadEnvFile(".env.production");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in .env.production");
  }

  console.log(`Connecting to production Turso database: ${url}`);
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  console.log("1. Ensuring session_type table exists...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS \`session_type\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`name\` text NOT NULL,
      \`kind\` text NOT NULL,
      \`format\` text NOT NULL,
      \`description\` text,
      \`sort_order\` integer DEFAULT 0 NOT NULL,
      \`is_active\` integer DEFAULT true NOT NULL,
      \`created_at\` integer NOT NULL,
      \`updated_at\` integer NOT NULL
    );
  `);
  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS \`session_type_name_unique\` ON \`session_type\` (\`name\`);
  `);

  console.log("2. Checking columns on programme_session table...");
  const progColsRes = await client.execute(`PRAGMA table_info("programme_session")`);
  const existingCols = new Set(progColsRes.rows.map((r) => r.name as string));

  if (!existingCols.has("session_type_id")) {
    console.log("Adding missing column 'session_type_id' to programme_session...");
    await client.execute(`ALTER TABLE \`programme_session\` ADD COLUMN \`session_type_id\` text;`);
  }

  if (!existingCols.has("scholar_id")) {
    console.log("Adding missing column 'scholar_id' to programme_session...");
    await client.execute(`ALTER TABLE \`programme_session\` ADD COLUMN \`scholar_id\` text;`);
  }

  console.log("3. Ensuring indexes on programme_session...");
  await client.execute(`CREATE INDEX IF NOT EXISTS \`programme_session_cohort_idx\` ON \`programme_session\` (\`cohort_id\`);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS \`programme_session_coach_idx\` ON \`programme_session\` (\`coach_id\`);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS \`programme_session_type_idx\` ON \`programme_session\` (\`session_type_id\`);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS \`programme_session_scholar_idx\` ON \`programme_session\` (\`scholar_id\`);`);

  console.log("4. Verifying all production tables...");
  const tablesRes = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle_%'"
  );
  console.log(`Production now contains ${tablesRes.rows.length} tables:`, tablesRes.rows.map((r) => r.name).join(", "));

  console.log("✅ Production database migration completed successfully with ZERO data loss.");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
