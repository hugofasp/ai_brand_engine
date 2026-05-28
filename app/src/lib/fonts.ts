/**
 * Font loaders.
 *
 * The platform now ships with NO custom web fonts loaded by default —
 * titles, body and mono all render from the operating system's native
 * stack (defined in `globals.css` via the --font-display / --font-sans
 * / --font-mono tokens). This keeps the platform fast (no font swap
 * flash, no external download) and consistent with the terminal
 * aesthetic (system fonts feel like tools, not marketing).
 *
 * The loaders below are no-ops kept around so `layout.tsx` can still
 * apply a `className` without crashing the import path. If we ever
 * want to layer in a custom font for a specific use case, drop the
 * `next/font/google` import back in.
 */

export const fraunces = { variable: "" };
export const inter = { variable: "" };
export const jetbrainsMono = { variable: "" };
