// ─────────────────────────────────────────────────────────────
// Video format definitions — self-registering.
//
// Importing this module registers all video formats with the
// converter registry. Supports: MP4, WebM, MOV, AVI, MKV, GIF.
//
// NOTE: FFmpeg.wasm v0.12 uses a single-threaded build so
// conversions on large videos will be slow. The 50 MB limit
// keeps this practical for browser memory.
// ─────────────────────────────────────────────────────────────

import type { FormatInfo } from "./types";
import { registerFormat } from "./registry";

// ── Output presets ───────────────────────────────────────────

const MP4: FormatInfo = {
    label: "MP4", extension: "mp4", mime: "video/mp4",
    ffmpegFlags: ["-codec:v", "libx264", "-preset", "fast", "-crf", "23",
        "-codec:a", "aac", "-b:a", "128k"], category: "video",
};

const WEBM: FormatInfo = {
    label: "WebM", extension: "webm", mime: "video/webm",
    ffmpegFlags: ["-codec:v", "libvpx", "-crf", "30", "-b:v", "0",
        "-codec:a", "libvorbis"], category: "video",
};

const MOV: FormatInfo = {
    label: "MOV", extension: "mov", mime: "video/quicktime",
    ffmpegFlags: ["-codec:v", "libx264", "-preset", "fast", "-crf", "23",
        "-codec:a", "aac", "-b:a", "128k"], category: "video",
};

const AVI: FormatInfo = {
    label: "AVI", extension: "avi", mime: "video/x-msvideo",
    // mpeg4 + MP3 — the most compatible AVI codec combination.
    // Capped at 1920px wide to keep output small enough for WASM
    // memory. -flush_packets 1 (in useFFmpeg) prevents corruption.
    ffmpegFlags: ["-vf", "scale=1920:-2:force_original_aspect_ratio=decrease,crop=trunc(iw/2)*2:trunc(ih/2)*2",
        "-codec:v", "mpeg4", "-q:v", "3",
        "-codec:a", "libmp3lame", "-q:a", "2"], category: "video",
};

const MKV: FormatInfo = {
    label: "MKV", extension: "mkv", mime: "video/x-matroska",
    ffmpegFlags: ["-codec:v", "libx264", "-preset", "fast", "-crf", "23",
        "-codec:a", "aac", "-b:a", "128k"], category: "video",
};

const GIF_VIDEO: FormatInfo = {
    label: "GIF", extension: "gif", mime: "image/gif",
    ffmpegFlags: ["-vf", "fps=15,scale=480:-1:flags=lanczos",
        "-loop", "0"], category: "video",
};

// ── Register inputs ──────────────────────────────────────────

registerFormat("video/mp4", {
    label: "MP4", mime: "video/mp4", extensions: ["mp4"],
    category: "video", outputs: [WEBM, MOV, AVI, MKV, GIF_VIDEO],
});

registerFormat("video/webm", {
    label: "WebM", mime: "video/webm", extensions: ["webm"],
    category: "video", outputs: [MP4, MOV, AVI, MKV, GIF_VIDEO],
});

registerFormat("video/quicktime", {
    label: "MOV", mime: "video/quicktime", extensions: ["mov"],
    category: "video", outputs: [MP4, WEBM, AVI, MKV, GIF_VIDEO],
});

registerFormat("video/x-msvideo", {
    label: "AVI", mime: "video/x-msvideo", extensions: ["avi"],
    category: "video", outputs: [MP4, WEBM, MOV, MKV, GIF_VIDEO],
});

registerFormat("video/x-matroska", {
    label: "MKV", mime: "video/x-matroska", extensions: ["mkv"],
    category: "video", outputs: [MP4, WEBM, MOV, AVI, GIF_VIDEO],
});

// GIF is treated as video (animated) — can convert to/from video formats
registerFormat("image/gif", {
    label: "GIF", mime: "image/gif", extensions: ["gif"],
    category: "video", outputs: [MP4, WEBM, MOV, AVI, MKV],
});
