"use client";

// ─────────────────────────────────────────────────────────────
// Home Page — slim composition of focused components.
//
// All format logic lives in @/converters, all UI pieces are
// in @/components. This file just wires state together.
//
// Supports batch conversion of up to MAX_FILES files at once,
// grouped by format category with shared output selectors.
// ─────────────────────────────────────────────────────────────

import { useCallback, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageIcon, ShieldIcon } from "@/components/icons";
import { DropZone } from "@/components/drop-zone";
import { FileQueue } from "@/components/file-queue";
import { ConvertButton } from "@/components/convert-button";
import { ProgressBar } from "@/components/progress-bar";
import { ResultCard } from "@/components/result-card";
import { BatchResultCard } from "@/components/batch-result-card";
import { InfoModal } from "@/components/info-modal";
import { RoadmapModal } from "@/components/roadmap-modal";
import { useFFmpeg, type ConversionResult } from "@/hooks/useFFmpeg";
import {
  getInputFormat, getInputFormatByExtension,
  getAcceptedMimes, getAcceptedExtensions,
  MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL, MAX_FILES,
  type QueueItem, type FormatCategory,
} from "@/converters";

type ConvertState = "idle" | "ready" | "converting" | "done" | "error";

export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [convertState, setConvertState] = useState<ConvertState>("idle");
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    loading: ffmpegLoading, progress, error: ffmpegError,
    convertFile, convertBatch, reset: resetFFmpeg,
  } = useFFmpeg();

  // ── Derived state ──────────────────────────────────────────
  const hasFiles = queue.length > 0;
  const allHaveFormat = queue.every((item) => item.outputExtension !== "");
  const canConvert = convertState === "ready" && hasFiles && allHaveFormat && !ffmpegLoading;
  const isSingleFile = queue.length === 1;

  // Get categories present in queue
  const categories = useMemo(() => {
    const cats = new Set<FormatCategory>();
    for (const item of queue) cats.add(item.inputFormat.category);
    return cats;
  }, [queue]);

  // ── File selection & validation ────────────────────────────
  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFileError(null);
    resetFFmpeg();

    const acceptedMimes = getAcceptedMimes();
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      // Try MIME first, then fall back to extension (browsers often
      // report wrong MIME for AVI, MKV, FLAC, etc.)
      const byMime = acceptedMimes.includes(file.type);
      const byExt = !byMime && !!getInputFormatByExtension(file.name);
      if (!byMime && !byExt) {
        errors.push(`${file.name}: unsupported format`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: exceeds ${MAX_FILE_SIZE_LABEL}`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      setFileError(errors.join(". "));
    }

    if (validFiles.length === 0) return;

    // Check total count
    setQueue((prev) => {
      const total = prev.length + validFiles.length;
      const filesToAdd = total > MAX_FILES
        ? validFiles.slice(0, MAX_FILES - prev.length)
        : validFiles;

      if (total > MAX_FILES && !errors.length) {
        setFileError(`Maximum ${MAX_FILES} files. ${total - MAX_FILES} file(s) skipped.`);
      }

      const newItems: QueueItem[] = filesToAdd.map((file) => {
        const inputFormat = getInputFormat(file.type) ?? getInputFormatByExtension(file.name)!;
        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null;
        return {
          id: crypto.randomUUID(),
          file,
          inputFormat,
          preview,
          outputExtension: "",
          status: "pending" as const,
          progress: 0,
          result: null,
          error: null,
        };
      });

      return [...prev, ...newItems];
    });

    setConvertState("ready");
  }, [resetFFmpeg]);

  // ── Format selection per file ──────────────────────────────
  const handleItemFormatChange = useCallback((id: string, extension: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, outputExtension: extension } : item
      )
    );
  }, []);

  // ── Remove item / group ────────────────────────────────────
  const handleRemoveItem = useCallback((id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      if (item?.result?.url) URL.revokeObjectURL(item.result.url);
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) setConvertState("idle");
      return next;
    });
  }, []);

  const handleRemoveGroup = useCallback((category: FormatCategory) => {
    setQueue((prev) => {
      for (const item of prev) {
        if (item.inputFormat.category === category) {
          if (item.preview) URL.revokeObjectURL(item.preview);
          if (item.result?.url) URL.revokeObjectURL(item.result.url);
        }
      }
      const next = prev.filter((i) => i.inputFormat.category !== category);
      if (next.length === 0) setConvertState("idle");
      return next;
    });
  }, []);

  // ── Conversion ─────────────────────────────────────────────
  const handleConvert = useCallback(async () => {
    if (!hasFiles || !allHaveFormat) return;
    setConvertState("converting");

    // Mark all as converting
    setQueue((prev) =>
      prev.map((item) => ({ ...item, status: "converting" as const, progress: 0 }))
    );

    const items = queue.map((item) => ({
      file: item.file,
      outputExtension: item.outputExtension,
    }));

    await convertBatch(
      items,
      // onItemProgress
      (index, itemProgress) => {
        setQueue((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, progress: itemProgress } : item
          )
        );
      },
      // onItemComplete
      (index, result) => {
        setQueue((prev) =>
          prev.map((item, i) =>
            i === index
              ? { ...item, status: "done" as const, progress: 100, result }
              : item
          )
        );
      },
      // onItemError
      (index, error) => {
        setQueue((prev) =>
          prev.map((item, i) =>
            i === index
              ? { ...item, status: "error" as const, error }
              : item
          )
        );
      }
    );

    setConvertState("done");
  }, [hasFiles, allHaveFormat, queue, convertBatch]);

  // ── Reset ──────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    // Free all blob URLs
    for (const item of queue) {
      if (item.preview) URL.revokeObjectURL(item.preview);
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    }
    setQueue([]);
    setConvertState("idle");
    setFileError(null);
    resetFFmpeg();
  }, [queue, resetFFmpeg]);

  // ── Single-file download ───────────────────────────────────
  const handleDownloadSingle = useCallback(async (item: QueueItem) => {
    if (!item.result) return;
    const { blob, fileName, url } = item.result;

    if ("showSaveFilePicker" in window) {
      try {
        const handle = await (window as unknown as {
          showSaveFilePicker: (opts: {
            suggestedName: string;
          }) => Promise<FileSystemFileHandle>;
        }).showSaveFilePicker({ suggestedName: fileName });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 150);
  }, []);

  // ── Single-file backward-compat derived state ──────────────
  const singleItem = isSingleFile ? queue[0] : null;
  const singleResult = singleItem?.result as ConversionResult | null;
  const singleInputFormat = singleItem?.inputFormat;
  const browserImageFormats = ["png", "jpg", "jpeg", "webp", "gif"];
  const isImage = singleInputFormat?.category === "image"
    && browserImageFormats.includes(singleItem?.outputExtension ?? "");

  // ══════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-mesh"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[oklch(0.5_0.2_270)] opacity-20 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-[oklch(0.5_0.2_200)] opacity-15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[oklch(0.5_0.2_310)] opacity-10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-8 sm:py-16">
        {/* Header */}
        <header className="mb-10 text-center animate-fade-in sm:mb-14">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/25">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              ConvertLocal
            </h1>
          </div>
          <p className="mb-4 max-w-md text-base text-white/60">
            Convert images, audio &amp; video — right in your browser.
            <br className="hidden sm:block" />
            No uploads. No servers. Your files never leave your device.
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-default gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-400 hover:bg-emerald-500/15"
              >
                <ShieldIcon className="h-3.5 w-3.5" />
                100% Local &amp; Private
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">
              All conversion happens via WebAssembly in your browser. Zero network requests.
            </TooltipContent>
          </Tooltip>
          <div className="mt-3 flex items-center justify-center gap-2">
            <InfoModal />
            <RoadmapModal />
          </div>
        </header>

        {/* Main Converter Card */}
        <Card className="w-full max-w-2xl glass rounded-3xl shadow-2xl shadow-black/40 animate-slide-up border-white/[0.08]">
          <CardContent className="p-6 sm:p-8">
            {/* DropZone: shown when idle or has room + errors */}
            {(convertState === "idle" || fileError) && !hasFiles ? (
              <DropZone
                onFilesSelected={handleFilesSelected}
                error={fileError}
                currentCount={queue.length}
              />
            ) : (
              <div className="animate-fade-in">
                {/* File queue */}
                {convertState !== "done" && (
                  <>
                    <FileQueue
                      items={queue}
                      isConverting={convertState === "converting"}
                      onRemoveItem={handleRemoveItem}
                      onRemoveGroup={handleRemoveGroup}
                      onItemFormatChange={handleItemFormatChange}
                    />

                    {/* Add more files button (when not converting and under limit) */}
                    {convertState === "ready" && queue.length < MAX_FILES && (
                      <div className="mb-6">
                        <DropZone
                          onFilesSelected={handleFilesSelected}
                          error={fileError}
                          currentCount={queue.length}
                        />
                      </div>
                    )}

                    {/* File count badge */}
                    {queue.length > 1 && (
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-xs text-white/30">
                          {queue.length} file{queue.length > 1 ? "s" : ""} queued
                          {categories.size > 1 && ` across ${categories.size} categories`}
                        </span>
                      </div>
                    )}

                    <ConvertButton
                      onClick={handleConvert}
                      disabled={!canConvert}
                      loading={ffmpegLoading}
                      converting={convertState === "converting"}
                    />
                  </>
                )}

                {convertState === "converting" && (
                  <ProgressBar progress={progress} />
                )}

                {(convertState === "error" || ffmpegError) && (
                  <div className="mt-5 animate-fade-in rounded-xl bg-red-500/10 p-4">
                    <p className="text-sm font-medium text-red-400">Conversion failed</p>
                    <p className="mt-1 text-xs text-red-400/70">
                      {ffmpegError || "An unexpected error occurred. Please try again."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={handleReset}
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Results */}
                {convertState === "done" && (
                  isSingleFile && singleResult ? (
                    <ResultCard
                      result={singleResult}
                      isImage={isImage}
                      onDownload={() => handleDownloadSingle(queue[0])}
                      onReset={handleReset}
                    />
                  ) : (
                    <BatchResultCard
                      items={queue}
                      onDownloadSingle={handleDownloadSingle}
                      onReset={handleReset}
                    />
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-10 text-center animate-fade-in">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/25">
            <span>Powered by FFmpeg.wasm</span>
            <span>·</span>
            <span>No data leaves your device</span>
            <span>·</span>
            <a href="https://github.com/gammahazard/secure-file-converter" target="_blank" rel="noopener noreferrer" className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/60 hover:decoration-white/40">Open source</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
