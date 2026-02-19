"use client";

// ─────────────────────────────────────────────────────────────
// FileInfo — displays selected file thumbnail / icon, name,
// size, and detected format with a remove button.
// ─────────────────────────────────────────────────────────────

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { XIcon, CategoryIcon } from "@/components/icons";
import { formatBytes } from "@/lib/utils";
import type { FormatCategory } from "@/converters";

interface FileInfoProps {
    file: File;
    preview: string | null;
    formatLabel: string;
    category: FormatCategory;
    canRemove: boolean;
    onRemove: () => void;
}



export function FileInfo({ file, preview, formatLabel, category, canRemove, onRemove }: FileInfoProps) {
    return (
        <div className="mb-6 flex items-start gap-4">
            {/* Thumbnail or category icon */}
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                {preview && category === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                    <CategoryIcon category={category} className="h-8 w-8 text-white/30" />
                )}
            </div>

            {/* Filename + metadata */}
            <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white/90">{file.name}</p>
                <p className="mt-0.5 text-xs text-white/40">
                    {formatBytes(file.size)} · {formatLabel}
                </p>
            </div>

            {/* Remove button */}
            {canRemove && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            id="btn-reset"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/30 hover:text-white/70"
                            onClick={onRemove}
                        >
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove file</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}
