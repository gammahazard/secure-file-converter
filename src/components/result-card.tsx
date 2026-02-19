"use client";

// ─────────────────────────────────────────────────────────────
// ResultCard — shown after successful conversion.
//
// Displays output preview (images), size comparison with
// compression badge, download button, and "New conversion" CTA.
// ─────────────────────────────────────────────────────────────

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, DownloadIcon, ArrowRightIcon } from "@/components/icons";
import { formatBytes } from "@/lib/utils";
import type { ConversionResult } from "@/hooks/useFFmpeg";

interface ResultCardProps {
    result: ConversionResult;
    isImage: boolean;
    onDownload: () => void;
    onReset: () => void;
}

export function ResultCard({ result, isImage, onDownload, onReset }: ResultCardProps) {
    const saved = result.convertedSize < result.originalSize;
    const pctSaved = Math.round((1 - result.convertedSize / result.originalSize) * 100);

    return (
        <div className="mt-5 animate-slide-up">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                {/* Header */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                        <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-emerald-400">
                        Conversion complete!
                    </p>
                </div>

                {/* Size comparison */}
                <div className="mb-4 flex items-center gap-3 text-xs text-white/50">
                    <span>{formatBytes(result.originalSize)}</span>
                    <ArrowRightIcon className="h-3 w-3" />
                    <span className="font-medium text-white/70">
                        {formatBytes(result.convertedSize)}
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

                {/* Preview (images only) */}
                {isImage && (
                    <div className="mb-4 overflow-hidden rounded-lg border border-white/5 bg-black/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={result.url}
                            alt="Converted output"
                            className="mx-auto max-h-64 object-contain"
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        id="btn-download"
                        onClick={onDownload}
                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500
              font-semibold text-white shadow-lg shadow-emerald-600/25
              hover:shadow-emerald-600/40 hover:brightness-110"
                    >
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Download {result.fileName}
                    </Button>
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
