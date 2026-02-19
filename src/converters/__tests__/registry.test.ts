// ─────────────────────────────────────────────────────────────
// Converter Registry — unit tests
//
// Tests the self-registering format registry: lookups,
// MIME mappings, format relationships, and edge cases.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import {
    getInputFormat,
    getOutputFormat,
    getAcceptedMimes,
    MAX_FILE_SIZE,
    MAX_FILE_SIZE_LABEL,
} from "@/converters";

// ── Registration completeness ──────────────────────────────

describe("Format Registration", () => {
    const expectedMimes = [
        // Images
        "image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff", "image/gif",
        // Audio
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/flac", "audio/mp4",
        // Video
        "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska",
    ];

    it("registers all 17 expected MIME types", () => {
        const accepted = getAcceptedMimes();
        for (const mime of expectedMimes) {
            expect(accepted).toContain(mime);
        }
    });

    it("getAcceptedMimes returns at least 17 entries", () => {
        expect(getAcceptedMimes().length).toBeGreaterThanOrEqual(17);
    });
});

// ── Image formats ──────────────────────────────────────────

describe("Image Formats", () => {
    it("looks up PNG by MIME type", () => {
        const fmt = getInputFormat("image/png");
        expect(fmt).toBeDefined();
        expect(fmt!.label).toBe("PNG");
        expect(fmt!.category).toBe("image");
        expect(fmt!.extensions).toContain("png");
    });

    it("looks up JPEG by MIME type", () => {
        const fmt = getInputFormat("image/jpeg");
        expect(fmt).toBeDefined();
        expect(fmt!.label).toBe("JPEG");
        expect(fmt!.extensions).toContain("jpg");
        expect(fmt!.extensions).toContain("jpeg");
    });

    it("PNG cannot convert to PNG (excludes self)", () => {
        const fmt = getInputFormat("image/png");
        const selfOutput = fmt!.outputs.find((o) => o.extension === "png");
        expect(selfOutput).toBeUndefined();
    });

    it("PNG can convert to JPG, WebP, BMP, TIFF, ICO", () => {
        const fmt = getInputFormat("image/png");
        const outputExts = fmt!.outputs.map((o) => o.extension);
        expect(outputExts).toContain("jpg");
        expect(outputExts).toContain("webp");
        expect(outputExts).toContain("bmp");
        expect(outputExts).toContain("tiff");
        expect(outputExts).toContain("ico");
    });

    it("GIF input can convert to multiple image formats", () => {
        const fmt = getInputFormat("image/gif");
        expect(fmt).toBeDefined();
        expect(fmt!.outputs.length).toBeGreaterThanOrEqual(4);
    });
});

// ── Audio formats ──────────────────────────────────────────

describe("Audio Formats", () => {
    it("looks up MP3 by MIME type", () => {
        const fmt = getInputFormat("audio/mpeg");
        expect(fmt).toBeDefined();
        expect(fmt!.label).toBe("MP3");
        expect(fmt!.category).toBe("audio");
    });

    it("MP3 can convert to WAV, OGG, AAC, FLAC, M4A", () => {
        const fmt = getInputFormat("audio/mpeg");
        const outputExts = fmt!.outputs.map((o) => o.extension);
        expect(outputExts).toContain("wav");
        expect(outputExts).toContain("ogg");
        expect(outputExts).toContain("aac");
        expect(outputExts).toContain("flac");
        expect(outputExts).toContain("m4a");
    });

    it("all audio outputs have correct category", () => {
        const fmt = getInputFormat("audio/mpeg");
        for (const out of fmt!.outputs) {
            expect(out.category).toBe("audio");
        }
    });

    it("audio outputs have valid MIME types", () => {
        const fmt = getInputFormat("audio/mpeg");
        for (const out of fmt!.outputs) {
            expect(out.mime).toMatch(/^audio\//);
        }
    });
});

// ── Video formats ──────────────────────────────────────────

describe("Video Formats", () => {
    it("looks up MP4 by MIME type", () => {
        const fmt = getInputFormat("video/mp4");
        expect(fmt).toBeDefined();
        expect(fmt!.label).toBe("MP4");
        expect(fmt!.category).toBe("video");
    });

    it("MP4 can convert to WebM, MOV, AVI, MKV, GIF", () => {
        const fmt = getInputFormat("video/mp4");
        const outputExts = fmt!.outputs.map((o) => o.extension);
        expect(outputExts).toContain("webm");
        expect(outputExts).toContain("mov");
        expect(outputExts).toContain("avi");
        expect(outputExts).toContain("mkv");
        expect(outputExts).toContain("gif");
    });

    it("GIF output from video has correct ffmpeg flags", () => {
        const gifOut = getOutputFormat("video/mp4", "gif");
        expect(gifOut).toBeDefined();
        expect(gifOut!.ffmpegFlags).toContain("-vf");
        // Should have fps and scale filter
        const vfArg = gifOut!.ffmpegFlags[gifOut!.ffmpegFlags.indexOf("-vf") + 1];
        expect(vfArg).toContain("fps=15");
        expect(vfArg).toContain("scale=480");
    });
});

// ── getOutputFormat lookups ────────────────────────────────

describe("getOutputFormat", () => {
    it("returns correct FormatInfo for valid input→output", () => {
        const fmt = getOutputFormat("image/png", "jpg");
        expect(fmt).toBeDefined();
        expect(fmt!.label).toBe("JPG");
        expect(fmt!.extension).toBe("jpg");
        expect(fmt!.mime).toBe("image/jpeg");
        expect(fmt!.ffmpegFlags).toContain("-q:v");
    });

    it("returns undefined for invalid MIME type", () => {
        expect(getOutputFormat("application/pdf", "png")).toBeUndefined();
    });

    it("returns undefined for invalid output extension", () => {
        expect(getOutputFormat("image/png", "mp3")).toBeUndefined();
    });

    it("returns undefined for completely bogus inputs", () => {
        expect(getOutputFormat("foo/bar", "baz")).toBeUndefined();
    });
});

// ── FFmpeg flags correctness ───────────────────────────────

describe("FFmpeg Flags", () => {
    it("image outputs include -frames:v 1 -update 1", () => {
        const imageFormats = ["png", "jpg", "webp", "bmp", "tiff", "ico"];
        for (const ext of imageFormats) {
            const fmt = getOutputFormat("image/jpeg", ext) ?? getOutputFormat("image/png", ext);
            if (fmt) {
                expect(fmt.ffmpegFlags).toContain("-frames:v");
                expect(fmt.ffmpegFlags).toContain("1");
                expect(fmt.ffmpegFlags).toContain("-update");
            }
        }
    });

    it("MP3 output uses libmp3lame codec", () => {
        const fmt = getOutputFormat("audio/wav", "mp3");
        expect(fmt!.ffmpegFlags).toContain("libmp3lame");
    });

    it("WAV output uses pcm_s16le codec", () => {
        const fmt = getOutputFormat("audio/mpeg", "wav");
        expect(fmt!.ffmpegFlags).toContain("pcm_s16le");
    });

    it("FLAC output uses flac codec", () => {
        const fmt = getOutputFormat("audio/mpeg", "flac");
        expect(fmt!.ffmpegFlags).toContain("flac");
    });

    it("MP4 video output uses libx264 + aac", () => {
        const fmt = getOutputFormat("video/webm", "mp4");
        expect(fmt!.ffmpegFlags).toContain("libx264");
        expect(fmt!.ffmpegFlags).toContain("aac");
    });

    it("WebM video output uses libvpx + libvorbis", () => {
        const fmt = getOutputFormat("video/mp4", "webm");
        expect(fmt!.ffmpegFlags).toContain("libvpx");
        expect(fmt!.ffmpegFlags).toContain("libvorbis");
    });

    it("all format outputs have non-empty ffmpegFlags", () => {
        const mimes = getAcceptedMimes();
        for (const mime of mimes) {
            const input = getInputFormat(mime);
            for (const out of input!.outputs) {
                expect(out.ffmpegFlags.length).toBeGreaterThan(0);
            }
        }
    });
});

// ── Constants ──────────────────────────────────────────────

describe("Constants", () => {
    it("MAX_FILE_SIZE is 50 MB", () => {
        expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    });

    it("MAX_FILE_SIZE_LABEL is '50 MB'", () => {
        expect(MAX_FILE_SIZE_LABEL).toBe("50 MB");
    });
});
