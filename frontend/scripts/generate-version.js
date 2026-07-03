#!/usr/bin/env node

/**
 * Generates a version.json file in the dist folder at build time.
 * This is used by the frontend's useVersionCheck hook to detect
 * when a new deployment is available and prompt users to refresh.
 *
 * The file contains:
 *   - hash:      short git commit hash (or fallback timestamp)
 *   - timestamp: Unix ms when this build ran
 *   - buildTime: human-readable ISO string
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get git commit hash
let commitHash;
try {
  commitHash = execSync("git rev-parse --short HEAD", {
    encoding: "utf-8",
    timeout: 5000,
  }).trim();
} catch {
  commitHash = Date.now().toString(36);
}

const now = new Date();
const version = {
  hash: commitHash,
  timestamp: now.getTime(),
  buildTime: now.toISOString(),
  buildTimeLocal: now.toLocaleString(),
};

const distPath = path.join(__dirname, "..", "dist");

if (!fs.existsSync(distPath)) {
  console.error("❌ dist directory not found. Run npm run build first.");
  process.exit(1);
}

const outputPath = path.join(distPath, "version.json");
fs.writeFileSync(outputPath, JSON.stringify(version, null, 2));
console.log(
  `📦 Version file generated: ${version.buildTime} (${version.hash}) — local: ${version.buildTimeLocal}`
);
