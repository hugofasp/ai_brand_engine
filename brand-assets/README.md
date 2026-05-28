# brand.soul OS · brand kit

Visual identity assets for the platform. Use these for press kits, internal docs, social embeds, third-party integrations.

## The mark

The `>` chevron is the prompt sigil — the terminal voice of the platform. It says "the OS is speaking."

| File | Use |
|---|---|
| `mark-black.svg` | Standard mark for light backgrounds |
| `mark-white.svg` | Reversed mark for dark backgrounds |
| `mark-purple.svg` | Brand-identity mark. Use sparingly: the chevron in purple is the platform's signature, equivalent to a logo in colour |
| `mark-{color}-1024.png` | 1024×1024 raster, for places that don't accept SVG (social profile pictures, slack icons, etc.) |
| `mark-{color}-512.png` | 512×512 raster |

## The wordmark

Full logo with `>` prompt + lowercase `brand.soul OS` lockup. The `.soul` suffix is always purple.

| File | Use |
|---|---|
| `wordmark-black.svg` | Standard wordmark for light backgrounds |
| `wordmark-white.svg` | Reversed wordmark for dark backgrounds (uses lighter purple `#a78bfa` for the sigil + `.soul` so it stays legible on black) |
| `wordmark-{color}-960.png` | 960×160 raster |

## Brand colours

| Token | Hex | Use |
|---|---|---|
| Primary text / mark on light bg | `#0a0a0a` | Body, mark default |
| Reversed text / mark on dark bg | `#ffffff` | Body on dark surfaces |
| Brand purple | `#8b5cf6` | Prompt sigil, `.soul` suffix, platform-identity moments |
| Brand purple (strong) | `#7c3aed` | Hover/active state on interactive surfaces |
| Brand purple (soft, dark-bg) | `#a78bfa` | Sigil / `.soul` accents on dark backgrounds for legibility |

## Typography

Monospace, system stack. The wordmark is set in the OS monospace (`ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`). Letter-spacing slightly tightened (`-0.01em`).

## Rules

1. **The chevron is always the prompt sigil**: it precedes the wordmark and never floats alone outside that context, except as a standalone mark (favicon, profile picture, etc.).
2. **Casing is fixed**: `brand` lowercase, `.soul` lowercase, `OS` uppercase. Never `Brand.soul OS`, `brand.soul os`, or `Brand Soul OS`.
3. **Purple is scarce**: reserved for the sigil and `.soul` suffix at rest. The platform-identity colour is the mark, not a background fill.
4. **No em-dashes** anywhere in user-facing copy.

## Favicon

The web favicon lives at `app/src/app/icon.svg`. It auto-adapts to the browser tab's colour scheme via embedded CSS:

- Light browser theme → black chevron
- Dark browser theme → white chevron

Apple touch icon (`app/src/app/apple-icon.png`) is the black variant at 180×180.
