"use client";

// ─────────────────────────────────────────────────────────────
// ConvertButton — gradient CTA with loading / converting states.
// ─────────────────────────────────────────────────────────────

import { Button } from "@/components/ui/button";

interface ConvertButtonProps {
    onClick: () => void;
    disabled: boolean;
    loading: boolean;
    converting: boolean;
}

export function ConvertButton({ onClick, disabled, loading, converting }: ConvertButtonProps) {
    const label = loading
        ? "Loading converter engine…"
        : converting
            ? "Converting…"
            : "Convert Now";

    return (
        <Button
            id="btn-convert"
            onClick={onClick}
            disabled={disabled}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500
        font-semibold text-white shadow-lg shadow-violet-600/25 transition-all
        hover:shadow-violet-600/40 hover:brightness-110
        disabled:opacity-40 disabled:shadow-none"
        >
            {label}
        </Button>
    );
}
