# Contributing to Secure File Converter

Thanks for your interest! This guide explains how to add new conversion formats — the most common contribution.

## Adding a New Format

The app uses a **self-registering converter registry**. To add a new format:

### 1. Pick the right category file

| Category | File |
|----------|------|
| Image | `src/converters/image.ts` |
| Audio | `src/converters/audio.ts` |
| Video | `src/converters/video.ts` |

### 2. Add an output preset

```typescript
const AVIF: FormatInfo = {
  label: "AVIF",
  extension: "avif",
  mime: "image/avif",
  ffmpegFlags: ["-codec:v", "libaom-av1", "-still-picture", "1"],
  category: "image",
};
```

### 3. Register the input format (if new)

```typescript
registerFormat("image/avif", {
  label: "AVIF",
  mime: "image/avif",
  extensions: ["avif"],
  category: "image",
  outputs: [PNG, JPG, WEBP],
});
```

### 4. Add the output to existing input formats

Add `AVIF` to the `outputs` array of any existing format that should be able to convert **to** AVIF.

That's it — no other files need changing. The registry, UI, and FFmpeg hook all pick up the new format automatically.

## Development Setup

```bash
npm install      # also runs postinstall to fetch FFmpeg WASM
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run lint     # lint check
```

## Guidelines

- Keep component files under 100 lines
- All conversion logic stays in `src/converters/`
- Test new formats manually (drag-and-drop + convert + download)
- Ensure `npm run build` passes with zero errors
