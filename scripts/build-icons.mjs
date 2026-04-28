// Generate platform icons from build/icon.svg.
// Output:
//   build/icon.png      (1024x1024 — used by electron-builder for all platforms)
//   build/icons/*.png   (sizes for .icns / .ico generation by electron-builder)

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const buildDir = join(root, "build");
const iconsDir = join(buildDir, "icons");
const svg = join(buildDir, "icon.svg");

await mkdir(iconsDir, { recursive: true });

const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

for (const size of sizes) {
  const out = join(iconsDir, `${size}x${size}.png`);
  await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
  console.log(`✓ ${out}`);
}

// Main icon — electron-builder picks this up by default for all platforms.
const main = join(buildDir, "icon.png");
await sharp(svg).resize(1024, 1024).png({ compressionLevel: 9 }).toFile(main);
console.log(`✓ ${main}`);

// Tray-friendly small PNG too.
await sharp(svg)
  .resize(32, 32)
  .png({ compressionLevel: 9 })
  .toFile(join(buildDir, "tray.png"));

console.log("\nDone. electron-builder will derive .icns and .ico from these.");
