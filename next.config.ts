import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Turbopack compatibility (Next.js 16 defaults to Turbopack)
  turbopack: {},

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ── Cross-Origin Isolation (required for SharedArrayBuffer / FFmpeg.wasm) ──
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },

          // ── Content Security Policy ──
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:", // unsafe-eval for WASM, blob: for FFmpeg worker
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'", // required for Tailwind/Shadcn
              "img-src 'self' blob: data:",
              "font-src 'self' data:",
              "connect-src 'self' blob:" + (isDev ? " ws://localhost:*" : ""), // ws: for HMR in dev only
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },

          // ── Additional Security Headers ──
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
