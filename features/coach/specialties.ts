/**
 * Coach specialty labels — safe to import from both server and client code.
 */
export const SPECIALTIES = {
  academic_writing: "Academic Writing",
  leadership: "Leadership",
  data_decisions: "Data & Decisions",
  one_on_one: "1:1 Coaching",
} as const;

export type Specialty = keyof typeof SPECIALTIES;
