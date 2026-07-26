import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db";
import type { Role } from "./roles";

export type { Role } from "./roles";

const envOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const defaultOrigins = [
  "https://zuvacoaching.com",
  "https://www.zuvacoaching.com",
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
].filter((url): url is string => Boolean(url));

const trustedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  trustedOrigins,
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
