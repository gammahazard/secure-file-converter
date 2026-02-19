// ─────────────────────────────────────────────────────────────
// Converter Registry — central lookup for all format mappings.
//
// Category modules (image.ts, audio.ts, video.ts) call
// `registerFormat()` at import time to self-register.
// The UI and hook import from here — no hardcoded format lists.
//
// To add a new format:
//   1. Add entries in the relevant category file.
//   2. That's it. The registry picks them up automatically.
// ─────────────────────────────────────────────────────────────

import type { InputFormat, FormatInfo, FormatCategory } from "./types";

/** Internal store: MIME string → InputFormat */
const registry = new Map<string, InputFormat>();

// ── Registration ─────────────────────────────────────────────

/** Register an input format by its MIME type. Called by category modules. */
export function registerFormat(mime: string, format: InputFormat): void {
    registry.set(mime, format);
}

// ── Lookups ──────────────────────────────────────────────────

/** Get the InputFormat for a given MIME type, or undefined. */
export function getInputFormat(mime: string): InputFormat | undefined {
    return registry.get(mime);
}

/**
 * Fallback: look up an InputFormat by file extension.
 * Browsers sometimes report incorrect MIME types (e.g. `video/avi`
 * instead of `video/x-msvideo`), so extension-based matching is
 * used as a secondary strategy.
 */
export function getInputFormatByExtension(filename: string): InputFormat | undefined {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext) return undefined;
    for (const fmt of registry.values()) {
        if (fmt.extensions.includes(ext)) return fmt;
    }
    return undefined;
}

/** Get the specific output FormatInfo for an input MIME + output extension. */
export function getOutputFormat(
    inputMime: string,
    outputExtension: string
): FormatInfo | undefined {
    return registry.get(inputMime)?.outputs.find(
        (o) => o.extension === outputExtension
    );
}

/** All accepted MIME type strings (for file input `accept`). */
export function getAcceptedMimes(): string[] {
    return Array.from(registry.keys());
}

/** All accepted file extensions (with leading dot, for `accept`). */
export function getAcceptedExtensions(): string[] {
    const exts = new Set<string>();
    for (const fmt of registry.values()) {
        for (const ext of fmt.extensions) exts.add(`.${ext}`);
    }
    return Array.from(exts);
}

// ── Constants ────────────────────────────────────────────────

/** Maximum file size in bytes (50 MB). */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Human-readable max size label. */
export const MAX_FILE_SIZE_LABEL = "50 MB";

/** Maximum number of files in a single batch. */
export const MAX_FILES = 10;

