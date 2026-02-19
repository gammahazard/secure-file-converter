// ─────────────────────────────────────────────────────────────
// Component rendering tests
//
// Verifies that all major UI components render correctly with
// the expected content, props, and accessibility attributes.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import React from "react";

// ── DropZone ────────────────────────────────────────────────

describe("DropZone", () => {
    // Dynamic import to avoid side-effect issues with module registration
    const loadDropZone = async () => {
        const mod = await import("@/components/drop-zone");
        return mod.DropZone;
    };

    it("renders the drop zone with upload prompt", async () => {
        const DropZone = await loadDropZone();
        render(<DropZone onFilesSelected={vi.fn()} error={null} />);
        expect(screen.getByText("Drop your files here")).toBeInTheDocument();
        expect(screen.getByText(/click to browse/)).toBeInTheDocument();
    });

    it("displays file size limit", async () => {
        const DropZone = await loadDropZone();
        render(<DropZone onFilesSelected={vi.fn()} error={null} />);
        expect(screen.getByText(/Max 50 MB/)).toBeInTheDocument();
    });

    it("shows error when provided", async () => {
        const DropZone = await loadDropZone();
        render(
            <DropZone onFilesSelected={vi.fn()} error="Unsupported format: application/pdf." />
        );
        expect(screen.getByText("Unsupported format: application/pdf.")).toBeInTheDocument();
    });

    it("has correct accessibility role", async () => {
        const DropZone = await loadDropZone();
        render(<DropZone onFilesSelected={vi.fn()} error={null} />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has a hidden file input with multiple attribute", async () => {
        const DropZone = await loadDropZone();
        const { container } = render(
            <DropZone onFilesSelected={vi.fn()} error={null} />
        );
        const input = container.querySelector("input[type='file']");
        expect(input).toBeInTheDocument();
        expect(input).toHaveClass("hidden");
        expect(input).toHaveAttribute("multiple");
    });

    it("calls onFilesSelected when files are chosen via input", async () => {
        const DropZone = await loadDropZone();
        const onFilesSelected = vi.fn();
        const { container } = render(
            <DropZone onFilesSelected={onFilesSelected} error={null} />
        );
        const input = container.querySelector("input[type='file']") as HTMLInputElement;
        const file = new File(["hello"], "test.png", { type: "image/png" });
        await userEvent.upload(input, file);
        expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });
});

// ── ConvertButton ───────────────────────────────────────────

describe("ConvertButton", () => {
    const loadConvertButton = async () => {
        const mod = await import("@/components/convert-button");
        return mod.ConvertButton;
    };

    it("shows 'Convert Now' when ready", async () => {
        const ConvertButton = await loadConvertButton();
        render(
            <ConvertButton onClick={vi.fn()} disabled={false} loading={false} converting={false} />
        );
        expect(screen.getByText("Convert Now")).toBeInTheDocument();
    });

    it("shows 'Loading converter engine…' when loading", async () => {
        const ConvertButton = await loadConvertButton();
        render(
            <ConvertButton onClick={vi.fn()} disabled={true} loading={true} converting={false} />
        );
        expect(screen.getByText("Loading converter engine…")).toBeInTheDocument();
    });

    it("shows 'Converting…' when converting", async () => {
        const ConvertButton = await loadConvertButton();
        render(
            <ConvertButton onClick={vi.fn()} disabled={true} loading={false} converting={true} />
        );
        expect(screen.getByText("Converting…")).toBeInTheDocument();
    });

    it("calls onClick when clicked", async () => {
        const ConvertButton = await loadConvertButton();
        const onClick = vi.fn();
        render(
            <ConvertButton onClick={onClick} disabled={false} loading={false} converting={false} />
        );
        await userEvent.click(screen.getByText("Convert Now"));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not fire onClick when disabled", async () => {
        const ConvertButton = await loadConvertButton();
        const onClick = vi.fn();
        render(
            <ConvertButton onClick={onClick} disabled={true} loading={false} converting={false} />
        );
        await userEvent.click(screen.getByText("Convert Now"));
        expect(onClick).not.toHaveBeenCalled();
    });
});

// ── ProgressBar ─────────────────────────────────────────────

describe("ProgressBar", () => {
    const loadProgressBar = async () => {
        const mod = await import("@/components/progress-bar");
        return mod.ProgressBar;
    };

    it("displays progress percentage", async () => {
        const ProgressBar = await loadProgressBar();
        render(<ProgressBar progress={42} />);
        expect(screen.getByText("42%")).toBeInTheDocument();
    });

    it("shows 'Processing…' label", async () => {
        const ProgressBar = await loadProgressBar();
        render(<ProgressBar progress={0} />);
        expect(screen.getByText("Processing…")).toBeInTheDocument();
    });

    it("displays 0% at start", async () => {
        const ProgressBar = await loadProgressBar();
        render(<ProgressBar progress={0} />);
        expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("displays 100% at completion", async () => {
        const ProgressBar = await loadProgressBar();
        render(<ProgressBar progress={100} />);
        expect(screen.getByText("100%")).toBeInTheDocument();
    });
});

// ── FileInfo ────────────────────────────────────────────────

describe("FileInfo", () => {
    const loadFileInfo = async () => {
        const mod = await import("@/components/file-info");
        return mod.FileInfo;
    };

    const mockFile = new File(["test content"], "photo.png", { type: "image/png" });

    // Helper: FileInfo uses Radix Tooltip internally, which requires TooltipProvider
    const renderFileInfo = (FileInfo: Awaited<ReturnType<typeof loadFileInfo>>, props: Record<string, unknown>) =>
        render(
            <TooltipProvider>
                <FileInfo file={mockFile} preview={null} formatLabel="PNG" category="image" canRemove={true} onRemove={vi.fn()} {...props} />
            </TooltipProvider>
        );

    it("displays file name", async () => {
        const FileInfo = await loadFileInfo();
        renderFileInfo(FileInfo, {});
        expect(screen.getByText("photo.png")).toBeInTheDocument();
    });

    it("displays format label", async () => {
        const FileInfo = await loadFileInfo();
        renderFileInfo(FileInfo, {});
        expect(screen.getByText(/PNG/)).toBeInTheDocument();
    });

    it("displays file size", async () => {
        const FileInfo = await loadFileInfo();
        renderFileInfo(FileInfo, {});
        // "12 B · PNG" — file content is "test content" = 12 bytes
        expect(screen.getByText(/12 B/)).toBeInTheDocument();
    });

    it("shows remove button when canRemove is true", async () => {
        const FileInfo = await loadFileInfo();
        renderFileInfo(FileInfo, { canRemove: true });
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("hides remove button when canRemove is false", async () => {
        const FileInfo = await loadFileInfo();
        renderFileInfo(FileInfo, { canRemove: false });
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders image preview when provided", async () => {
        const FileInfo = await loadFileInfo();
        renderFileInfo(FileInfo, { preview: "blob:http://localhost/fake" });
        expect(screen.getByAltText("Preview")).toBeInTheDocument();
    });
});

// ── ResultCard ──────────────────────────────────────────────

describe("ResultCard", () => {
    const loadResultCard = async () => {
        const mod = await import("@/components/result-card");
        return mod.ResultCard;
    };

    const mockResult = {
        blob: new Blob(["output"]),
        url: "blob:http://localhost/fake-output",
        fileName: "photo.jpg",
        originalSize: 1024 * 1024,  // 1 MB
        convertedSize: 512 * 1024,  // 0.5 MB = 50% reduction
    };

    it("shows 'Conversion complete!' message", async () => {
        const ResultCard = await loadResultCard();
        render(
            <ResultCard result={mockResult} isImage={false} onDownload={vi.fn()} onReset={vi.fn()} />
        );
        expect(screen.getByText("Conversion complete!")).toBeInTheDocument();
    });

    it("shows original and converted sizes", async () => {
        const ResultCard = await loadResultCard();
        render(
            <ResultCard result={mockResult} isImage={false} onDownload={vi.fn()} onReset={vi.fn()} />
        );
        expect(screen.getByText("1 MB")).toBeInTheDocument();
        expect(screen.getByText("512 KB")).toBeInTheDocument();
    });

    it("shows compression badge when file is smaller", async () => {
        const ResultCard = await loadResultCard();
        render(
            <ResultCard result={mockResult} isImage={false} onDownload={vi.fn()} onReset={vi.fn()} />
        );
        expect(screen.getByText("-50%")).toBeInTheDocument();
    });

    it("does not show compression badge when file is larger", async () => {
        const ResultCard = await loadResultCard();
        const largerResult = { ...mockResult, convertedSize: 2 * 1024 * 1024 };
        render(
            <ResultCard result={largerResult} isImage={false} onDownload={vi.fn()} onReset={vi.fn()} />
        );
        expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
    });

    it("shows download button with filename", async () => {
        const ResultCard = await loadResultCard();
        render(
            <ResultCard result={mockResult} isImage={false} onDownload={vi.fn()} onReset={vi.fn()} />
        );
        expect(screen.getByText(/Download photo\.jpg/)).toBeInTheDocument();
    });

    it("shows image preview when isImage is true", async () => {
        const ResultCard = await loadResultCard();
        render(
            <ResultCard result={mockResult} isImage={true} onDownload={vi.fn()} onReset={vi.fn()} />
        );
        expect(screen.getByAltText("Converted output")).toBeInTheDocument();
    });

    it("hides image preview when isImage is false", async () => {
        const ResultCard = await loadResultCard();
        render(
            <ResultCard result={mockResult} isImage={false} onDownload={vi.fn()} onReset={vi.fn()} />
        );
        expect(screen.queryByAltText("Converted output")).not.toBeInTheDocument();
    });

    it("calls onDownload when download button is clicked", async () => {
        const ResultCard = await loadResultCard();
        const onDownload = vi.fn();
        render(
            <ResultCard result={mockResult} isImage={false} onDownload={onDownload} onReset={vi.fn()} />
        );
        await userEvent.click(screen.getByText(/Download photo\.jpg/));
        expect(onDownload).toHaveBeenCalledTimes(1);
    });

    it("calls onReset when 'New' button is clicked", async () => {
        const ResultCard = await loadResultCard();
        const onReset = vi.fn();
        render(
            <ResultCard result={mockResult} isImage={false} onDownload={vi.fn()} onReset={onReset} />
        );
        await userEvent.click(screen.getByText("New"));
        expect(onReset).toHaveBeenCalledTimes(1);
    });
});

// ── Icons ───────────────────────────────────────────────────

describe("Icons", () => {
    const loadIcons = async () => import("@/components/icons");

    it("renders all icon components without error", async () => {
        const icons = await loadIcons();
        const iconComponents = [
            icons.ShieldIcon, icons.UploadIcon, icons.DownloadIcon,
            icons.ImageIcon, icons.XIcon, icons.CheckIcon,
            icons.ArrowRightIcon, icons.MusicIcon, icons.VideoIcon,
            icons.FileIcon, icons.InfoIcon,
        ];
        for (const Icon of iconComponents) {
            const { container } = render(<Icon className="h-4 w-4" />);
            expect(container.querySelector("svg")).toBeInTheDocument();
        }
    });

    it("passes className to SVG element", async () => {
        const { ShieldIcon } = await loadIcons();
        const { container } = render(<ShieldIcon className="h-6 w-6 text-red-500" />);
        const svg = container.querySelector("svg");
        expect(svg).toHaveClass("h-6", "w-6", "text-red-500");
    });
});
