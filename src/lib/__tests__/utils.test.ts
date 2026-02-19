// ─────────────────────────────────────────────────────────────
// Utility functions — unit tests
//
// Tests cn() (Tailwind class merging) and formatBytes()
// (human-readable file size formatting).
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { cn, formatBytes } from "@/lib/utils";

// ── cn() ────────────────────────────────────────────────────

describe("cn (class merging)", () => {
    it("merges simple classes", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles undefined and null gracefully", () => {
        expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
    });

    it("handles empty string", () => {
        expect(cn("")).toBe("");
    });

    it("handles no arguments", () => {
        expect(cn()).toBe("");
    });

    it("merges conflicting Tailwind classes (last wins)", () => {
        // tailwind-merge should resolve p-4 + p-2 → p-2
        expect(cn("p-4", "p-2")).toBe("p-2");
    });

    it("handles conditional classes", () => {
        const isActive = true;
        expect(cn("base", isActive && "active")).toBe("base active");
    });

    it("handles false conditional classes", () => {
        const isActive = false;
        expect(cn("base", isActive && "active")).toBe("base");
    });
});

// ── formatBytes() ───────────────────────────────────────────

describe("formatBytes", () => {
    it("formats 0 bytes", () => {
        expect(formatBytes(0)).toBe("0 B");
    });

    it("formats bytes (< 1 KB)", () => {
        expect(formatBytes(500)).toBe("500 B");
    });

    it("formats exactly 1 KB", () => {
        expect(formatBytes(1024)).toBe("1 KB");
    });

    it("formats kilobytes", () => {
        expect(formatBytes(1536)).toBe("1.5 KB");
    });

    it("formats megabytes", () => {
        expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
    });

    it("formats fractional megabytes", () => {
        expect(formatBytes(3.2 * 1024 * 1024)).toBe("3.2 MB");
    });

    it("formats gigabytes", () => {
        expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2 GB");
    });

    it("formats 50 MB (the file size limit)", () => {
        expect(formatBytes(50 * 1024 * 1024)).toBe("50 MB");
    });

    it("rounds to 1 decimal place", () => {
        // 1.23 MB → "1.2 MB"
        const bytes = 1.23 * 1024 * 1024;
        expect(formatBytes(bytes)).toBe("1.2 MB");
    });

    it("drops trailing zero", () => {
        // Exactly 2 MB → "2 MB" not "2.0 MB"
        expect(formatBytes(2 * 1024 * 1024)).toBe("2 MB");
    });
});
