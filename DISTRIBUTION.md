# Distribution Guide

How to ship Fat Cat Blocker to real users on macOS, Windows, and Linux.

---

## TL;DR

| Goal | Command |
|---|---|
| Build local unsigned macOS `.dmg` | `CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac` |
| Build local Windows `.exe` *(needs Wine on macOS or run on a PC)* | `CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:win` |
| Build everything via CI | Push a tag `v0.1.0` → GitHub Actions runs all three builds in parallel and publishes a Release |

The output of every build lands in `release/`.

---

## What gets produced

| Platform | File | Notes |
|---|---|---|
| macOS | `Fat Cat Blocker-<v>-universal.dmg` | Universal: runs on Intel + Apple Silicon natively |
| macOS | `Fat Cat Blocker-<v>-universal.zip` | Same, zipped (auto-update friendly) |
| Windows | `Fat Cat Blocker Setup <v>.exe` | NSIS installer; user picks install dir |
| Windows | `Fat Cat Blocker <v>.exe` | Portable single-file `.exe` (no install) |
| Linux | `Fat Cat Blocker-<v>.AppImage` | Run anywhere, no install |

---

## Building locally

### macOS (works out of the box)

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac
```

Produces an unsigned `.dmg` and `.zip` in `release/`. Double-click the `.dmg`,
drag the cat into `/Applications`, then **right-click → Open** the first time
(macOS Gatekeeper warning, one-time bypass for unsigned apps).

### Windows (requires Wine if building on macOS)

On a Windows machine: `npm run dist:win` works directly.

On macOS (Apple Silicon especially): cross-building Windows installers
needs Wine. It's flaky. Use GitHub Actions instead unless you have a Windows
machine handy.

### Linux

```bash
npm run dist:linux
```

Produces an `AppImage`. Make it executable: `chmod +x release/*.AppImage`.

---

## Building via GitHub Actions (recommended)

The repo includes `.github/workflows/release.yml` which builds for **all
three OSes in parallel** without you needing Wine, a Windows VM, or a
second machine.

### One-time setup

1. Push the project to a GitHub repo
2. *(Optional, for signed builds — see below)* add the signing secrets

### Cutting a release

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions runs the workflow, builds for macOS / Windows / Linux,
then publishes a GitHub Release with all three installers attached.

You can also run the workflow manually from the Actions tab → Release →
"Run workflow" (no Release published, but artifacts are downloadable).

---

## Code signing (production-grade builds)

Unsigned builds work but show scary warnings. To ship a signed,
notarized app:

### macOS — Apple Developer ID

You need:
- **Apple Developer Program** membership ($99/yr)
- A **Developer ID Application** certificate exported as `.p12`
- An **app-specific password** for notarization

Add as GitHub repo secrets:

| Secret | What |
|---|---|
| `CSC_LINK` | base64-encoded `.p12` cert: `base64 -i cert.p12 \| pbcopy` |
| `CSC_KEY_PASSWORD` | password you set on the `.p12` |
| `APPLE_ID` | your Apple Developer email |
| `APPLE_APP_SPECIFIC_PASSWORD` | from appleid.apple.com → Sign-In Security |
| `APPLE_TEAM_ID` | 10-char team ID from developer.apple.com |

Then in `.github/workflows/release.yml`, change the env block under
"Build installer":

```yaml
env:
  CSC_LINK: ${{ secrets.CSC_LINK }}
  CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

Remove the `CSC_IDENTITY_AUTO_DISCOVERY: false` line.

### Windows — Code Signing Certificate

You need a **Windows code-signing certificate** (any reputable CA — DigiCert,
Sectigo, etc., ~$200-400/yr). Export as `.pfx`.

| Secret | What |
|---|---|
| `WIN_CSC_LINK` | base64-encoded `.pfx`: `base64 -i cert.pfx \| pbcopy` |
| `WIN_CSC_KEY_PASSWORD` | password on the `.pfx` |

electron-builder picks these up automatically when present in env.

---

## Auto-updates (optional, future)

Drop in [`electron-updater`](https://www.electron.build/auto-update) and
publish releases to GitHub. App checks the latest release on startup,
downloads + installs in the background. ~30 minutes of work to wire up
when ready.

---

## Permissions on macOS

The app does **not** require special accessibility permissions — it uses
only standard Electron window APIs (alwaysOnTop, kiosk, simpleFullScreen).
No prompts on first run.

The kiosk overlay covers normal apps and apps in macOS native fullscreen.
It does **not** override:

- **Cmd+Opt+Esc** Force Quit dialog (OS-reserved)
- **Activity Monitor** "Force Quit Process"
- **Touch ID** / power button

This is the same ceiling Stretchly, Time Out, and BreakTimer hit. Apple
reserves these by design.
