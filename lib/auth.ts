import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db";
import type { Role } from "./roles";

export type { Role } from "./roles";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "scholar",
        // Role is assigned server-side (seed / admin), never taken from input.
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
