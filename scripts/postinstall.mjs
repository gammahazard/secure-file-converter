// ─────────────────────────────────────────────────────────────
// postinstall.mjs — fetches FFmpeg.wasm core files into public/
//
// This script runs automatically after `npm install`. It
// downloads ffmpeg-core.js and ffmpeg-core.wasm from the
// @ffmpeg/core package so the browser can load them at runtime.
//
// The files are NOT committed to git (see .gitignore).
// ─────────────────────────────────────────────────────────────

import { existsSync, mkdirSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const targetDir = resolve(__dirname, "..", "public", "ffmpeg");

// Ensure target directory exists
if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
}

// Resolve the @ffmpeg/core package entry point, then find sibling files
const coreDir = dirname(require.resolve("@ffmpeg/core"));

const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

for (const file of files) {
    const src = resolve(coreDir, file);
    const dest = resolve(targetDir, file);

    if (!existsSync(src)) {
        console.error(`❌  Missing ${file} in @ffmpeg/core at ${src}`);
        console.error("    Try: npm install @ffmpeg/core@0.12.10");
        process.exit(1);
    }

    copyFileSync(src, dest);
    console.log(`✅  Copied ${file} → public/ffmpeg/`);
}

console.log("\n🎉  FFmpeg WASM core files are ready.\n");
