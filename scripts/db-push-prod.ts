import { execSync } from "child_process";

process.env.ENV_FILE = ".env.production";
execSync("npx drizzle-kit push --force", { stdio: "inherit", env: process.env });
