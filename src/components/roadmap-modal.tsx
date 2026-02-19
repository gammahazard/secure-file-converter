"use client";

// ─────────────────────────────────────────────────────────────
// RoadmapModal — shows planned features and upcoming additions
// ─────────────────────────────────────────────────────────────

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** A single roadmap item with title, description, and status badge. */
function RoadmapItem({
    emoji,
    title,
    description,
    status,
}: {
    emoji: string;
    title: string;
    description: string;
    status: "planned" | "next";
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
            <span className="text-base mt-0.5">{emoji}</span>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white/80">{title}</p>
                    <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${status === "next"
                            ? "bg-violet-500/20 text-violet-400"
                            : "bg-white/5 text-white/30"
                            }`}
                    >
                        {status === "next" ? "Up Next" : "Planned"}
                    </span>
                </div>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

export function RoadmapModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    id="btn-roadmap"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    Roadmap
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg border-white/10 bg-zinc-900/95 backdrop-blur-2xl text-white/90 rounded-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg text-white">
                        🗺️ Roadmap
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-2 space-y-3">
                    <p className="text-sm text-white/50 leading-relaxed">
                        Upcoming features — contributions welcome on{" "}
                        <a
                            href="https://github.com/gammahazard/secure-file-converter"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
                        >
                            GitHub
                        </a>
                        .
                    </p>

                    <div className="space-y-2">
                        <RoadmapItem
                            emoji="📄"
                            title="Document Conversions"
                            description="PDF ↔ Image, Markdown → PDF, and more document format support."
                            status="next"
                        />
                        <RoadmapItem
                            emoji="✂️"
                            title="Image & Video Editing"
                            description="Crop, resize, rotate images and trim video clips before converting."
                            status="planned"
                        />
                        <RoadmapItem
                            emoji="⚡"
                            title="Hardware-Adaptive Limits"
                            description="Detect your device's CPU, RAM & GPU to automatically raise file size limits on powerful machines."
                            status="planned"
                        />
                    </div>

                    <p className="text-xs text-white/25 pt-1">
                        Have a feature request? Open an issue on GitHub.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
