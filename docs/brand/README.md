# ClipArk brand assets

Source files for the logo, the app icon and the menu bar icon. These are the masters —
nothing here is loaded at runtime.

## Palette

| Token | Hex | Used for |
|---|---|---|
| Ark Green | `#65BC80` | The robot's face. The only brand colour |
| Ark Ink | `#1C1C1E` | Outlines, wordmark, app icon plate |
| Paper | `#FFFFFF` | The knockout variant's outlines and features |

The green is sampled from `logotipo-branco-clip-ark.png` rather than eyeballed — if you
redraw the mark, resample it and update this table.

Note that the app's *interface* accent is iOS blue `#0A84FF` (see `tailwind.config.js`),
not the brand green. That's deliberate: green marks the product, blue marks selection.

## Files

| File | Size | What it is | Use it when |
|---|---|---|---|
| `logo-preto-clip-ark.png` | 1780×1024 | Full lockup — mark + wordmark, dark ink | Light backgrounds |
| `logo-branco-clip-ark.png` | 1780×1024 | Full lockup, white ink | Dark backgrounds |
| `logomarca-preto-clip-ark.png` | 1780×542 | Wordmark only, dark | Tight horizontal space |
| `logomarca-branco-clip-ark.png` | 1780×542 | Wordmark only, white | Same, on dark |
| `logotipo-preto-clip-ark.png` | 548×518 | Symbol only — green face, dark outline | Light backgrounds, tray source |
| `logotipo-branco-clip-ark.png` | 548×518 | Symbol only — green face, white outline | Dark backgrounds, app icon source |
| `icon-master-1024.png` | 1024×1024 | The app icon master | Input to `tauri icon` |

> The naming is inverted from the usual Portuguese convention: here `logotipo` is the
> symbol and `logomarca` is the wordmark. Kept as-is to match the original delivery.

> [!WARNING]
> The `logomarca-*` files are still exported on a canvas that clips the descender of the
> **p** in *Clip*. The full lockups were re-exported taller to fix exactly that — the
> wordmark-only pair needs the same treatment before it is used anywhere. Nothing in the
> repo references them today.

If you re-export any lockup, re-render the README media that embeds it:
`docs/assets/hero-dark.png`, `hero-light.png` and `social-preview.png`.

## Usage

- **Never** put the mark on a background that clashes with the green. Pick the variant
  whose outline contrasts with the background: white ink on dark, dark ink on light.
- Don't recolour, rotate, add effects to, or squash the mark. It already leans.
- Leave clear space around the lockup at least equal to the height of the antenna ball.
- The app UI itself carries **no logo**. The launcher is search, chips and cards — that
  is intentional, so please don't add one.

## Regenerating the app icons

`icon-master-1024.png` is the mark centred on a dark macOS squircle. The shape follows
Apple's grid: an 824×824 superellipse inside a 1024×1024 canvas, with the remaining
margin holding the baked-in shadow.

```bash
npx tauri icon docs/brand/icon-master-1024.png
```

This rewrites every file in `src-tauri/icons/` — `icon.icns`, `icon.ico`, the PNG sizes
and the Windows Store set. It also emits `android/` and `ios/` directories; this project
has no mobile targets, so delete them.

The bundle list in `src-tauri/tauri.conf.json` does not need editing — the filenames
stay the same.

## Regenerating the tray icon

`src-tauri/icons/tray.png` is **not** produced by `tauri icon`, and that command leaves
it alone.

It is a 44×44 macOS *template* image: pure black plus alpha, which lets AppKit recolour
it for light menu bars, dark menu bars and the highlighted state. `tray.rs` loads it with
`icon_as_template(true)`.

Flattening the mark to a silhouette would bury the eyes and the smile in one solid blob,
so the green face is keyed out to transparent instead. What stays opaque is the outline,
the antenna, the ears, the eyes and the smile — which still reads as a robot at 22 pt.

If you redraw the mark, rebuild the tray icon the same way: key out the green at full
source resolution, *then* downscale, so the anti-aliased edges survive.
