// ─────────────────────────────────────────────────────────────
// Image format definitions — self-registering.
//
// Importing this module registers all image formats with the
// central converter registry. Supports: PNG, JPG, WebP, BMP,
// TIFF, ICO, TGA.
// ─────────────────────────────────────────────────────────────

import type { FormatInfo } from "./types";
import { registerFormat } from "./registry";

// ── Output presets ───────────────────────────────────────────

const PNG: FormatInfo = {
    label: "PNG", extension: "png", mime: "image/png",
    ffmpegFlags: ["-frames:v", "1", "-update", "1"], category: "image",
};

const JPG: FormatInfo = {
    label: "JPG", extension: "jpg", mime: "image/jpeg",
    ffmpegFlags: ["-frames:v", "1", "-update", "1", "-q:v", "2"], category: "image",
};

const WEBP: FormatInfo = {
    label: "WebP", extension: "webp", mime: "image/webp",
    ffmpegFlags: ["-frames:v", "1", "-update", "1", "-quality", "90"], category: "image",
};

const BMP: FormatInfo = {
    label: "BMP", extension: "bmp", mime: "image/bmp",
    ffmpegFlags: ["-frames:v", "1", "-update", "1"], category: "image",
};

const TIFF: FormatInfo = {
    label: "TIFF", extension: "tiff", mime: "image/tiff",
    ffmpegFlags: ["-frames:v", "1", "-update", "1"], category: "image",
};

const ICO: FormatInfo = {
    label: "ICO", extension: "ico", mime: "image/x-icon",
    ffmpegFlags: ["-frames:v", "1", "-update", "1"], category: "image",
};

const TGA: FormatInfo = {
    label: "TGA", extension: "tga", mime: "image/x-tga",
    ffmpegFlags: ["-frames:v", "1", "-update", "1"], category: "image",
};

// ── Register inputs ──────────────────────────────────────────

registerFormat("image/png", {
    label: "PNG", mime: "image/png", extensions: ["png"],
    category: "image", outputs: [JPG, WEBP, BMP, TIFF, ICO, TGA],
});

registerFormat("image/jpeg", {
    label: "JPEG", mime: "image/jpeg", extensions: ["jpg", "jpeg"],
    category: "image", outputs: [PNG, WEBP, BMP, TIFF, ICO, TGA],
});

registerFormat("image/webp", {
    label: "WebP", mime: "image/webp", extensions: ["webp"],
    category: "image", outputs: [PNG, JPG, BMP, TIFF, TGA],
});

registerFormat("image/bmp", {
    label: "BMP", mime: "image/bmp", extensions: ["bmp"],
    category: "image", outputs: [PNG, JPG, WEBP, TIFF, TGA],
});

registerFormat("image/tiff", {
    label: "TIFF", mime: "image/tiff", extensions: ["tiff", "tif"],
    category: "image", outputs: [PNG, JPG, WEBP, BMP, TGA],
});

registerFormat("image/x-tga", {
    label: "TGA", mime: "image/x-tga", extensions: ["tga"],
    category: "image", outputs: [PNG, JPG, WEBP, BMP, TIFF],
});

registerFormat("image/x-icon", {
    label: "ICO", mime: "image/x-icon", extensions: ["ico"],
    category: "image", outputs: [PNG, JPG, WEBP, BMP, TIFF, TGA],
});
