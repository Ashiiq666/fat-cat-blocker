// electron-builder config.
//
// Everything lives in package.json "build" — this wrapper exists only to add
// notarization *conditionally*. electron-builder 26 fails config validation if
// `mac.notarize` is present without credentials in the environment, so the
// block can't simply live in package.json: it would break every build made
// before enrolling in the Apple Developer Program (and every CI build).
//
// With credentials  -> sign + notarize, opens cleanly on any Mac.
// Without           -> normal signed build, unnotarized (security warning).
//
// See NOTARIZATION.md. Check readiness with: npm run check:notarize

const base = require("./package.json").build;

const hasAppleIdCreds =
  !!process.env.APPLE_ID &&
  !!process.env.APPLE_APP_SPECIFIC_PASSWORD &&
  !!process.env.APPLE_TEAM_ID;

const hasApiKeyCreds =
  !!process.env.APPLE_API_KEY &&
  !!process.env.APPLE_API_KEY_ID &&
  !!process.env.APPLE_API_ISSUER;

const hasKeychainCreds =
  !!process.env.APPLE_KEYCHAIN && !!process.env.APPLE_KEYCHAIN_PROFILE;

const canNotarize = hasAppleIdCreds || hasApiKeyCreds || hasKeychainCreds;

if (process.platform === "darwin") {
  console.log(
    canNotarize
      ? "• notarization ENABLED (credentials found) — adds 5-15 min"
      : "• notarization SKIPPED (no credentials) — build will show the security warning on other Macs"
  );
}

module.exports = {
  ...base,
  mac: {
    ...base.mac,
    ...(canNotarize
      ? { notarize: { teamId: process.env.APPLE_TEAM_ID || "4R9MW26LLH" } }
      : {}),
  },
};
