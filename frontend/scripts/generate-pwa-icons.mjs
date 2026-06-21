import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve } from "path";

const publicDir = resolve(import.meta.dirname, "../public");
const bg = "#D4AF37"; // Brand gold

const sizes = [
  { size: 192, name: "pwa-192x192.png" },
  { size: 512, name: "pwa-512x512.png" },
];

async function main() {
  for (const { size, name } of sizes) {
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.125)}" fill="${bg}"/>
      <text x="${size / 2}" y="${size * 0.56}" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold" font-size="${size * 0.45}">B</text>
      <text x="${size / 2}" y="${size * 0.82}" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="300" font-size="${size * 0.12}">BOOTSKILLS</text>
    </svg>`;

    await sharp(Buffer.from(svg)).png().toFile(resolve(publicDir, name));
    console.log(`  ✅ Generated ${name} (${size}x${size})`);
  }
}

main().catch(console.error);
