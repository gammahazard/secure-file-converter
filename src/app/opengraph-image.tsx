import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Secure File Converter — 100% Local File Conversion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0f0f14 0%, #1a1028 40%, #0f1a2a 70%, #0f0f14 100%)",
                    fontFamily: "Inter, system-ui, sans-serif",
                }}
            >
                {/* Shield icon */}
                <div
                    style={{
                        width: 100,
                        height: 100,
                        borderRadius: 24,
                        background: "linear-gradient(135deg, #7c3aed, #22d3ee)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 32,
                        boxShadow: "0 0 60px rgba(124, 58, 237, 0.3)",
                    }}
                >
                    <svg
                        width="52"
                        height="52"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </div>

                {/* Title */}
                <div
                    style={{
                        fontSize: 56,
                        fontWeight: 700,
                        color: "white",
                        letterSpacing: "-0.02em",
                        marginBottom: 16,
                    }}
                >
                    Secure File Converter
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontSize: 24,
                        color: "rgba(255, 255, 255, 0.5)",
                        maxWidth: 700,
                        textAlign: "center",
                        lineHeight: 1.5,
                    }}
                >
                    Convert images, audio & video — right in your browser.
                    No uploads. No servers. 100% private.
                </div>

                {/* Format badges */}
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        marginTop: 36,
                    }}
                >
                    {["PNG", "JPG", "MP3", "WAV", "MP4", "WebM", "GIF"].map(
                        (fmt) => (
                            <div
                                key={fmt}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: 999,
                                    background: "rgba(255, 255, 255, 0.06)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    color: "rgba(255, 255, 255, 0.6)",
                                    fontSize: 16,
                                    fontWeight: 500,
                                }}
                            >
                                {fmt}
                            </div>
                        )
                    )}
                </div>
            </div>
        ),
        { ...size }
    );
}
