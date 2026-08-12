/**
 * Development seed: one active cohort, pathway steps, and a small cast of
 * users across all four roles. Safe to re-run — existing rows are skipped.
 *
 *   npm run db:push   # create tables first
 *   npm run db:seed
 */
import { and, eq } from "drizzle-orm";

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
    scholarEnrollment,
    coachProfile,
    pathwayStep,
    availabilitySlot,
    programmeSession,
    sessionType,
  } = await import("../lib/db/schema");

  // --- Session types (programme content — safe to re-run) -------------------
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

  const typeIds = new Map<string, string>();
  for (const st of SESSION_TYPES) {
    let [row] = await db
      .select()
      .from(sessionType)
      .where(eq(sessionType.name, st.name));
    if (!row) {
      [row] = await db.insert(sessionType).values(st).returning();
      console.log("Created session type:", st.name);
    }
    typeIds.set(st.name, row.id);
  }
  console.log("Session types ready");

  // --- Cohorts -------------------------------------------------------------
  let [oldCohort] = await db
    .select()
    .from(cohort)
    .where(eq(cohort.name, "2025 Intake"));
  if (!oldCohort) {
    [oldCohort] = await db
      .insert(cohort)
      .values({
        name: "2025 Intake",
        startsAt: new Date("2025-01-15"),
        status: "completed",
      })
      .returning();
    console.log("Created old cohort:", oldCohort.name);
  }

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
      degree: "MSc Public Health",
      linkedinUrl: "https://linkedin.com/in/tendai-scholar",
      bio: "Public health researcher focused on maternal health outcomes in rural districts.",
      mtp: "To ensure no mother in rural Zimbabwe dies from a preventable cause.",
      multiCohort: true,
    },
    {
      name: "Scholar Amina",
      email: "scholar.amina@zuva.test",
      country: "Kenya",
      degree: "PhD Environmental Science",
      linkedinUrl: "https://linkedin.com/in/amina-scholar",
      bio: "Climate adaptation specialist working with smallholder farming communities.",
      mtp: "To make African smallholder farmers resilient to a changing climate.",
      multiCohort: false,
    },
    {
      name: "Scholar Chidi",
      email: "scholar.chidi@zuva.test",
      country: "Nigeria",
      degree: "MEd Educational Technology",
      linkedinUrl: "https://linkedin.com/in/chidi-scholar",
      bio: "Education technologist building offline-first learning tools for low-connectivity schools.",
      mtp: "To give every Nigerian child access to quality learning, online or offline.",
      multiCohort: false,
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
        country: s.country,
        degree: s.degree,
        linkedinUrl: s.linkedinUrl,
        bio: s.bio,
        mtpText: s.mtp,
      });
    }

    // Enroll in the main cohort
    const [mainEnrollment] = await db
      .select()
      .from(scholarEnrollment)
      .where(
        and(
          eq(scholarEnrollment.scholarId, u.id),
          eq(scholarEnrollment.cohortId, theCohort.id)
        )
      );
    if (!mainEnrollment) {
      await db.insert(scholarEnrollment).values({
        scholarId: u.id,
        cohortId: theCohort.id,
      });
    }

    // If multiCohort, also enroll in oldCohort
    if (s.multiCohort && oldCohort) {
      const [oldEnrollment] = await db
        .select()
        .from(scholarEnrollment)
        .where(
          and(
            eq(scholarEnrollment.scholarId, u.id),
            eq(scholarEnrollment.cohortId, oldCohort.id)
          )
        );
      if (!oldEnrollment) {
        await db.insert(scholarEnrollment).values({
          scholarId: u.id,
          cohortId: oldCohort.id,
        });
      }
    }
  }
  console.log("Scholar profiles and enrollments ready");

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
      sessionTypeId: typeIds.get("Academic Writing")!,
      coachId: kofi.id,
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
