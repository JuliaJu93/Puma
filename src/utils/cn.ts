import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge ships a fixed idea of Tailwind's default theme and has no
 * way to see this project's `@theme` extensions in src/styles/index.css.
 * Left at its defaults it misreads our `text-control-{sm,md,lg}` / `text-title`
 * (font-size tokens) as belonging to the same group as `text-{role}` color
 * utilities (`text-fg`, `text-accent`, …) — both start with `text-` and
 * neither matches its built-in keyword lists — so it silently drops
 * whichever one appears first, e.g. `twMerge("text-fg-on-accent", "text-control-md")`
 * → only `"text-control-md"` survives. Registering our font-size tokens here
 * tells it those are a different property than text color, so both classes
 * are kept instead of one being "merged away".
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["control-sm", "control-md", "control-lg", "title"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
