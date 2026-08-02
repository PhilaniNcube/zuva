import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { sessionType } from "../lib/db/schema";

process.loadEnvFile(".env.production");

const SESSION_TYPES = [
  // Masterclasses (group)
  { name: "Leadership beyond your degree", kind: "masterclass", format: "group", sortOrder: 0 },
  { name: "Academic Writing", kind: "masterclass", format: "group", sortOrder: 1 },
  { name: "Data and Decisions", kind: "masterclass", format: "group", sortOrder: 2 },
  // Coaching sessions (1:1, scholar picks the topic at booking)
  { name: "Aligning your research with your purpose", kind: "coaching", format: "one_on_one", sortOrder: 0 },
  { name: "Developing your thesis structure and writing the perfect abstract", kind: "coaching", format: "one_on_one", sortOrder: 1 },
  // Other
  { name: "Onboarding Session", kind: "onboarding", format: "one_on_one", sortOrder: 0 },
  { name: "Orientation Session", kind: "orientation", format: "group", sortOrder: 0 },
] as const;

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
  const db = drizzle(client);

  console.log("Seeding session_type table in production...");

  for (const st of SESSION_TYPES) {
    const [row] = await db
      .select()
      .from(sessionType)
      .where(eq(sessionType.name, st.name));

    if (!row) {
      await db.insert(sessionType).values(st);
      console.log(`  + Created session type: ${st.name}`);
    } else {
      console.log(`  - Already exists: ${st.name}`);
    }
  }

  console.log("✅ Production session_type seeding complete!");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
