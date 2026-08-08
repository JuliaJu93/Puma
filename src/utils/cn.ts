import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge ships a fixed idea of Tailwind's default theme and has no
 * way to see this project's `@theme` extensions in src/styles/index.css. Left
 * at its defaults it doesn't recognize our custom-keyed utilities as
 * belonging to the group their prefix implies, so conflicting classes that
 * SHOULD dedupe (last one wins) both survive instead — verified two ways:
 *
 * - `text-control-{sm,md,lg}` / `text-title` (font-size) vs `text-{role}`
 *   color utilities (`text-fg`, `text-accent`, …): both start with `text-`
 *   and neither matches tailwind-merge's built-in keyword lists, so it
 *   guesses wrong and drops whichever appears first —
 *   `twMerge("text-fg-on-accent", "text-control-md")` → only the size
 *   survives, silently losing the color.
 * - `h-control-*` / `min-w-button-*` / `w-dialog-*` vs plain Tailwind
 *   `h-auto` / `min-w-0` / `w-64`: tailwind-merge doesn't recognize the
 *   custom suffix as belonging to the `h` / `min-w` / `w` group at all, so
 *   an override meant to replace one of these (e.g. Button's Link variant
 *   clearing `h-control-lg` back to `h-auto`) is silently ignored — both
 *   classes end up in the output and the DOM's cascade order decides, not
 *   ours. Caught by computed-style verification in Storybook, not by
 *   reading the class string.
 *
 * The group ids below (`h`, `min-w`, `w`, `size`, `p`, `py`, `rounded`,
 * `font-size`) are tailwind-merge's own internal names, not invented —
 * confirmed via `getDefaultConfig().classGroups` rather than guessed, since a
 * guessed name that doesn't match silently no-ops instead of erroring.
 * `size` also carries `control-*` (not just `icon-*`) and `rounded` carries
 * `pill` alongside `control`; `py` covers the same `control-py-*` key `h`
 * already needs it for — all needed for Button's icon-only geometry override
 * (`size-control-*` replacing `h-control-*`, `p-iconbutton-p-*` replacing
 * `py-control-py-*`, `rounded-pill` replacing `rounded-control` — see
 * design-spec §4 "Padding and square dimensions"). Registering `p` alone
 * isn't enough: tailwind-merge doesn't infer that an all-sides `p-*`
 * override should also beat an unrecognized custom `py-*` — each axis needs
 * its own group entry, same as `h` and `size` both needing `control-*`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["control-sm", "control-md", "control-lg", "title"] }],
      h: [{ h: ["control-sm", "control-md", "control-lg"] }],
      "min-w": [{ "min-w": ["button-sm", "button-md", "button-lg"] }],
      w: [{ w: ["dialog-sm", "dialog-md", "dialog-lg"] }],
      size: [{ size: ["icon-sm", "icon-md", "icon-lg", "control-sm", "control-md", "control-lg"] }],
      p: [{ p: ["iconbutton-p-lg", "iconbutton-p-md", "iconbutton-p-sm"] }],
      py: [{ py: ["control-py-sm", "control-py-md"] }],
      rounded: [{ rounded: ["control", "pill"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
