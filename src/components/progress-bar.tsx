"use client";

// ─────────────────────────────────────────────────────────────
// ProgressBar — animated conversion progress with percentage.
// ─────────────────────────────────────────────────────────────

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
    progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="mt-5 animate-fade-in">
            <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                <span>Processing…</span>
                <span>{progress}%</span>
            </div>
            <Progress
                value={progress}
                className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-cyan-400"
            />
        </div>
    );
}
