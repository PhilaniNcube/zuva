import { Resend } from "resend";


import { db } from "./db";
import { emailLog } from "./db/schema";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = process.env.RESEND_FROM ?? process.env.EMAIL_FROM ?? "ZUVA <noreply@zuva.app>";

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

/**
 * Send an welcome & enrolment email to a newly enrolled scholar with their credentials.
 * Logs to emailLog. Degrades gracefully when RESEND_API_KEY is not set.
 */
export async function sendScholarEnrolledEmail({
  to,
  scholarName,
  tempPassword,
  userId,
}: {
  to: string;
  scholarName: string;
  tempPassword?: string;
  userId?: string;
}): Promise<{ sent: boolean; reason?: "resend_not_configured" | "send_failed" }> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend not configured — skipping scholar enrolment email to", to);
    return { sent: false, reason: "resend_not_configured" };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to ZUVA Scholar Hub",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #18181b;">Welcome to ZUVA Scholar Hub, ${scholarName}!</h2>
          <p style="color: #3f3f46;">
            You have been enrolled in the ZUVA postgraduate scholar coaching programme.
          </p>
          ${
            tempPassword
              ? `<div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px;">Your temporary password:</p>
                  <code style="font-size: 16px; font-weight: bold; color: #18181b;">${tempPassword}</code>
                </div>`
              : ""
          }
          <p style="margin: 24px 0;">
            <a href="${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/login"
               style="background: #18181b; color: #fafafa; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
              Sign In to Scholar Hub
            </a>
          </p>
        </div>
      `,
    });

    await db.insert(emailLog).values({
      userId: userId ?? null,
      type: "scholar_enrolled",
      status: "sent",
    });

    return { sent: true };
  } catch (err) {
    console.error("Failed to send scholar enrolment email:", err);
    await db.insert(emailLog).values({
      userId: userId ?? null,
      type: "scholar_enrolled",
      status: "failed",
    });
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * Send a welcome & credentials email to a newly created coach.
 * Logs to emailLog. Returns status indicating whether delivery succeeded or why it was skipped.
 */
export async function sendCoachWelcomeEmail({
  to,
  coachName,
  tempPassword,
  userId,
}: {
  to: string;
  coachName: string;
  tempPassword: string;
  userId: string;
}): Promise<{ sent: boolean; reason?: "resend_not_configured" | "send_failed" }> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend not configured — skipping coach welcome email to", to);
    return { sent: false, reason: "resend_not_configured" };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to ZUVA Scholar Hub - Coach Account Credentials",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #18181b;">Welcome to ZUVA Scholar Hub, ${coachName}!</h2>
          <p style="color: #3f3f46;">
            You have been registered as a Coach on the ZUVA postgraduate scholar coaching platform.
          </p>
          <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px;">Your temporary password:</p>
            <code style="font-size: 16px; font-weight: bold; color: #18181b;">${tempPassword}</code>
          </div>
          <p style="margin: 24px 0;">
            <a href="${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/login"
               style="background: #18181b; color: #fafafa; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
              Sign In to Coach Dashboard
            </a>
          </p>
        </div>
      `,
    });

    await db.insert(emailLog).values({
      userId,
      type: "coach_welcome",
      status: "sent",
    });

    return { sent: true };
  } catch (err) {
    console.error("Failed to send coach welcome email:", err);
    await db.insert(emailLog).values({
      userId,
      type: "coach_welcome",
      status: "failed",
    });
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * Send a session calendar invite (with an `.ics` attachment) to a participant.
 * Used to distribute cohort masterclass/orientation invites to scholars, who
 * aren't added as Google Calendar attendees. Degrades gracefully without Resend.
 */
export async function sendSessionInviteEmail({
  to,
  recipientName,
  sessionTitle,
  startsAt,
  meetLink,
  sessionUrl,
  icsContent,
  userId,
}: {
  to: string;
  recipientName: string;
  sessionTitle: string;
  startsAt: Date;
  meetLink: string | null;
  sessionUrl: string;
  icsContent: string;
  userId?: string;
}): Promise<{ sent: boolean; reason?: "resend_not_configured" | "send_failed" }> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend not configured — skipping session invite to", to);
    return { sent: false, reason: "resend_not_configured" };
  }

  const whenText = startsAt.toUTCString();

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Invitation: ${sessionTitle}`,
      attachments: [
        {
          filename: "zuva-session.ics",
          content: Buffer.from(icsContent),
          contentType: "text/calendar",
        },
      ],
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #18181b;">You're invited, ${recipientName}</h2>
          <p style="color: #3f3f46;">
            <strong>${sessionTitle}</strong><br />
            ${whenText} (UTC)
          </p>
          <p style="margin: 24px 0;">
            <a href="${sessionUrl}"
               style="background: #18181b; color: #fafafa; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
              View session &amp; join
            </a>
          </p>
          ${
            meetLink
              ? `<p style="color: #71717a; font-size: 14px;">
                   Or open the video call directly: <a href="${meetLink}">${meetLink}</a>
                 </p>`
              : ""
          }
          <p style="color: #71717a; font-size: 14px;">
            A calendar file is attached — open it to add this session to your own calendar.
          </p>
        </div>
      `,
    });

    await db.insert(emailLog).values({
      userId: userId ?? null,
      type: "session_invite",
      status: "sent",
    });

    return { sent: true };
  } catch (err) {
    console.error("Failed to send session invite email:", err);
    await db.insert(emailLog).values({
      userId: userId ?? null,
      type: "session_invite",
      status: "failed",
    });
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * Send a pre-session reminder (with an `.ics` attachment) to a participant.
 * `window` controls the wording only; dedupe is handled by the caller.
 * Degrades gracefully when RESEND_API_KEY is not set.
 */
export async function sendSessionReminderEmail({
  to,
  recipientName,
  sessionTitle,
  startsAt,
  meetLink,
  sessionUrl,
  window,
  icsContent,
  userId,
}: {
  to: string;
  recipientName: string;
  sessionTitle: string;
  startsAt: Date;
  meetLink: string | null;
  sessionUrl: string;
  window: "24h" | "1h";
  icsContent: string;
  userId?: string;
}): Promise<{ sent: boolean; reason?: "resend_not_configured" | "send_failed" }> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend not configured — skipping session reminder to", to);
    return { sent: false, reason: "resend_not_configured" };
  }

  const lead = window === "1h" ? "in 1 hour" : "tomorrow";
  const whenText = startsAt.toUTCString();

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Reminder: ${sessionTitle} starts ${lead}`,
      attachments: [
        {
          filename: "zuva-session.ics",
          content: Buffer.from(icsContent),
          contentType: "text/calendar",
        },
      ],
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #18181b;">See you soon, ${recipientName}</h2>
          <p style="color: #3f3f46;">
            <strong>${sessionTitle}</strong> starts ${lead}.<br />
            ${whenText} (UTC)
          </p>
          <p style="margin: 24px 0;">
            <a href="${sessionUrl}"
               style="background: #18181b; color: #fafafa; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
              Join the session
            </a>
          </p>
          ${
            meetLink
              ? `<p style="color: #71717a; font-size: 14px;">
                   Video call: <a href="${meetLink}">${meetLink}</a>
                 </p>`
              : ""
          }
        </div>
      `,
    });

    await db.insert(emailLog).values({
      userId: userId ?? null,
      type: "session_reminder",
      status: "sent",
    });

    return { sent: true };
  } catch (err) {
    console.error("Failed to send session reminder email:", err);
    await db.insert(emailLog).values({
      userId: userId ?? null,
      type: "session_reminder",
      status: "failed",
    });
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * Tell a participant a session recording is now available on the platform.
 * Links to the session page (not a raw, expiring storage URL). Degrades
 * gracefully when RESEND_API_KEY is not set.
 */
export async function sendSessionRecordingEmail({
  to,
  recipientName,
  sessionTitle,
  sessionUrl,
  userId,
}: {
  to: string;
  recipientName: string;
  sessionTitle: string;
  sessionUrl: string;
  userId?: string;
}): Promise<{ sent: boolean; reason?: "resend_not_configured" | "send_failed" }> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend not configured — skipping recording email to", to);
    return { sent: false, reason: "resend_not_configured" };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Recording available: ${sessionTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #18181b;">Recording ready, ${recipientName}</h2>
          <p style="color: #3f3f46;">
            The recording for <strong>${sessionTitle}</strong> is now available
            on the ZUVA Scholar Hub.
          </p>
          <p style="margin: 24px 0;">
            <a href="${sessionUrl}"
               style="background: #18181b; color: #fafafa; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
              Watch the recording
            </a>
          </p>
        </div>
      `,
    });

    await db.insert(emailLog).values({
      userId: userId ?? null,
      type: "session_recording",
      status: "sent",
    });

    return { sent: true };
  } catch (err) {
    console.error("Failed to send session recording email:", err);
    await db.insert(emailLog).values({
      userId: userId ?? null,
      type: "session_recording",
      status: "failed",
    });
    return { sent: false, reason: "send_failed" };
  }
}



