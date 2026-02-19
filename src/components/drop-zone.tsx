"use client";

// ─────────────────────────────────────────────────────────────
// DropZone — drag-and-drop multi-file upload with click fallback.
//
// Accepts up to MAX_FILES files at once. Prevents the browser's
// default "open file" behaviour so the React handler fires
// reliably. Shows validation errors inline.
// ─────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from "react";
import { UploadIcon } from "@/components/icons";
import { MAX_FILE_SIZE_LABEL, MAX_FILES, getAcceptedMimes, getAcceptedExtensions } from "@/converters";

interface DropZoneProps {
    onFilesSelected: (files: File[]) => void;
    error: string | null;
    /** How many files are already in the queue (to enforce MAX_FILES). */
    currentCount?: number;
}

export function DropZone({ onFilesSelected, error, currentCount = 0 }: DropZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const accept = [...getAcceptedMimes(), ...getAcceptedExtensions()].join(",");
    const remaining = MAX_FILES - currentCount;

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            const files = Array.from(e.dataTransfer.files).slice(0, remaining);
            if (files.length > 0) onFilesSelected(files);
        },
        [onFilesSelected, remaining]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files ?? []).slice(0, remaining);
            if (files.length > 0) onFilesSelected(files);
            // Reset input so the same file(s) can be re-selected
            if (inputRef.current) inputRef.current.value = "";
        },
        [onFilesSelected, remaining]
    );

    return (
        <div
            id="drop-zone"
            role="button"
            tabIndex={0}
            className={`drop-zone-border group flex cursor-pointer flex-col items-center
        justify-center rounded-2xl px-6 py-16 text-center transition-all
        duration-300 ${dragOver ? "drag-over" : ""}`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                ref={inputRef}
                id="file-input"
                type="file"
                accept={accept}
                multiple
                className="hidden"
                onChange={handleChange}
            />

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 transition-colors group-hover:bg-white/10">
                <UploadIcon className="h-8 w-8 text-white/40 transition-colors group-hover:text-violet-400" />
            </div>

            <p className="mb-1 text-lg font-medium text-white/80">
                Drop your files here
            </p>
            <p className="text-sm text-white/40">
                or click to browse · Up to {MAX_FILES} files
            </p>
            <p className="mt-2 text-xs text-white/25">
                Images, Audio, Video · Max {MAX_FILE_SIZE_LABEL} each
            </p>

            {error && (
                <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 animate-fade-in">
                    {error}
                </div>
            )}
        </div>
    );
}
