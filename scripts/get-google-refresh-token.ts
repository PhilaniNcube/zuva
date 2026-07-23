import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("❌ Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in .env.local");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
});

console.log("\n========================================================");
console.log("👉 STEP 1: Make sure 'http://localhost:3333/callback'");
console.log("   is added to Authorized redirect URIs in Google Cloud Console.");
console.log("--------------------------------------------------------");
console.log("👉 STEP 2: Open this URL in your browser to sign in:\n");
console.log(authUrl);
console.log("\nWaiting for authorization callback on http://localhost:3333/callback ...");
console.log("========================================================\n");

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || "/", `http://localhost:${PORT}`);
    const code = reqUrl.searchParams.get("code");

    if (code) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <div style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #16a34a;">✅ Authorization Successful!</h2>
          <p>Your refresh token has been retrieved and saved to <code>.env.local</code>.</p>
          <p>You can close this window now.</p>
        </div>
      `);

      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        console.error("\n⚠️ No refresh token returned. (If you already authorized previously, revoke access at https://myaccount.google.com/permissions and retry).");
        server.close();
        process.exit(1);
      }

      console.log("\n🎉 Received Refresh Token!");

      // Update .env.local
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf-8");
        if (envContent.includes("GOOGLE_REFRESH_TOKEN=")) {
          envContent = envContent.replace(
            /GOOGLE_REFRESH_TOKEN=.*/,
            `GOOGLE_REFRESH_TOKEN="${refreshToken}"`
          );
        } else {
          envContent += `\nGOOGLE_REFRESH_TOKEN="${refreshToken}"\n`;
        }
        fs.writeFileSync(envPath, envContent, "utf-8");
        console.log("✅ Successfully saved GOOGLE_REFRESH_TOKEN to .env.local!\n");
      }

      server.close();
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Error exchanging token:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Authentication error. Check terminal logs.");
    server.close();
    process.exit(1);
  }
});

server.listen(PORT);
