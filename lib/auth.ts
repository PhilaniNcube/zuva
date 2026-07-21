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
    async sendResetPassword({ user, url }) {
      const { sendPasswordResetEmail } = await import("./email");
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: url,
      });
    },
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
