import fs from "node:fs";
import path from "node:path";

// Load .env.local
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

async function testReset() {
  const { auth } = await import("../lib/auth");
  const { db } = await import("../lib/db");
  const { emailLog } = await import("../lib/db/schema");

  console.log("Requesting password reset for ncbphilani@gmail.com...");
  const res = await auth.api.requestPasswordReset({
    body: {
      email: "ncbphilani@gmail.com",
      redirectTo: "http://localhost:3000/reset-password",
    },
  });

  console.log("Auth API Response:", res);

  // Wait 2 seconds for background email task to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const logs = await db.select().from(emailLog);
  console.log("Email Log entries in DB:", logs);
}

testReset().catch(console.error);
