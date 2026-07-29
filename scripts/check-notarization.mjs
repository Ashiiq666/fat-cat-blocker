// Preflight for notarized macOS builds.
// Answers one question: will `npm run dist:mac` produce a build that opens
// cleanly on someone else's Mac, or one that shows the malware warning?
//
//   npm run check:notarize

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => console.log(`  ✗ ${m}`);
const info = (m) => console.log(`    ${m}`);

let ready = true;

console.log("\nNotarization preflight\n");

// 1. Developer ID certificate — NOT the same as "Apple Development".
console.log("Signing certificate");
let identities = "";
try {
  identities = execFileSync("security", ["find-identity", "-v", "-p", "codesigning"], {
    encoding: "utf8",
  });
} catch {
  /* handled below */
}
if (/Developer ID Application/.test(identities)) {
  ok('"Developer ID Application" certificate found');
} else {
  ready = false;
  bad('no "Developer ID Application" certificate');
  if (/Apple Development/.test(identities)) {
    info('You have an "Apple Development" cert — that is for local dev only.');
    info("It cannot distribute to other Macs. You need a Developer ID cert,");
    info("which requires Apple Developer Program membership ($99/yr).");
  }
}

// 2. Credentials for Apple's notary service (env vars, never committed).
console.log("\nNotary credentials");
const appleId = process.env.APPLE_ID;
const appPw = process.env.APPLE_APP_SPECIFIC_PASSWORD;
const teamId = process.env.APPLE_TEAM_ID;
const apiKey = process.env.APPLE_API_KEY;
const apiKeyId = process.env.APPLE_API_KEY_ID;
const apiIssuer = process.env.APPLE_API_ISSUER;

if (appleId && appPw && teamId) {
  ok(`Apple ID credentials set (${appleId}, team ${teamId})`);
} else if (apiKey && apiKeyId && apiIssuer) {
  ok("App Store Connect API key credentials set");
} else {
  ready = false;
  bad("no notary credentials in the environment");
  info("Set either:");
  info("  APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID");
  info("or:");
  info("  APPLE_API_KEY, APPLE_API_KEY_ID, APPLE_API_ISSUER");
  info("The password must be an app-specific password from");
  info("appleid.apple.com — NOT your normal Apple ID password.");
}

// 3. Entitlements — without these a notarized Electron app crashes on launch.
console.log("\nHardened-runtime entitlements");
if (existsSync(join(root, "build/entitlements.mac.plist"))) {
  ok("build/entitlements.mac.plist present");
} else {
  ready = false;
  bad("build/entitlements.mac.plist missing (V8 JIT will be blocked)");
}

// 4. notarytool — ships with Xcode 13+.
console.log("\nTooling");
try {
  execFileSync("xcrun", ["--find", "notarytool"], { stdio: "pipe" });
  ok("notarytool available");
} catch {
  ready = false;
  bad("notarytool not found (needs Xcode 13+ / current command line tools)");
}

console.log(
  ready
    ? "\nReady — `npm run dist:mac` will sign and notarize.\n"
    : "\nNot ready — builds still work, but stay unnotarized and will show\nthe security warning on other Macs. See NOTARIZATION.md.\n"
);
process.exit(0);
