#!/usr/bin/env node

/**
 * check-language-config-sync.js
 *
 * Ensures that frontend/src/shared/languageConfig.ts and
 * backend/src/config/languageConfig.ts have identical keys for
 * LANGUAGE_NAMES, LANGUAGE_COLORS, and DEFAULT_INITIAL_CODE.
 *
 * These configs must be kept in sync because the frontend cannot
 * import from the backend at build time (Docker context restriction).
 *
 * Usage: node scripts/check-language-config-sync.js
 */

const fs = require("fs");
const path = require("path");

const FRONTEND_FILE = path.resolve(
  __dirname,
  "..",
  "frontend/src/shared/languageConfig.ts"
);
const BACKEND_FILE = path.resolve(
  __dirname,
  "..",
  "backend/src/config/languageConfig.ts"
);

const EXPORTS_TO_CHECK = ["LANGUAGE_NAMES", "LANGUAGE_COLORS", "DEFAULT_INITIAL_CODE"];

/**
 * Extract the keys of a named exported object from a TypeScript source file.
 * Uses a simple regex: finds `export const NAME: Record<...> = { ... };`
 * and extracts the keys from the object literal.
 */
function extractKeys(source, exportName) {
  // Match: export const NAME : Record<...> = { ... };
  // We capture everything between the first { and the matching closing }
  const regex = new RegExp(
    `export\\s+const\\s+${exportName}\\s*:\\s*Record\\s*<[^>]+>\\s*=\\s*\\{`,
    "s"
  );
  const match = source.match(regex);
  if (!match) {
    return null;
  }

  const startIndex = match.index + match[0].length;
  let depth = 1;
  let endIndex = startIndex;

  for (let i = startIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  const body = source.slice(startIndex, endIndex);

  // Extract all key names (quoted or unquoted identifiers)
  const keyRegex = /^\s*(?:\/\/.*$)?\s*(?:'[^']*'|"[^"]*"|(\w+))\s*:/gm;
  const keys = [];
  let keyMatch;
  while ((keyMatch = keyRegex.exec(body)) !== null) {
    // keyMatch[1] is the unquoted group, or full match if quoted
    let key = keyMatch[1];
    if (!key) {
      // It was a quoted string key, extract without quotes
      const quoted = keyMatch[0].trim().split(":")[0].trim();
      key = quoted.replace(/^['"]|['"]$/g, "");
    }
    // Skip indentation-only or comment-only lines
    if (key && key !== "}" && key !== ";") {
      keys.push(key);
    }
  }

  return keys.sort();
}

function main() {
  let exitCode = 0;
  const errors = [];

  const frontendSource = fs.readFileSync(FRONTEND_FILE, "utf-8");
  const backendSource = fs.readFileSync(BACKEND_FILE, "utf-8");

  for (const exportName of EXPORTS_TO_CHECK) {
    const frontendKeys = extractKeys(frontendSource, exportName);
    const backendKeys = extractKeys(backendSource, exportName);

    if (!frontendKeys) {
      errors.push(`✗ ${exportName}: not found in frontend/src/shared/languageConfig.ts`);
      exitCode = 1;
      continue;
    }
    if (!backendKeys) {
      errors.push(`✗ ${exportName}: not found in backend/src/config/languageConfig.ts`);
      exitCode = 1;
      continue;
    }

    // Compare keys
    if (JSON.stringify(frontendKeys) !== JSON.stringify(backendKeys)) {
      const onlyFrontend = frontendKeys.filter((k) => !backendKeys.includes(k));
      const onlyBackend = backendKeys.filter((k) => !frontendKeys.includes(k));

      errors.push(`✗ ${exportName}: keys are out of sync!`);
      if (onlyFrontend.length > 0) {
        errors.push(`    In frontend only: ${onlyFrontend.join(", ")}`);
      }
      if (onlyBackend.length > 0) {
        errors.push(`    In backend only: ${onlyBackend.join(", ")}`);
      }
      exitCode = 1;
    } else {
      console.log(`✓ ${exportName}: ${frontendKeys.length} keys match`);
    }
  }

  if (errors.length > 0) {
    console.log("\n❌ Language configs are out of sync!");
    console.log(
      "\n  When you add or remove a language, you must update BOTH files:"
    );
    console.log("    - frontend/src/shared/languageConfig.ts");
    console.log("    - backend/src/config/languageConfig.ts");
    console.log("");
    for (const err of errors) {
      console.log(err);
    }
  } else {
    console.log("\n✅ All language configs are in sync!");
  }

  process.exit(exitCode);
}

main();
