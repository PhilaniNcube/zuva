/**
 * Development seed: one active cohort, pathway steps, and a small cast of
 * users across all four roles. Safe to re-run — existing rows are skipped.
 *
 *   npm run db:push   # create tables first
 *   npm run db:seed
 */
import { eq } from "drizzle-orm";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to real environment variables
}

const DEV_PASSWORD = "password123";

async function main() {
  // Imported after env is loaded so the client picks up DATABASE_URL.
  const { db } = await import("../lib/db");
  const { auth } = await import("../lib/auth");
  const {
    user,
    cohort,
    scholarProfile,
    coachProfile,
    pathwayStep,
    availabilitySlot,
    programmeSession,
  } = await import("../lib/db/schema");

  // --- Cohort -------------------------------------------------------------
  let [theCohort] = await db
    .select()
    .from(cohort)
    .where(eq(cohort.name, "2026 Intake 1"));
  if (!theCohort) {
    [theCohort] = await db
      .insert(cohort)
      .values({
        name: "2026 Intake 1",
        startsAt: new Date(),
        status: "active",
      })
      .returning();
    console.log("Created cohort:", theCohort.name);
  } else {
    console.log("Cohort exists, skipping:", theCohort.name);
  }

  // --- Pathway steps --------------------------------------------------------
  const steps = [
    {
      kind: "orientation" as const,
      title: "Programme orientation",
      description: "Attend the live orientation session for your intake.",
      sortOrder: 0,
    },
    {
      kind: "masterclass" as const,
      title: "Masterclass attendance",
      description: "Attend the scheduled masterclasses for your cohort.",
      sortOrder: 1,
    },
    {
      kind: "coaching" as const,
      title: "1:1 coaching sessions",
      description: "Book and attend your individual coaching sessions.",
      sortOrder: 2,
    },
    {
      kind: "feedback" as const,
      title: "Session feedback forms",
      description:
        "Submit five post-session feedback forms (required for your certificate).",
      sortOrder: 3,
    },
  ];
  const existingSteps = await db
    .select()
    .from(pathwayStep)
    .where(eq(pathwayStep.cohortId, theCohort.id));
  if (existingSteps.length === 0) {
    await db
      .insert(pathwayStep)
      .values(steps.map((s) => ({ ...s, cohortId: theCohort.id })));
    console.log(`Created ${steps.length} pathway steps`);
  } else {
    console.log("Pathway steps exist, skipping");
  }

  // --- Users ---------------------------------------------------------------
  async function ensureUser(
    name: string,
    email: string,
    role: "scholar" | "coach" | "admin" | "minds",
  ) {
    const [existing] = await db.select().from(user).where(eq(user.email, email));
    if (existing) {
      console.log(`User exists, skipping: ${email}`);
      return existing;
    }
    const result = await auth.api.signUpEmail({
      body: { name, email, password: DEV_PASSWORD },
    });
    const [updated] = await db
      .update(user)
      .set({ role })
      .where(eq(user.id, result.user.id))
      .returning();
    console.log(`Created ${role}: ${email} (password: ${DEV_PASSWORD})`);
    return updated;
  }

  await ensureUser("Admin Amara", "admin@zuva.test", "admin");
  await ensureUser("MINDS Reviewer", "minds@zuva.test", "minds");

  const kofi = await ensureUser("Coach Kofi", "coach.kofi@zuva.test", "coach");
  const naledi = await ensureUser(
    "Coach Naledi",
    "coach.naledi@zuva.test",
    "coach",
  );

  for (const [coachUser, specialty, whatsapp] of [
    [kofi, "academic_writing", "+233200000001"],
    [naledi, "leadership", "+27710000002"],
  ] as const) {
    const [existing] = await db
      .select()
      .from(coachProfile)
      .where(eq(coachProfile.userId, coachUser.id));
    if (!existing) {
      await db
        .insert(coachProfile)
        .values({ userId: coachUser.id, specialty, whatsappNumber: whatsapp });
    }
  }
  console.log("Coach profiles ready");

  const scholars = [
    {
      name: "Scholar Tendai",
      email: "scholar.tendai@zuva.test",
      country: "Zimbabwe",
      bio: "Public health researcher focused on maternal health outcomes in rural districts.",
      mtp: "To ensure no mother in rural Zimbabwe dies from a preventable cause.",
    },
    {
      name: "Scholar Amina",
      email: "scholar.amina@zuva.test",
      country: "Kenya",
      bio: "Climate adaptation specialist working with smallholder farming communities.",
      mtp: "To make African smallholder farmers resilient to a changing climate.",
    },
    {
      name: "Scholar Chidi",
      email: "scholar.chidi@zuva.test",
      country: "Nigeria",
      bio: "Education technologist building offline-first learning tools for low-connectivity schools.",
      mtp: "To give every Nigerian child access to quality learning, online or offline.",
    },
  ] as const;

  for (const s of scholars) {
    const u = await ensureUser(s.name, s.email, "scholar");
    const [existing] = await db
      .select()
      .from(scholarProfile)
      .where(eq(scholarProfile.userId, u.id));
    if (!existing) {
      await db.insert(scholarProfile).values({
        userId: u.id,
        cohortId: theCohort.id,
        country: s.country,
        bio: s.bio,
        mtpText: s.mtp,
      });
    }
  }
  console.log("Scholar profiles ready");

  // --- Availability slots & a masterclass ---------------------------------
  const day = 24 * 60 * 60 * 1000;
  const at = (days: number, hour: number, minute = 0) => {
    const d = new Date(Date.now() + days * day);
    d.setUTCHours(hour, minute, 0, 0);
    return d;
  };

  const existingSlots = await db.select().from(availabilitySlot);
  if (existingSlots.length === 0) {
    await db.insert(availabilitySlot).values([
      { coachId: kofi.id, startsAt: at(3, 14), endsAt: at(3, 14, 45) },
      { coachId: kofi.id, startsAt: at(5, 10), endsAt: at(5, 10, 45) },
      { coachId: naledi.id, startsAt: at(4, 15), endsAt: at(4, 15, 45) },
    ]);
    console.log("Created 3 availability slots");
  } else {
    console.log("Availability slots exist, skipping");
  }

  const existingSessions = await db.select().from(programmeSession);
  if (existingSessions.length === 0) {
    await db.insert(programmeSession).values({
      cohortId: theCohort.id,
      coachId: kofi.id,
      type: "masterclass",
      title: "Academic Writing Masterclass I",
      description:
        "Structuring your thesis: from research question to a working outline.",
      startsAt: at(7, 16),
      endsAt: at(7, 17, 30),
    });
    console.log("Created masterclass session");
  } else {
    console.log("Sessions exist, skipping");
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
