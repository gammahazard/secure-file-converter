"use client";

// ─────────────────────────────────────────────────────────────
// useFFmpeg – React hook that wraps FFmpeg.wasm.
//
// • Lazily loads the WASM binary on first conversion request.
// • Exposes reactive progress (0–100), loading state, and errors.
// • Enforces the 50 MB file-size limit before touching WASM.
// • All processing is 100 % client-side: no bytes leave the
//   browser.
// ─────────────────────────────────────────────────────────────

import { useCallback, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { getOutputFormat, getInputFormatByExtension, MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from "@/converters";

// Module-level singleton so we never spawn two WASM instances.
let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<boolean> | null = null;

const isDev = process.env.NODE_ENV === "development";

export interface ConversionResult {
    blob: Blob;
    url: string;
    fileName: string;
    originalSize: number;
    convertedSize: number;
}

export function useFFmpeg() {
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // ── Load FFmpeg (idempotent) ──────────────────────────────
    const loadFFmpeg = useCallback(async () => {
        if (isDev) console.log("[FFmpeg] loadFFmpeg called, loaded:", loaded, "instance:", !!ffmpegInstance);
        if (ffmpegInstance && loaded) {
            if (isDev) console.log("[FFmpeg] Already loaded, skipping");
            return;
        }
        if (loadPromise) {
            if (isDev) console.log("[FFmpeg] Load already in progress, awaiting...");
            await loadPromise;
            setLoaded(true);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isDev) console.log("[FFmpeg] Creating new FFmpeg instance...");
            const ffmpeg = new FFmpeg();

            // Wire up progress events
            ffmpeg.on("progress", ({ progress: p }) => {
                setProgress(Math.round(Math.min(p, 1) * 100));
            });

            // Log FFmpeg messages (dev only — can be very verbose)
            ffmpeg.on("log", ({ message }) => {
                if (isDev) console.log("[FFmpeg log]", message);
            });

            const baseURL = "/ffmpeg";

            if (isDev) console.log("[FFmpeg] Loading WASM core via toBlobURL...");

            // Convert the static files to Blob URLs so the bundler
            // never tries to resolve them as dynamic imports.
            const coreURL = await toBlobURL(
                `${baseURL}/ffmpeg-core.js`,
                "text/javascript"
            );
            const wasmURL = await toBlobURL(
                `${baseURL}/ffmpeg-core.wasm`,
                "application/wasm"
            );

            if (isDev) {
                console.log("[FFmpeg]   coreURL (blob):", coreURL);
                console.log("[FFmpeg]   wasmURL (blob):", wasmURL);
            }

            // Load the WASM core using Blob URLs (bypasses Turbopack)
            loadPromise = ffmpeg.load({
                coreURL,
                wasmURL,
            });

            await loadPromise;
            if (isDev) console.log("[FFmpeg] ✅ WASM loaded successfully");
            ffmpegInstance = ffmpeg;
            setLoaded(true);
        } catch (err) {
            console.error("[FFmpeg] ❌ Load failed:", err);
            const message =
                err instanceof Error ? err.message : "Failed to load FFmpeg";
            setError(message);
            loadPromise = null;
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loaded]);

    // ── Convert a file ───────────────────────────────────────
    const convertFile = useCallback(
        async (file: File, outputExtension: string): Promise<ConversionResult> => {
            setError(null);
            setProgress(0);

            // Guard: file size
            if (file.size > MAX_FILE_SIZE) {
                const msg = `File exceeds ${MAX_FILE_SIZE_LABEL} limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
                setError(msg);
                throw new Error(msg);
            }

            // Guard: MIME type → output mapping
            // Try by MIME first; fall back to extension (browsers may
            // report non-standard MIMEs like "video/avi" for AVI files).
            let outputFormat = getOutputFormat(file.type, outputExtension);
            if (!outputFormat) {
                const byExt = getInputFormatByExtension(file.name);
                if (byExt) outputFormat = getOutputFormat(byExt.mime, outputExtension);
            }
            if (!outputFormat) {
                const msg = `Unsupported conversion: ${file.type} → .${outputExtension}`;
                setError(msg);
                throw new Error(msg);
            }

            // Ensure WASM is loaded
            await loadFFmpeg();
            const ffmpeg = ffmpegInstance!;

            const inputName = `input_${Date.now()}.${file.name.split(".").pop()}`;
            const outputName = `output_${Date.now()}.${outputFormat.extension}`;

            try {
                // Write input file into the WASM virtual filesystem
                const inputData = await fetchFile(file);
                await ffmpeg.writeFile(inputName, inputData);

                // Build FFmpeg command
                // -flush_packets 1 ensures data is written to the virtual FS
                //  immediately, preventing corruption if WASM Aborted() crashes
                //  during cleanup (common with AVI, TIFF muxers).
                const cmd = [
                    "-i", inputName,
                    ...outputFormat.ffmpegFlags,
                    "-flush_packets", "1",
                    "-y", // overwrite output
                    outputName,
                ];

                // Execute conversion — FFmpeg.wasm's image2 muxer may call
                // Aborted() during cleanup even when the output was written
                // successfully, so we catch exec errors and still try to
                // read the output file.
                let execError: unknown = null;
                try {
                    await ffmpeg.exec(cmd);
                } catch (e) {
                    if (isDev) console.warn("[FFmpeg] exec() threw (may still have output):", e);
                    execError = e;
                }

                // Attempt to read the output regardless of exec result
                let outputData: Uint8Array | string;
                try {
                    outputData = await ffmpeg.readFile(outputName);
                } catch {
                    // If readFile also fails AND exec threw, the conversion truly failed
                    if (execError) {
                        // The WASM instance is dead after Aborted(), reset it
                        ffmpegInstance = null;
                        loadPromise = null;
                        setLoaded(false);
                        throw execError;
                    }
                    throw new Error("Failed to read converted file");
                }

                // CRITICAL: Copy data into a standalone ArrayBuffer immediately.
                // The Uint8Array from readFile may be a VIEW into WASM's
                // SharedArrayBuffer. After Aborted(), that buffer can be
                // invalidated/zeroed. We manually copy to a fresh ArrayBuffer.
                let outputBytes: Uint8Array<ArrayBuffer>;
                if (outputData instanceof Uint8Array) {
                    const buf = new ArrayBuffer(outputData.byteLength);
                    const copy = new Uint8Array(buf);
                    copy.set(outputData);
                    outputBytes = copy;
                } else {
                    outputBytes = new TextEncoder().encode(outputData);
                }

                if (isDev) {
                    console.log(`[FFmpeg] Output file size: ${(outputBytes.length / 1024).toFixed(1)} KB (exec ${execError ? 'failed' : 'ok'})`);
                    // Log first 16 bytes as hex to verify file header integrity
                    const header = Array.from(outputBytes.slice(0, 16))
                        .map(b => b.toString(16).padStart(2, '0')).join(' ');
                    const headerAscii = Array.from(outputBytes.slice(0, 4))
                        .map(b => String.fromCharCode(b)).join('');
                    console.log(`[FFmpeg] File header: ${header} (ascii: "${headerAscii}")`);
                }

                // Guard: empty output means conversion genuinely failed
                if (outputBytes.length === 0) {
                    if (execError) {
                        ffmpegInstance = null;
                        loadPromise = null;
                        setLoaded(false);
                        throw execError;
                    }
                    throw new Error("Conversion produced an empty file");
                }

                // If exec aborted but we got valid output, the WASM instance
                // is likely dead — reset it for the next conversion
                if (execError) {
                    if (isDev) console.log("[FFmpeg] Output recovered despite exec error, resetting instance for next use");
                    ffmpegInstance = null;
                    loadPromise = null;
                    setLoaded(false);
                }

                // Create blob from the deep-copied data
                const blob = new Blob(
                    [outputBytes],
                    { type: outputFormat.mime }
                );
                const url = URL.createObjectURL(blob);

                // Derive download filename
                const baseName = file.name.replace(/\.[^.]+$/, "");
                const fileName = `${baseName}.${outputFormat.extension}`;

                // Cleanup virtual FS (may fail if instance was reset, that's ok)
                await ffmpeg.deleteFile(inputName).catch(() => { });
                await ffmpeg.deleteFile(outputName).catch(() => { });

                setProgress(100);

                return { blob, url, fileName, originalSize: file.size, convertedSize: blob.size };
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Conversion failed";
                setError(message);
                throw err;
            }
        },
        [loadFFmpeg]
    );

    // ── Batch convert (sequential) ─────────────────────────────
    const convertBatch = useCallback(
        async (
            items: { file: File; outputExtension: string }[],
            onItemProgress: (index: number, progress: number) => void,
            onItemComplete: (index: number, result: ConversionResult) => void,
            onItemError: (index: number, error: string) => void,
        ): Promise<void> => {
            setError(null);
            setProgress(0);

            for (let i = 0; i < items.length; i++) {
                const { file, outputExtension } = items[i];

                // Wire per-item progress
                const progressHandler = ({ progress: p }: { progress: number }) => {
                    const itemProgress = Math.round(Math.min(p, 1) * 100);
                    onItemProgress(i, itemProgress);
                    // Overall progress: completed items + fraction of current
                    const overall = Math.round(((i + Math.min(p, 1)) / items.length) * 100);
                    setProgress(overall);
                };

                // Temporarily attach the per-item progress handler
                if (ffmpegInstance) {
                    ffmpegInstance.on("progress", progressHandler);
                }

                try {
                    const result = await convertFile(file, outputExtension);
                    onItemComplete(i, result);
                } catch (err) {
                    const message = err instanceof Error ? err.message : "Conversion failed";
                    onItemError(i, message);
                } finally {
                    if (ffmpegInstance) {
                        ffmpegInstance.off("progress", progressHandler);
                    }
                }
            }
            setProgress(100);
        },
        [convertFile]
    );

    const reset = useCallback(() => {
        setProgress(0);
        setError(null);
    }, []);

    return { loaded, loading, progress, error, convertFile, convertBatch, reset };
}
