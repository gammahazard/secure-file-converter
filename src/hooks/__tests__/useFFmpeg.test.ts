// ─────────────────────────────────────────────────────────────
// useFFmpeg hook — conversion logic tests
//
// Tests the hook's internal logic: file size validation,
// MIME → format lookup, error recovery, the exec → readFile
// pipeline, and the Aborted() recovery path.
//
// FFmpeg WASM is fully mocked (no real WASM binary needed).
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ── Mock @ffmpeg/ffmpeg ─────────────────────────────────────
const mockExec = vi.fn().mockResolvedValue(0);
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockReadFile = vi.fn().mockResolvedValue(new Uint8Array([0xFF, 0xD8, 0xFF]));
const mockDeleteFile = vi.fn().mockResolvedValue(undefined);
const mockLoad = vi.fn().mockResolvedValue(true);
const mockOn = vi.fn();

vi.mock("@ffmpeg/ffmpeg", () => {
    // Must return a class-like constructor (not a plain function)
    return {
        FFmpeg: class MockFFmpeg {
            exec = mockExec;
            writeFile = mockWriteFile;
            readFile = mockReadFile;
            deleteFile = mockDeleteFile;
            load = mockLoad;
            on = mockOn;
        },
    };
});

// ── Mock @ffmpeg/util ───────────────────────────────────────
vi.mock("@ffmpeg/util", () => ({
    fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    toBlobURL: vi.fn().mockResolvedValue("blob:mock"),
}));

// ── Import AFTER mocks are set ──────────────────────────────
// We need to reset the module-level singleton between tests.
// useFFmpeg stores ffmpegInstance and loadPromise at module scope.
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { MAX_FILE_SIZE } from "@/converters";

// Reset module-level singleton state between tests
beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockResolvedValue(new Uint8Array([0xFF, 0xD8, 0xFF])); // valid output
    mockExec.mockResolvedValue(0);
});

// ── File size validation ────────────────────────────────────

describe("File size validation", () => {
    it("rejects files exceeding MAX_FILE_SIZE", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const oversizedFile = new File(
            [new ArrayBuffer(MAX_FILE_SIZE + 1)],
            "huge.png",
            { type: "image/png" }
        );

        let thrownError: Error | undefined;
        try {
            await act(async () => {
                await result.current.convertFile(oversizedFile, "jpg");
            });
        } catch (e) {
            thrownError = e as Error;
        }

        expect(thrownError).toBeDefined();
        expect(thrownError!.message).toMatch(/exceeds.*limit/);
    });

    it("includes actual file size in error message", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const size = MAX_FILE_SIZE + 1;
        const oversizedFile = new File(
            [new ArrayBuffer(size)],
            "huge.png",
            { type: "image/png" }
        );

        try {
            await act(async () => {
                await result.current.convertFile(oversizedFile, "jpg");
            });
        } catch (e) {
            expect((e as Error).message).toContain("MB");
        }
    });

    it("accepts files at exactly MAX_FILE_SIZE", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const exactFile = new File(
            [new ArrayBuffer(MAX_FILE_SIZE)],
            "exact.png",
            { type: "image/png" }
        );

        // Should not throw on size — may throw later due to mock setup, but not size
        try {
            await act(async () => {
                await result.current.convertFile(exactFile, "jpg");
            });
        } catch (e) {
            expect((e as Error).message).not.toMatch(/exceeds.*limit/);
        }
    });
});

// ── Format validation ───────────────────────────────────────

describe("Format validation", () => {
    it("rejects unsupported MIME types", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const pdfFile = new File(["data"], "doc.pdf", { type: "application/pdf" });

        let thrownError: Error | undefined;
        try {
            await act(async () => {
                await result.current.convertFile(pdfFile, "png");
            });
        } catch (e) {
            thrownError = e as Error;
        }

        expect(thrownError).toBeDefined();
        expect(thrownError!.message).toContain("Unsupported conversion");
    });

    it("rejects invalid output extension for valid input", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const pngFile = new File(["data"], "image.png", { type: "image/png" });

        await expect(
            act(async () => {
                await result.current.convertFile(pngFile, "mp3");
            })
        ).rejects.toThrow(/Unsupported conversion/);
    });

    it("includes MIME type and extension in error", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const file = new File(["data"], "test.xyz", { type: "text/plain" });

        try {
            await act(async () => {
                await result.current.convertFile(file, "png");
            });
        } catch (e) {
            const msg = (e as Error).message;
            expect(msg).toContain("text/plain");
            expect(msg).toContain("png");
        }
    });
});

// ── Successful conversion pipeline ──────────────────────────

describe("Successful conversion", () => {
    it("calls writeFile, exec, and readFile in order", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const pngFile = new File(["data"], "photo.png", { type: "image/png" });

        const callOrder: string[] = [];
        mockWriteFile.mockImplementation(async () => { callOrder.push("writeFile"); });
        mockExec.mockImplementation(async () => { callOrder.push("exec"); });
        mockReadFile.mockImplementation(async () => {
            callOrder.push("readFile");
            return new Uint8Array([1, 2, 3]);
        });

        await act(async () => {
            await result.current.convertFile(pngFile, "jpg");
        });

        expect(callOrder).toEqual(["writeFile", "exec", "readFile"]);
    });

    it("returns a ConversionResult with correct structure", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const pngFile = new File(["data"], "photo.png", { type: "image/png" });
        mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5]));

        let convResult: Awaited<ReturnType<typeof result.current.convertFile>> | undefined;
        await act(async () => {
            convResult = await result.current.convertFile(pngFile, "jpg");
        });

        expect(convResult).toBeDefined();
        expect(convResult!.fileName).toBe("photo.jpg");
        expect(convResult!.blob).toBeInstanceOf(Blob);
        expect(convResult!.url).toMatch(/^blob:/);
        expect(convResult!.originalSize).toBe(pngFile.size);
        expect(convResult!.convertedSize).toBeGreaterThan(0);
    });

    it("preserves original filename base", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const file = new File(["data"], "my-vacation.png", { type: "image/png" });
        mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));

        let convResult: Awaited<ReturnType<typeof result.current.convertFile>> | undefined;
        await act(async () => {
            convResult = await result.current.convertFile(file, "webp");
        });

        expect(convResult!.fileName).toBe("my-vacation.webp");
    });

    it("builds correct FFmpeg command with format flags", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const file = new File(["data"], "song.mp3", { type: "audio/mpeg" });
        mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));

        await act(async () => {
            await result.current.convertFile(file, "wav");
        });

        // exec should have been called with args including the codec
        const execArgs = mockExec.mock.calls[0][0];
        expect(execArgs).toContain("-i");
        expect(execArgs).toContain("pcm_s16le"); // WAV codec
        expect(execArgs).toContain("-y");
    });

    it("sets progress to 100 after completion", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const file = new File(["data"], "photo.png", { type: "image/png" });
        mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));

        await act(async () => {
            await result.current.convertFile(file, "jpg");
        });

        expect(result.current.progress).toBe(100);
    });

    it("cleans up virtual FS after conversion", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const file = new File(["data"], "photo.png", { type: "image/png" });
        mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));

        await act(async () => {
            await result.current.convertFile(file, "jpg");
        });

        // deleteFile should be called twice (input + output)
        expect(mockDeleteFile).toHaveBeenCalledTimes(2);
    });
});

// ── Error recovery (Aborted() handling) ─────────────────────

describe("Error recovery — exec() Aborted", () => {
    it("recovers output when exec throws but readFile succeeds", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const file = new File(["data"], "photo.png", { type: "image/png" });

        mockExec.mockRejectedValue(new Error("Aborted()"));
        mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));

        let convResult: Awaited<ReturnType<typeof result.current.convertFile>> | undefined;
        await act(async () => {
            convResult = await result.current.convertFile(file, "jpg");
        });

        // Should still return a valid result
        expect(convResult).toBeDefined();
        expect(convResult!.fileName).toBe("photo.jpg");
        expect(convResult!.convertedSize).toBeGreaterThan(0);
    });

    it("throws when both exec AND readFile fail", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const file = new File(["data"], "photo.png", { type: "image/png" });

        mockExec.mockRejectedValue(new Error("Aborted()"));
        mockReadFile.mockRejectedValue(new Error("File not found"));

        let thrownError: Error | undefined;
        try {
            await act(async () => {
                await result.current.convertFile(file, "jpg");
            });
        } catch (e) {
            thrownError = e as Error;
        }

        expect(thrownError).toBeDefined();
        expect(thrownError!.message).toContain("Aborted()");
    });

    it("throws when exec succeeds but output is empty", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const file = new File(["data"], "photo.png", { type: "image/png" });

        mockReadFile.mockResolvedValue(new Uint8Array([]));

        await expect(
            act(async () => {
                await result.current.convertFile(file, "jpg");
            })
        ).rejects.toThrow(/empty file/);
    });

    it("propagates error from failed conversion", async () => {
        const { result } = renderHook(() => useFFmpeg());
        const file = new File(["data"], "photo.png", { type: "image/png" });

        mockExec.mockRejectedValue(new Error("Aborted()"));
        mockReadFile.mockRejectedValue(new Error("WASM dead"));

        let thrownError: Error | undefined;
        try {
            await act(async () => {
                await result.current.convertFile(file, "jpg");
            });
        } catch (e) {
            thrownError = e as Error;
        }

        expect(thrownError).toBeDefined();
        expect(thrownError!.message).toBe("Aborted()");
    });
});

// ── Hook state management ───────────────────────────────────

describe("Hook state", () => {
    it("reset() clears progress", async () => {
        const { result } = renderHook(() => useFFmpeg());

        // Run a successful conversion to set progress
        const file = new File(["data"], "photo.png", { type: "image/png" });
        mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));

        await act(async () => {
            await result.current.convertFile(file, "jpg");
        });

        expect(result.current.progress).toBe(100);

        act(() => {
            result.current.reset();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.progress).toBe(0);
    });

    it("throws distinct errors for different failure modes", async () => {
        const { result } = renderHook(() => useFFmpeg());

        // Size error
        const bigFile = new File(
            [new ArrayBuffer(MAX_FILE_SIZE + 1)],
            "big.png",
            { type: "image/png" }
        );
        let sizeError: Error | undefined;
        try {
            await act(async () => {
                await result.current.convertFile(bigFile, "jpg");
            });
        } catch (e) { sizeError = e as Error; }

        // Format error
        const badFile = new File(["data"], "bad.xyz", { type: "text/plain" });
        let formatError: Error | undefined;
        try {
            await act(async () => {
                await result.current.convertFile(badFile, "png");
            });
        } catch (e) { formatError = e as Error; }

        // They should be different errors
        expect(sizeError!.message).not.toBe(formatError!.message);
        expect(sizeError!.message).toMatch(/exceeds/);
        expect(formatError!.message).toMatch(/Unsupported/);
    });
});

// ── Cross-format conversion matrix ──────────────────────────

describe("Cross-format conversion validation", () => {
    const validConversions = [
        // Image
        { input: "image/png", ext: "jpg", file: "test.png" },
        { input: "image/jpeg", ext: "webp", file: "test.jpg" },
        { input: "image/webp", ext: "png", file: "test.webp" },
        { input: "image/bmp", ext: "jpg", file: "test.bmp" },
        { input: "image/tiff", ext: "png", file: "test.tiff" },
        { input: "image/gif", ext: "mp4", file: "test.gif" },
        // Audio
        { input: "audio/mpeg", ext: "wav", file: "test.mp3" },
        { input: "audio/wav", ext: "mp3", file: "test.wav" },
        { input: "audio/ogg", ext: "flac", file: "test.ogg" },
        { input: "audio/aac", ext: "mp3", file: "test.aac" },
        { input: "audio/flac", ext: "ogg", file: "test.flac" },
        // Video
        { input: "video/mp4", ext: "webm", file: "test.mp4" },
        { input: "video/webm", ext: "mp4", file: "test.webm" },
        { input: "video/quicktime", ext: "mp4", file: "test.mov" },
        { input: "video/x-msvideo", ext: "mkv", file: "test.avi" },
        { input: "video/mp4", ext: "gif", file: "test.mp4" },
    ];

    it.each(validConversions)(
        "accepts $input → $ext",
        async ({ input, ext, file: fileName }) => {
            const { result } = renderHook(() => useFFmpeg());
            const file = new File(["data"], fileName, { type: input });
            mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));

            let convResult: Awaited<ReturnType<typeof result.current.convertFile>> | undefined;
            await act(async () => {
                convResult = await result.current.convertFile(file, ext);
            });

            expect(convResult).toBeDefined();
            expect(convResult!.fileName).toContain(ext);
        }
    );

    const invalidConversions = [
        { input: "image/png", ext: "mp3", file: "test.png" },
        { input: "audio/mpeg", ext: "png", file: "test.mp3" },
        { input: "video/mp4", ext: "flac", file: "test.mp4" },
        { input: "application/pdf", ext: "jpg", file: "test.pdf" },
    ];

    it.each(invalidConversions)(
        "rejects $input → $ext",
        async ({ input, ext, file: fileName }) => {
            const { result } = renderHook(() => useFFmpeg());
            const file = new File(["data"], fileName, { type: input });

            await expect(
                act(async () => {
                    await result.current.convertFile(file, ext);
                })
            ).rejects.toThrow(/Unsupported conversion/);
        }
    );
});
