import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(repoRoot, "brand/icon.svg"));
const outDir = join(repoRoot, "public/icons");
mkdirSync(outDir, { recursive: true });

const targets = [
  ["icon-192.png", 192], ["icon-512.png", 512], ["icon-512-maskable.png", 512],
  ["apple-touch-icon.png", 180], ["favicon.png", 64],
];

for (const [name, size] of targets) {
  await sharp(svg).resize(size, size).png().toFile(join(outDir, name));
  console.log("✓", name);
}
