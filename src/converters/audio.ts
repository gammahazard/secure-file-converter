// ─────────────────────────────────────────────────────────────
// Audio format definitions — self-registering.
//
// Importing this module registers all audio formats with the
// converter registry. Supports: MP3, WAV, OGG, AAC, FLAC, M4A.
// ─────────────────────────────────────────────────────────────

import type { FormatInfo } from "./types";
import { registerFormat } from "./registry";

// ── Output presets ───────────────────────────────────────────

const MP3: FormatInfo = {
    label: "MP3", extension: "mp3", mime: "audio/mpeg",
    ffmpegFlags: ["-codec:a", "libmp3lame", "-q:a", "2"], category: "audio",
};

const WAV: FormatInfo = {
    label: "WAV", extension: "wav", mime: "audio/wav",
    ffmpegFlags: ["-codec:a", "pcm_s16le"], category: "audio",
};

const OGG: FormatInfo = {
    label: "OGG", extension: "ogg", mime: "audio/ogg",
    ffmpegFlags: ["-codec:a", "libvorbis", "-q:a", "6"], category: "audio",
};

const AAC: FormatInfo = {
    label: "AAC", extension: "aac", mime: "audio/aac",
    ffmpegFlags: ["-codec:a", "aac", "-b:a", "192k"], category: "audio",
};

const FLAC: FormatInfo = {
    label: "FLAC", extension: "flac", mime: "audio/flac",
    ffmpegFlags: ["-codec:a", "flac"], category: "audio",
};

const M4A: FormatInfo = {
    label: "M4A", extension: "m4a", mime: "audio/mp4",
    ffmpegFlags: ["-codec:a", "aac", "-b:a", "192k"], category: "audio",
};

// ── Register inputs ──────────────────────────────────────────

registerFormat("audio/mpeg", {
    label: "MP3", mime: "audio/mpeg", extensions: ["mp3"],
    category: "audio", outputs: [WAV, OGG, AAC, FLAC, M4A],
});

registerFormat("audio/wav", {
    label: "WAV", mime: "audio/wav", extensions: ["wav"],
    category: "audio", outputs: [MP3, OGG, AAC, FLAC, M4A],
});

registerFormat("audio/ogg", {
    label: "OGG", mime: "audio/ogg", extensions: ["ogg"],
    category: "audio", outputs: [MP3, WAV, AAC, FLAC, M4A],
});

registerFormat("audio/aac", {
    label: "AAC", mime: "audio/aac", extensions: ["aac"],
    category: "audio", outputs: [MP3, WAV, OGG, FLAC, M4A],
});

registerFormat("audio/flac", {
    label: "FLAC", mime: "audio/flac", extensions: ["flac"],
    category: "audio", outputs: [MP3, WAV, OGG, AAC, M4A],
});

registerFormat("audio/mp4", {
    label: "M4A", mime: "audio/mp4", extensions: ["m4a"],
    category: "audio", outputs: [MP3, WAV, OGG, AAC, FLAC],
});
