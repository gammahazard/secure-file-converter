import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure File Converter — 100% Local File Conversion",
  description:
    "Convert images, audio, and video between PNG, JPG, WebP, MP3, WAV, MP4, WebM, and more — instantly in your browser. No uploads, no servers — your files never leave your device.",
  keywords: [
    "image converter",
    "audio converter",
    "video converter",
    "file converter",
    "PNG to JPG",
    "MP3 to WAV",
    "MP4 to WebM",
    "WebP converter",
    "local converter",
    "privacy",
    "offline",
    "WASM",
  ],
  robots: "index, follow",
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
