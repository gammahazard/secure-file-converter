"use client";

// ─────────────────────────────────────────────────────────────
// FormatSelector — dropdown to pick the output format.
//
// Shows "INPUT → OUTPUT" flow with the Shadcn Select component.
// ─────────────────────────────────────────────────────────────

import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowRightIcon } from "@/components/icons";
import type { FormatInfo } from "@/converters";

interface FormatSelectorProps {
    inputLabel: string;
    outputs: FormatInfo[];
    value: string;
    onChange: (ext: string) => void;
    disabled: boolean;
}

export function FormatSelector({
    inputLabel, outputs, value, onChange, disabled,
}: FormatSelectorProps) {
    return (
        <div className="mb-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
                Convert to
            </label>
            <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-white/10 text-white/70">
                    {inputLabel}
                </Badge>
                <ArrowRightIcon className="h-4 w-4 text-white/20" />
                <Select value={value} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger
                        id="format-selector"
                        className="w-40 border-white/10 bg-white/5 text-white/90 focus:ring-violet-500/50"
                    >
                        <SelectValue placeholder="Format…" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-zinc-900/95 backdrop-blur-xl">
                        {outputs.map((fmt) => (
                            <SelectItem
                                key={fmt.extension}
                                value={fmt.extension}
                                className="text-white/90 focus:bg-white/10 focus:text-white"
                            >
                                {fmt.label} (.{fmt.extension})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
