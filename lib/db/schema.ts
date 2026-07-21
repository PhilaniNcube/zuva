import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

// ---------------------------------------------------------------------------
// Auth tables (Better Auth core — do not rename; adapter expects these names)
// ---------------------------------------------------------------------------

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  role: text("role", { enum: ["scholar", "coach", "admin", "minds"] })
    .notNull()
    .default("scholar"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});

// ---------------------------------------------------------------------------
// Identity & cohorts
// ---------------------------------------------------------------------------

export const cohort = sqliteTable("cohort", {
  id: id(),
  name: text("name").notNull(),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp" }),
  status: text("status", { enum: ["draft", "active", "completed"] })
    .notNull()
    .default("draft"),
  ...timestamps,
});

export const scholarProfile = sqliteTable(
  "scholar_profile",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cohortId: text("cohort_id").references(() => cohort.id, {
      onDelete: "set null",
    }),
    country: text("country"),
    whatsappNumber: text("whatsapp_number"),
    bio: text("bio"),
    mtpText: text("mtp_text"),
    onboardingCompletedAt: integer("onboarding_completed_at", {
      mode: "timestamp",
    }),
    ...timestamps,
  },
  (t) => [uniqueIndex("scholar_profile_user_id_idx").on(t.userId)],
);

export const coachProfile = sqliteTable(
  "coach_profile",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    specialty: text("specialty", {
      enum: ["academic_writing", "leadership", "data_decisions", "one_on_one"],
    }).notNull(),
    whatsappNumber: text("whatsapp_number").notNull(),
    bio: text("bio"),
    ...timestamps,
  },
  (t) => [uniqueIndex("coach_profile_user_id_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// Sessions, booking & attendance
// ---------------------------------------------------------------------------

// Named programme_session to avoid collision with Better Auth's session table.
export const programmeSession = sqliteTable(
  "programme_session",
  {
    id: id(),
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohort.id, { onDelete: "cascade" }),
    coachId: text("coach_id").references(() => user.id, {
      onDelete: "set null",
    }),
    type: text("type", {
      enum: ["orientation", "masterclass", "coaching_1on1"],
    }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
    googleEventId: text("google_event_id"),
    meetLink: text("meet_link"),
    status: text("status", { enum: ["scheduled", "cancelled", "completed"] })
      .notNull()
      .default("scheduled"),
    ...timestamps,
  },
  (t) => [
    index("programme_session_cohort_idx").on(t.cohortId),
    index("programme_session_coach_idx").on(t.coachId),
  ],
);

export const availabilitySlot = sqliteTable(
  "availability_slot",
  {
    id: id(),
    coachId: text("coach_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
    status: text("status", { enum: ["open", "booked", "cancelled"] })
      .notNull()
      .default("open"),
    ...timestamps,
  },
  (t) => [index("availability_slot_coach_idx").on(t.coachId, t.status)],
);

export const booking = sqliteTable(
  "booking",
  {
    id: id(),
    slotId: text("slot_id")
      .notNull()
      .references(() => availabilitySlot.id, { onDelete: "cascade" }),
    scholarId: text("scholar_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => programmeSession.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["confirmed", "cancelled", "completed"] })
      .notNull()
      .default("confirmed"),
    bookedAt: integer("booked_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("booking_slot_idx").on(t.slotId),
    index("booking_scholar_idx").on(t.scholarId),
  ],
);

export const attendance = sqliteTable(
  "attendance",
  {
    id: id(),
    sessionId: text("session_id")
      .notNull()
      .references(() => programmeSession.id, { onDelete: "cascade" }),
    scholarId: text("scholar_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: integer("joined_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    source: text("source", { enum: ["join_click", "manual_admin"] })
      .notNull()
      .default("join_click"),
  },
  (t) => [
    uniqueIndex("attendance_session_scholar_idx").on(t.sessionId, t.scholarId),
    index("attendance_scholar_idx").on(t.scholarId),
  ],
);

// ---------------------------------------------------------------------------
// Learning pathway
// ---------------------------------------------------------------------------

export const pathwayStep = sqliteTable(
  "pathway_step",
  {
    id: id(),
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohort.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    kind: text("kind", {
      enum: ["orientation", "masterclass", "coaching", "feedback"],
    }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("pathway_step_cohort_idx").on(t.cohortId)],
);

export const scholarStepProgress = sqliteTable(
  "scholar_step_progress",
  {
    id: id(),
    stepId: text("step_id")
      .notNull()
      .references(() => pathwayStep.id, { onDelete: "cascade" }),
    scholarId: text("scholar_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "done"] })
      .notNull()
      .default("pending"),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    // What satisfied the step, e.g. an attendance or feedback_submission id.
    completedVia: text("completed_via"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("step_progress_step_scholar_idx").on(t.stepId, t.scholarId),
    index("step_progress_scholar_idx").on(t.scholarId),
  ],
);

// ---------------------------------------------------------------------------
// Editing requests & resource library (files live in Cloudflare R2)
// ---------------------------------------------------------------------------

export const submissionStatus = [
  "submitted",
  "critical_review",
  "language_editing",
  "returned",
] as const;

export const submission = sqliteTable(
  "submission",
  {
    id: id(),
    scholarId: text("scholar_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    fileKey: text("file_key").notNull(),
    status: text("status", { enum: submissionStatus })
      .notNull()
      .default("submitted"),
    reviewerId: text("reviewer_id").references(() => user.id, {
      onDelete: "set null",
    }),
    editorId: text("editor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    dueAt: integer("due_at", { mode: "timestamp" }),
    returnedFileKey: text("returned_file_key"),
    ...timestamps,
  },
  (t) => [
    index("submission_scholar_idx").on(t.scholarId),
    index("submission_status_idx").on(t.status),
  ],
);

export const submissionEvent = sqliteTable(
  "submission_event",
  {
    id: id(),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submission.id, { onDelete: "cascade" }),
    fromStatus: text("from_status", { enum: submissionStatus }),
    toStatus: text("to_status", { enum: submissionStatus }).notNull(),
    note: text("note"),
    changedBy: text("changed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("submission_event_submission_idx").on(t.submissionId)],
);

export const resource = sqliteTable(
  "resource",
  {
    id: id(),
    cohortId: text("cohort_id").references(() => cohort.id, {
      onDelete: "cascade",
    }),
    sessionId: text("session_id").references(() => programmeSession.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    fileKey: text("file_key").notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("resource_cohort_idx").on(t.cohortId)],
);

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export const feedbackSubmission = sqliteTable(
  "feedback_submission",
  {
    id: id(),
    sessionId: text("session_id")
      .notNull()
      .references(() => programmeSession.id, { onDelete: "cascade" }),
    // Always stored so the 5-form certificate requirement can be counted;
    // hidden from coaches/admin in the UI when isAnonymous is true.
    scholarId: text("scholar_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isAnonymous: integer("is_anonymous", { mode: "boolean" })
      .notNull()
      .default(false),
    responses: text("responses", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
    submittedAt: integer("submitted_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("feedback_session_scholar_idx").on(t.sessionId, t.scholarId),
    index("feedback_scholar_idx").on(t.scholarId),
  ],
);

// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------

export const certificate = sqliteTable(
  "certificate",
  {
    id: id(),
    scholarId: text("scholar_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohort.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["eligible", "pending_approval", "issued"],
    })
      .notNull()
      .default("eligible"),
    // Snapshot of the scholar's MTP at issuance time.
    mtpText: text("mtp_text"),
    // Documents admin discretion (advance / hold / revoke decisions).
    adminNote: text("admin_note"),
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedAt: integer("approved_at", { mode: "timestamp" }),
    issuedAt: integer("issued_at", { mode: "timestamp" }),
    pdfFileKey: text("pdf_file_key"),
    emailSentAt: integer("email_sent_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("certificate_scholar_idx").on(t.scholarId),
    index("certificate_status_idx").on(t.status),
  ],
);

export const emailLog = sqliteTable(
  "email_log",
  {
    id: id(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    type: text("type", {
      enum: ["certificate_issued", "editing_queue_alert", "password_reset"],
    }).notNull(),
    status: text("status", { enum: ["sent", "failed"] }).notNull(),
    sentAt: integer("sent_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("email_log_user_idx").on(t.userId)],
);
