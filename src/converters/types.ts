// ─────────────────────────────────────────────────────────────
// Shared types for the converter registry.
//
// Every format category (image, audio, video) uses these
// interfaces so the UI and FFmpeg hook stay format-agnostic.
// ─────────────────────────────────────────────────────────────

/** Category tag used for UI grouping and icon selection. */
export type FormatCategory = "image" | "audio" | "video";

/** A single output target — what a file can be converted TO. */
export interface FormatInfo {
    /** Human-readable name, e.g. "PNG" */
    label: string;
    /** File extension without dot, e.g. "png" */
    extension: string;
    /** MIME type for Blob creation, e.g. "image/png" */
    mime: string;
    /** Extra FFmpeg flags for this output, e.g. ["-q:v", "2"] */
    ffmpegFlags: string[];
    /** Which category this format belongs to. */
    category: FormatCategory;
}

/** An input format and the list of formats it can convert to. */
export interface InputFormat {
    /** Human-readable name, e.g. "PNG" */
    label: string;
    /** MIME type string, e.g. "image/png" */
    mime: string;
    /** Accepted file extensions (lowercase, no dot) */
    extensions: string[];
    /** Category for UI grouping */
    category: FormatCategory;
    /** Available output formats */
    outputs: FormatInfo[];
}

/** Status of a single file in the conversion queue. */
export type QueueItemStatus = "pending" | "converting" | "done" | "error";

/** A file in the batch conversion queue. */
export interface QueueItem {
    /** Unique identifier (crypto.randomUUID). */
    id: string;
    /** The original File object. */
    file: File;
    /** Resolved input format from the registry. */
    inputFormat: InputFormat;
    /** Blob URL for image thumbnail preview, or null. */
    preview: string | null;
    /** Chosen output extension (shared per category group). */
    outputExtension: string;
    /** Current conversion status. */
    status: QueueItemStatus;
    /** Conversion progress 0–100. */
    progress: number;
    /** Result after successful conversion (matches ConversionResult from useFFmpeg). */
    result: {
        blob: Blob;
        url: string;
        fileName: string;
        originalSize: number;
        convertedSize: number;
    } | null;
    /** Error message if conversion failed. */
    error: string | null;
}
