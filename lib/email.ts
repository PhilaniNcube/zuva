import "server-only";

import { Resend } from "resend";

import { db } from "./db";
import { emailLog } from "./db/schema";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = process.env.RESEND_FROM ?? "ZUVA <noreply@zuva.app>";

/**
 * Send a certificate-issued email to the scholar. Logs to emailLog.
 * Degrades gracefully when RESEND_API_KEY is not set.
 */
export async function sendCertificateEmail({
  to,
  scholarName,
  certificateUrl,
}: {
  to: string;
  scholarName: string;
  certificateUrl: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend not configured — skipping certificate email to", to);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Your ZUVA Certificate is Ready",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #18181b;">Congratulations, ${scholarName}!</h2>
          <p style="color: #3f3f46;">
            Your ZUVA Scholar Hub certificate has been issued. You can download
            it using the link below.
          </p>
          <p style="margin: 24px 0;">
            <a href="${certificateUrl}"
               style="background: #18181b; color: #fafafa; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: 500;">
              Download Certificate
            </a>
          </p>
          <p style="color: #71717a; font-size: 14px;">
            This link expires in 7 days. You can always find your certificate
            on your pathway page.
          </p>
        </div>
      `,
    });

    await db.insert(emailLog).values({
      userId: null,
      type: "certificate_issued",
      status: "sent",
    });
  } catch (err) {
    console.error("Failed to send certificate email:", err);
    await db.insert(emailLog).values({
      userId: null,
      type: "certificate_issued",
      status: "failed",
    });
  }
}

/**
 * Send a password reset link to the user. Logs to emailLog.
 * Degrades gracefully when RESEND_API_KEY is not set.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend not configured — skipping password reset email to", to);
    console.info("Password Reset Link (Dev):", resetUrl);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your ZUVA Scholar Hub password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #18181b;">Reset Your Password</h2>
          <p style="color: #3f3f46;">
            We received a request to reset your ZUVA Scholar Hub password. Click the button below to set a new password.
          </p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}"
               style="background: #18181b; color: #fafafa; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #71717a; font-size: 14px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    await db.insert(emailLog).values({
      userId: null,
      type: "password_reset",
      status: "sent",
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    await db.insert(emailLog).values({
      userId: null,
      type: "password_reset",
      status: "failed",
    });
  }
}

