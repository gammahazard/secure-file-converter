"use client";

// ─────────────────────────────────────────────────────────────
// InfoModal — explains why this app exists, how it works, and
// what formats are supported.
// ─────────────────────────────────────────────────────────────

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldIcon } from "@/components/icons";

export function InfoModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    id="btn-info"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    Info
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg border-white/10 bg-zinc-900/95 backdrop-blur-2xl text-white/90 rounded-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg text-white">
                        <ShieldIcon className="h-5 w-5 text-emerald-400" />
                        How ConvertLocal Works
                    </DialogTitle>
                </DialogHeader>

                {/* Section 1: The Problem */}
                <div className="mt-2 space-y-4">
                    <div>
                        <h3 className="mb-1.5 text-sm font-semibold text-red-400 uppercase tracking-wider">
                            ⚠ The problem with most converters
                        </h3>
                        <p className="text-sm text-white/60 leading-relaxed">
                            Most file conversion websites upload your files to their servers
                            to process them. This means copies of your personal documents,
                            photos, and videos are stored on external servers you don't
                            control — creating a real privacy and security risk. You have no
                            guarantee those files are ever deleted.
                        </p>
                    </div>

                    {/* Section 2: Our Solution */}
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
                        <h3 className="mb-1.5 text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                            ✓ How we solve this
                        </h3>
                        <p className="text-sm text-white/60 leading-relaxed">
                            This converter runs <strong className="text-white/80">entirely in your browser</strong>.
                            We use WebAssembly (WASM) to run the FFmpeg conversion engine
                            right on your device — no server, no uploads, no cloud processing.
                            Your files never leave your computer.
                        </p>
                        <p className="mt-2 text-sm text-white/60 leading-relaxed">
                            Don't just take our word for it — open your browser's{" "}
                            <strong className="text-white/80">DevTools → Network tab</strong>{" "}
                            during a conversion and see for yourself: zero file uploads, zero
                            external requests.
                        </p>
                    </div>

                    {/* Section 3: Supported Formats */}
                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-violet-400 uppercase tracking-wider">
                            Supported formats
                        </h3>
                        <div className="space-y-3">
                            <FormatRow
                                emoji="🖼️"
                                label="Images"
                                formats="PNG, JPG, WebP, BMP, TIFF, ICO, TGA"
                            />
                            <FormatRow
                                emoji="🎵"
                                label="Audio"
                                formats="MP3, WAV, OGG, AAC, FLAC, M4A"
                            />
                            <FormatRow
                                emoji="🎬"
                                label="Video"
                                formats="MP4, WebM, MOV, AVI, MKV, GIF"
                            />
                        </div>
                        <p className="mt-3 text-xs text-white/30">
                            Maximum file size: 50 MB · GIF output available for video files only
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function FormatRow({ emoji, label, formats }: { emoji: string; label: string; formats: string }) {
    return (
        <div className="flex items-start gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
            <span className="text-base">{emoji}</span>
            <div>
                <p className="text-sm font-medium text-white/80">{label}</p>
                <p className="text-xs text-white/40">{formats}</p>
            </div>
        </div>
    );
}
