"use client";

// ─────────────────────────────────────────────────────────────
// FileQueue — displays queued files grouped by format category.
//
// Each file has its own output format selector. Files are
// visually grouped by category (image / audio / video) for
// clarity but each can convert to a different target format.
// ─────────────────────────────────────────────────────────────

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { XIcon, ImageIcon, MusicIcon, VideoIcon, CheckIcon, CategoryIcon } from "@/components/icons";
import { formatBytes } from "@/lib/utils";
import type { QueueItem, FormatCategory } from "@/converters";

// ── Helpers ──────────────────────────────────────────────────

/** Group queue items by their input format category. */
function groupByCategory(items: QueueItem[]): Map<FormatCategory, QueueItem[]> {
    const groups = new Map<FormatCategory, QueueItem[]>();
    for (const item of items) {
        const cat = item.inputFormat.category;
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat)!.push(item);
    }
    return groups;
}



const categoryLabels: Record<FormatCategory, string> = {
    image: "Images",
    audio: "Audio",
    video: "Video",
};

// ── Status indicator per file ────────────────────────────────

function StatusIndicator({ item }: { item: QueueItem }) {
    switch (item.status) {
        case "converting":
            return (
                <div className="flex items-center gap-2 min-w-[80px]">
                    <Progress
                        value={item.progress}
                        className="h-1.5 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-cyan-400"
                    />
                    <span className="text-[10px] tabular-nums text-white/40 w-7 text-right">
                        {item.progress}%
                    </span>
                </div>
            );
        case "done":
            return (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckIcon className="h-3 w-3 text-emerald-400" />
                </div>
            );
        case "error":
            return (
                <span className="text-[10px] font-medium text-red-400">Failed</span>
            );
        default:
            return null;
    }
}

// ── Props ────────────────────────────────────────────────────

interface FileQueueProps {
    items: QueueItem[];
    /** Whether conversion is in progress (disables selectors and remove). */
    isConverting: boolean;
    onRemoveItem: (id: string) => void;
    onRemoveGroup: (category: FormatCategory) => void;
    onItemFormatChange: (id: string, extension: string) => void;
}

// ── Component ────────────────────────────────────────────────

export function FileQueue({
    items, isConverting, onRemoveItem, onRemoveGroup, onItemFormatChange,
}: FileQueueProps) {
    const groups = groupByCategory(items);

    return (
        <div className="space-y-4 mb-6 animate-fade-in">
            {Array.from(groups.entries()).map(([category, groupItems]) => (
                <div
                    key={category}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
                >
                    {/* Group header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
                        <CategoryIcon category={category} className="h-4 w-4 text-white/40" />
                        <span className="text-sm font-medium text-white/70">
                            {categoryLabels[category]}
                        </span>
                        <Badge variant="secondary" className="bg-white/10 text-white/50 text-[10px] px-1.5 py-0">
                            {groupItems.length}
                        </Badge>
                        <div className="flex-1" />
                        {!isConverting && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white/20 hover:text-white/50"
                                onClick={() => onRemoveGroup(category)}
                            >
                                <XIcon className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {/* File list */}
                    <div className="divide-y divide-white/[0.04]">
                        {groupItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 px-4 py-2.5 group/item"
                            >
                                {/* Thumbnail or icon */}
                                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                                    {item.preview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.preview} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <CategoryIcon category={category} className="h-3.5 w-3.5 text-white/20" />
                                    )}
                                </div>

                                {/* Filename + size */}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-white/80">
                                        {item.file.name}
                                    </p>
                                    <p className="text-[10px] text-white/35">
                                        {formatBytes(item.file.size)}
                                        {item.result && (
                                            <span className="text-emerald-400/70">
                                                {" → "}{formatBytes(item.result.convertedSize)}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Per-file format selector */}
                                {item.status === "pending" && (
                                    <Select
                                        value={item.outputExtension}
                                        onValueChange={(ext) => onItemFormatChange(item.id, ext)}
                                        disabled={isConverting}
                                    >
                                        <SelectTrigger
                                            id={`format-${item.id}`}
                                            className="w-28 h-7 text-[11px] border-white/10 bg-white/5 text-white/90 focus:ring-violet-500/50"
                                        >
                                            <SelectValue placeholder="Format…" />
                                        </SelectTrigger>
                                        <SelectContent className="border-white/10 bg-zinc-900/95 backdrop-blur-xl">
                                            {item.inputFormat.outputs.map((fmt) => (
                                                <SelectItem
                                                    key={fmt.extension}
                                                    value={fmt.extension}
                                                    className="text-xs text-white/90 focus:bg-white/10 focus:text-white"
                                                >
                                                    .{fmt.extension}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {/* Status */}
                                <StatusIndicator item={item} />

                                {/* Remove button */}
                                {!isConverting && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-white/15 hover:text-white/50 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                        onClick={() => onRemoveItem(item.id)}
                                    >
                                        <XIcon className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export { groupByCategory };
