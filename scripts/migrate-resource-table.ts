import { createClient } from "@libsql/client";

// Load local or prod env
try {
  process.loadEnvFile(".env.local");
} catch {
  // optional
}

async function main() {
  const url = process.env.DATABASE_URL || "file:local.db";
  console.log(`Migrating resource tables on ${url}...`);

  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  // Drop old resource table if it exists so drizzle-kit push can re-create with new schema
  await client.execute("DROP TABLE IF EXISTS `resource_engagement`;");
  await client.execute("DROP TABLE IF EXISTS `resource`;");

  console.log("Resource tables dropped successfully.");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
