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
  const progCols = new Set(progColsRes.rows.map((r) => r.name as string));

  if (!progCols.has("session_type_id")) {
    console.log("Adding missing column 'session_type_id' to programme_session...");
    await client.execute(`ALTER TABLE \`programme_session\` ADD COLUMN \`session_type_id\` text;`);
  }

  if (!progCols.has("scholar_id")) {
    console.log("Adding missing column 'scholar_id' to programme_session...");
    await client.execute(`ALTER TABLE \`programme_session\` ADD COLUMN \`scholar_id\` text;`);
  }

  console.log("3. Ensuring indexes on programme_session...");
  await client.execute(`CREATE INDEX IF NOT EXISTS \`programme_session_cohort_idx\` ON \`programme_session\` (\`cohort_id\`);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS \`programme_session_coach_idx\` ON \`programme_session\` (\`coach_id\`);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS \`programme_session_type_idx\` ON \`programme_session\` (\`session_type_id\`);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS \`programme_session_scholar_idx\` ON \`programme_session\` (\`scholar_id\`);`);

  console.log("4. Checking resource table & columns...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS \`resource\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`cohort_id\` text,
      \`session_id\` text,
      \`title\` text NOT NULL,
      \`description\` text,
      \`type\` text DEFAULT 'document' NOT NULL,
      \`file_key\` text,
      \`url\` text,
      \`uploaded_by\` text,
      \`created_at\` integer NOT NULL
    );
  `);

  const resColsRes = await client.execute(`PRAGMA table_info("resource")`);
  const resCols = new Set(resColsRes.rows.map((r) => r.name as string));

  if (!resCols.has("type")) {
    console.log("Adding missing column 'type' to resource...");
    await client.execute(`ALTER TABLE \`resource\` ADD COLUMN \`type\` text DEFAULT 'document' NOT NULL;`);
  }
  if (!resCols.has("url")) {
    console.log("Adding missing column 'url' to resource...");
    await client.execute(`ALTER TABLE \`resource\` ADD COLUMN \`url\` text;`);
  }
  if (!resCols.has("session_id")) {
    console.log("Adding missing column 'session_id' to resource...");
    await client.execute(`ALTER TABLE \`resource\` ADD COLUMN \`session_id\` text;`);
  }

  await client.execute(`CREATE INDEX IF NOT EXISTS \`resource_cohort_idx\` ON \`resource\` (\`cohort_id\`);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS \`resource_session_idx\` ON \`resource\` (\`session_id\`);`);

  console.log("5. Ensuring resource_engagement table exists...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS \`resource_engagement\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`resource_id\` text NOT NULL,
      \`scholar_id\` text NOT NULL,
      \`session_id\` text,
      \`viewed_at\` integer NOT NULL,
      \`completed_at\` integer,
      \`created_at\` integer NOT NULL,
      \`updated_at\` integer NOT NULL
    );
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS \`resource_engagement_resource_scholar_idx\` 
    ON \`resource_engagement\` (\`resource_id\`, \`scholar_id\`);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS \`resource_engagement_scholar_idx\` 
    ON \`resource_engagement\` (\`scholar_id\`);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS \`resource_engagement_session_idx\` 
    ON \`resource_engagement\` (\`session_id\`);
  `);

  console.log("6. Checking columns on scholar_profile table...");
  const scholarColsRes = await client.execute(`PRAGMA table_info("scholar_profile")`);
  const scholarCols = new Set(scholarColsRes.rows.map((r) => r.name as string));

  if (!scholarCols.has("linkedin_url")) {
    console.log("Adding missing column 'linkedin_url' to scholar_profile...");
    await client.execute(`ALTER TABLE \`scholar_profile\` ADD COLUMN \`linkedin_url\` text;`);
  }
  if (!scholarCols.has("degree")) {
    console.log("Adding missing column 'degree' to scholar_profile...");
    await client.execute(`ALTER TABLE \`scholar_profile\` ADD COLUMN \`degree\` text;`);
  }

  console.log("7. Verifying production tables...");
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
