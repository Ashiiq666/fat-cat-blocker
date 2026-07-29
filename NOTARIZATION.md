# Notarizing Catnap for macOS

Goal: a `.dmg` that opens on anyone's Mac with **no security warning**.

Without notarization, macOS shows *"Apple could not verify 'Catnap' is free of
malware…"* and most people give up there. AirDrop, Drive, and any download add a
quarantine flag that triggers the strictest check.

Run the preflight any time to see where you stand:

```bash
npm run check:notarize
```

## What's already done

The repo is fully configured — no code changes needed when you enrol:

- `hardenedRuntime: true` (required for notarization)
- `build/entitlements.mac.plist` — allows V8's JIT. **Without this a notarized
  Electron app crashes on launch**, so it's easy to get wrong.
- `mac.notarize.teamId: 4R9MW26LLH`
- Builds without credentials still succeed; they're just left unnotarized.

## One-time setup

### 1. Join the Apple Developer Program — $99/year

<https://developer.apple.com/programs/> — approval usually takes 24–48 hours.

There is no free alternative. Apple only issues distribution certificates to
paying members, and only notarizes builds signed with one.

### 2. Create a "Developer ID Application" certificate

**This is a different certificate from the "Apple Development" one you already
have.** That one is for running on your own registered machines; it can never
distribute to other people's Macs.

Easiest route — Xcode → Settings → Accounts → select your team →
**Manage Certificates…** → **+** → **Developer ID Application**.

Verify:

```bash
security find-identity -v -p codesigning
```

You want a line containing `Developer ID Application: … (4R9MW26LLH)`.

### 3. Create an app-specific password

<https://appleid.apple.com> → Sign-In and Security → App-Specific Passwords → **+**

**Not your normal Apple ID password** — notarization rejects that. You get a
value like `abcd-efgh-ijkl-mnop`.

### 4. Export credentials

Add to `~/.zshrc` (then `source ~/.zshrc`):

```bash
export APPLE_ID="afeef@latelogic.com"
export APPLE_APP_SPECIFIC_PASSWORD="abcd-efgh-ijkl-mnop"
export APPLE_TEAM_ID="4R9MW26LLH"
```

Keep these out of git — they're account credentials. `.env` is already ignored
if you'd rather keep them there and source it manually.

## Building

```bash
npm run check:notarize   # expect all ✓
npm run dist:mac
```

Notarization adds **5–15 minutes** — the build uploads to Apple, waits for the
malware scan, then staples the ticket to the DMG. That's normal, not a hang.

## Verifying before you share

The real test — this is what your friend's Mac runs:

```bash
spctl -a -vvv --type execute "release/mac-universal/Catnap.app"
```

- `accepted` + `source=Notarized Developer ID` → ships clean ✓
- `rejected` → still unnotarized ✗

Confirm the ticket is stapled (so it validates offline too):

```bash
xcrun stapler validate "release/Catnap-0.1.0-universal.dmg"
```

## Until you enrol

Recipients can trust the app manually: open it, dismiss the warning, then
**System Settings → Privacy & Security** → **Open Anyway** next to the Catnap
message.

On macOS 15+, right-click → Open no longer works for unnotarized apps — it has
to be the Privacy & Security panel.

## Windows

Same class of problem: SmartScreen warns because the `.exe` is unsigned. It
needs a separate OV/EV code-signing certificate (~$200–400/yr from Sectigo,
DigiCert, etc.). Users can bypass with **More info → Run anyway**.
