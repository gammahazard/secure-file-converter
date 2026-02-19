"use client";

// ─────────────────────────────────────────────────────────────
// BatchResultCard — shown after batch conversion completes.
//
// Displays per-file results with size comparison, individual
// download buttons, and a "Download All" zip option via JSZip.
// ─────────────────────────────────────────────────────────────

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, DownloadIcon, XIcon } from "@/components/icons";
import { formatBytes } from "@/lib/utils";
import type { QueueItem } from "@/converters";

interface BatchResultCardProps {
    items: QueueItem[];
    onDownloadSingle: (item: QueueItem) => void;
    onReset: () => void;
}

export function BatchResultCard({ items, onDownloadSingle, onReset }: BatchResultCardProps) {
    const [zipping, setZipping] = useState(false);

    const doneItems = items.filter((i) => i.status === "done" && i.result);
    const errorItems = items.filter((i) => i.status === "error");
    const totalOriginal = doneItems.reduce((s, i) => s + i.file.size, 0);
    const totalConverted = doneItems.reduce((s, i) => s + (i.result?.convertedSize ?? 0), 0);
    const saved = totalConverted < totalOriginal;
    const pctSaved = totalOriginal > 0
        ? Math.round((1 - totalConverted / totalOriginal) * 100)
        : 0;

    const handleDownloadAll = useCallback(async () => {
        if (doneItems.length === 0) return;

        // Single file — just download directly
        if (doneItems.length === 1) {
            onDownloadSingle(doneItems[0]);
            return;
        }

        setZipping(true);
        try {
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();

            for (const item of doneItems) {
                if (item.result) {
                    zip.file(item.result.fileName, item.result.blob);
                }
            }

            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);

            // Use File System Access API if available
            if ("showSaveFilePicker" in window) {
                try {
                    const handle = await (window as unknown as {
                        showSaveFilePicker: (opts: {
                            suggestedName: string;
                            types?: { description: string; accept: Record<string, string[]> }[];
                        }) => Promise<FileSystemFileHandle>;
                    }).showSaveFilePicker({
                        suggestedName: "converted-files.zip",
                        types: [{
                            description: "ZIP Archive",
                            accept: { "application/zip": [".zip"] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    URL.revokeObjectURL(url);
                    return;
                } catch (e) {
                    if (e instanceof Error && e.name === "AbortError") {
                        URL.revokeObjectURL(url);
                        return;
                    }
                }
            }

            // Fallback: anchor click
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = "converted-files.zip";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 150);
        } finally {
            setZipping(false);
        }
    }, [doneItems, onDownloadSingle]);

    return (
        <div className="mt-5 animate-slide-up">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                {/* Header */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                        <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-emerald-400">
                        {doneItems.length} of {items.length} converted
                        {errorItems.length > 0 && (
                            <span className="text-red-400 font-normal ml-2">
                                · {errorItems.length} failed
                            </span>
                        )}
                    </p>
                </div>

                {/* Size summary */}
                {doneItems.length > 0 && (
                    <div className="mb-4 flex items-center gap-3 text-xs text-white/50">
                        <span>Total: {formatBytes(totalOriginal)}</span>
                        <span className="text-white/20">→</span>
                        <span className="font-medium text-white/70">
                            {formatBytes(totalConverted)}
                        </span>
                        {saved && (
                            <Badge
                                variant="outline"
                                className="border-emerald-500/30 text-emerald-400 text-[10px] px-1.5 py-0"
                            >
                                -{pctSaved}%
                            </Badge>
                        )}
                    </div>
                )}

                {/* Per-file results */}
                <div className="mb-4 space-y-1 max-h-48 overflow-y-auto">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs bg-white/[0.03]"
                        >
                            {item.status === "done" ? (
                                <CheckIcon className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                            ) : (
                                <XIcon className="h-3 w-3 text-red-400 flex-shrink-0" />
                            )}
                            <span className="truncate flex-1 text-white/70">
                                {item.result?.fileName ?? item.file.name}
                            </span>
                            {item.result && (
                                <span className="text-white/35 tabular-nums">
                                    {formatBytes(item.result.convertedSize)}
                                </span>
                            )}
                            {item.error && (
                                <span className="text-red-400/70 truncate max-w-[120px]">
                                    {item.error}
                                </span>
                            )}
                            {item.status === "done" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-white/30 hover:text-white/60"
                                    onClick={() => onDownloadSingle(item)}
                                >
                                    <DownloadIcon className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {doneItems.length > 0 && (
                        <Button
                            id="btn-download-all"
                            onClick={handleDownloadAll}
                            disabled={zipping}
                            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500
                font-semibold text-white shadow-lg shadow-emerald-600/25
                hover:shadow-emerald-600/40 hover:brightness-110"
                        >
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            {zipping
                                ? "Creating zip…"
                                : doneItems.length === 1
                                    ? `Download ${doneItems[0].result!.fileName}`
                                    : `Download All (${doneItems.length} files)`
                            }
                        </Button>
                    )}
                    <Button
                        id="btn-new-conversion"
                        variant="outline"
                        className="h-11 rounded-xl border-white/10 text-white/70 hover:bg-white/5"
                        onClick={onReset}
                    >
                        New
                    </Button>
                </div>
            </div>
        </div>
    );
}
