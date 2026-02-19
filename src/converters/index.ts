// ─────────────────────────────────────────────────────────────
// Barrel export — importing this file triggers all category
// modules to self-register with the converter registry.
//
// Usage:  import { getInputFormat, ... } from "@/converters";
// ─────────────────────────────────────────────────────────────

// Side-effect imports: each one calls registerFormat()
import "./image";
import "./audio";
import "./video";

// Re-export everything the consumers need
export * from "./types";
export * from "./registry";
