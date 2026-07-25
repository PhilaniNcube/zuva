import fs from "node:fs";
import path from "node:path";
import { Resend } from "resend";

// Load .env.local manually if process.env is missing RESEND_API_KEY
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM ?? process.env.EMAIL_FROM ?? "ZUVA Scholar Hub <noreply@tweaks.co.za>";
const toRecipient = process.argv[2];

console.log("--- Resend API Test ---");
console.log(`API Key present: ${apiKey ? `Yes (${apiKey.substring(0, 7)}...)` : "No"}`);
console.log(`Sender (FROM):   ${fromEmail}`);
console.log(`Recipient (TO):  ${toRecipient ?? "Not specified"}`);
console.log("-----------------------\n");

if (!apiKey) {
  console.error("❌ Error: RESEND_API_KEY is not set in environment or .env.local.");
  process.exit(1);
}

if (!toRecipient) {
  console.error("❌ Error: Recipient email address is required.");
  console.log("Usage: pnpm test:email <recipient-email>");
  console.log("Example: pnpm test:email recipient@example.com");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function main() {
  console.log(`Sending test email to ${toRecipient}...`);
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toRecipient,
      subject: "ZUVA Scholar Hub - Resend API Integration Test",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
          <h2 style="color: #18181b; margin-top: 0;">Resend API Test</h2>
          <p style="color: #3f3f46;">
            This is a test email sent from <strong>ZUVA Scholar Hub</strong> to verify that your Resend API key and domain configuration are working correctly.
          </p>
          <div style="background-color: #f4f4f5; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #27272a;">
            Timestamp: ${new Date().toISOString()}<br/>
            Sender: ${fromEmail}
          </div>
          <p style="color: #71717a; font-size: 13px; margin-bottom: 0; margin-top: 16px;">
            If you received this email, your Resend API setup is operational.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("\n❌ Resend API Error:", error);
      process.exit(1);
    }

    console.log("\n✅ Email sent successfully!");
    console.log("Response Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("\n❌ Unexpected Exception:", err);
    process.exit(1);
  }
}

main();
