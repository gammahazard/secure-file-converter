import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://secure-file-converter.vercel.app"),
  title: "Secure File Converter — 100% Local File Conversion",
  description:
    "Convert images, audio, and video between PNG, JPG, WebP, MP3, WAV, MP4, WebM, and more — instantly in your browser. No uploads, no servers — your files never leave your device.",
  keywords: [
    "file converter",
    "image converter",
    "audio converter",
    "video converter",
    "PNG to JPG",
    "MP3 to WAV",
    "MP4 to WebM",
    "WebP converter",
    "local converter",
    "privacy",
    "offline",
    "WebAssembly",
    "FFmpeg",
    "browser converter",
  ],
  robots: "index, follow",
  openGraph: {
    type: "website",
    title: "Secure File Converter",
    description: "Convert images, audio & video — 100% in your browser. No uploads, no servers.",
    siteName: "Secure File Converter",
  },
  other: {
    "theme-color": "#0f0f14",
    "color-scheme": "dark",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
