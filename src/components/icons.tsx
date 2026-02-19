// ─────────────────────────────────────────────────────────────
// Inline SVG icons — no external icon library dependency.
// Each component accepts an optional className prop for sizing.
// ─────────────────────────────────────────────────────────────

interface IconProps {
    className?: string;
}

const svgBase = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

export function ShieldIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}

export function UploadIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    );
}

export function DownloadIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

export function ImageIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    );
}

export function XIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

export function CheckIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

export function ArrowRightIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    );
}

export function MusicIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </svg>
    );
}

export function VideoIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <rect x="2" y="4" width="15" height="16" rx="2" />
            <path d="m22 7-5 3 5 3V7Z" />
        </svg>
    );
}

export function FileIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}

export function InfoIcon({ className }: IconProps) {
    return (
        <svg className={className} {...svgBase}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}
