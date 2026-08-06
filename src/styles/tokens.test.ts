import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Parses src/styles/index.css directly (not the built dist/ output — that's
 * tree-shaken by Tailwind to only what's actually referenced by a class
 * name somewhere, see the comment at the top of index.css) and asserts the
 * token layer matches docs/design-spec.md. Catches a mistyped hex, which is
 * otherwise invisible until someone eyeballs a screenshot.
 */
const CSS_PATH = join(__dirname, "index.css");
const rawCss = readFileSync(CSS_PATH, "utf8");
const cssWithoutComments = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

function parseTokens(source: string): Map<string, string> {
  const tokens = new Map<string, string>();
  const pattern = /--([a-zA-Z0-9-]+):\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    const [, name, rawValue] = match;
    tokens.set(name, rawValue.trim().replace(/\s+/g, " "));
  }
  return tokens;
}

function resolve(tokens: Map<string, string>, name: string): string {
  const value = tokens.get(name);
  if (value === undefined) {
    throw new Error(`Token --${name} is not declared in index.css`);
  }
  const varMatch = value.match(/^var\(--([a-zA-Z0-9-]+)\)$/);
  return varMatch ? resolve(tokens, varMatch[1]) : value;
}

const tokens = parseTokens(cssWithoutComments);

describe("primitive ramps match design-spec.md §1", () => {
  const primitives: Record<string, string> = {
    "neutral-50": "#ffffff",
    "neutral-100": "#fafafa",
    "neutral-200": "#f5f5f5",
    "neutral-300": "#eeeeee",
    "neutral-400": "#e1e1e1",
    "neutral-500": "#cacaca",
    "neutral-600": "#8e8e8e",
    "neutral-700": "#4b4b4b",
    "neutral-800": "#1f1f1f",
    "neutral-900": "#000000",
    "brand-100": "#b0ebec",
    "brand-200": "#7ddde1",
    "brand-300": "#47cfd6",
    "brand-500": "#15c5ce",
    "brand-700": "#00abb6",
    "danger-50": "#fef2f2",
    "danger-100": "#ffccd2",
    "danger-200": "#f49898",
    "danger-300": "#eb6f70",
    "danger-500": "#f64c4c",
    "danger-600": "#ec2d30",
    "warning-500": "#ffad0d",
  };

  it.each(Object.entries(primitives))("--color-%s is %s", (name, expected) => {
    expect(tokens.get(`color-${name}`)).toBe(expected);
  });
});

describe("semantic tokens resolve to the expected primitive value", () => {
  const semantics: Record<string, string> = {
    "color-surface": "#ffffff",
    "color-surface-disabled": "#fafafa",
    "color-fg": "#4b4b4b",
    "color-fg-muted": "#8e8e8e",
    "color-fg-subtle": "#cacaca",
    "color-fg-disabled": "#cacaca",
    "color-fg-heading": "#1f1f1f",
    "color-fg-on-accent": "#ffffff",
    "color-input-fg-disabled": "#e1e1e1",
    "color-link-fg-disabled": "#7ddde1",
    "color-border": "#e1e1e1",
    "color-border-disabled": "#eeeeee",
    "color-border-focus": "#15c5ce",
    "color-border-error": "#f64c4c",
    "color-accent": "#15c5ce",
    "color-accent-hover": "#47cfd6",
    "color-accent-pressed": "#00abb6",
    "color-accent-disabled": "#b0ebec",
    "color-danger": "#f64c4c",
    "color-danger-hover": "#eb6f70",
    "color-danger-pressed": "#ec2d30",
    "color-danger-disabled-fill": "#ffccd2",
    "color-danger-disabled-fg": "#f49898",
  };

  it.each(Object.entries(semantics))("--%s resolves to %s", (name, expected) => {
    expect(resolve(tokens, name)).toBe(expected);
  });

  it("--color-overlay is neutral-900 (#000000) at 30% opacity", () => {
    expect(tokens.get("color-overlay")).toBe("rgb(0 0 0 / 0.3)");
  });
});

describe("non-color tokens match design-spec.md §2 / §3", () => {
  const nonColorTokens: Record<string, string> = {
    "text-control-sm": "0.75rem",
    "text-control-sm--line-height": "1.125rem",
    "text-control-md": "0.875rem",
    "text-control-md--line-height": "1.375rem",
    "text-control-lg": "1rem",
    "text-control-lg--line-height": "1.5rem",
    "text-title": "1.125rem",
    "text-title--line-height": "1.625rem",
    "radius-control": "4px",
    "radius-pill": "100px",
    "border-width-default": "1px",
    "spacing-control-lg": "40px",
    "spacing-control-md": "36px",
    "spacing-control-sm": "24px",
    "spacing-control-py-md": "7px",
    "spacing-control-py-sm": "3px",
    "spacing-iconbutton-p-lg": "11px",
  };

  it.each(Object.entries(nonColorTokens))("--%s is %s", (name, expected) => {
    expect(tokens.get(name)).toBe(expected);
  });

  it("--shadow-dialog is the two-layer drop shadow from design-spec §3", () => {
    expect(tokens.get("shadow-dialog")).toBe(
      "0px 24px 60px rgba(0, 0, 0, 0.12), 0px 8px 20px rgba(0, 0, 0, 0.06)",
    );
  });

  it("--font-sans keeps PingFang SC first with a Latin fallback chain", () => {
    expect(tokens.get("font-sans")).toBe(
      '"PingFang SC", -apple-system, "Segoe UI", Roboto, sans-serif',
    );
  });
});

/**
 * The type-scale assertions above compare rem *strings*, which means they
 * restate whatever index.css happens to say and cannot catch a bad
 * rem conversion — `1.5rem` labelled `/* 18px *\/` passes a string check
 * while actually being 24px. These assertions convert to px and compare
 * against the px pairs in docs/design-spec.md §2, so the arithmetic itself
 * is what's under test.
 */
describe("type scale converts to the px values in design-spec.md §2", () => {
  const REM_BASE = 16;

  function toPx(name: string): number {
    const value = resolve(tokens, name);
    const match = value.match(/^([\d.]+)rem$/);
    if (!match) {
      throw new Error(`Token --${name} is "${value}", expected a rem value`);
    }
    return Number(match[1]) * REM_BASE;
  }

  const scale: Array<[string, number, number]> = [
    // [token prefix, font-size px, line-height px]
    ["text-control-sm", 12, 18],
    ["text-control-md", 14, 22],
    ["text-control-lg", 16, 24],
    ["text-title", 18, 26],
  ];

  it.each(scale)("--%s is %spx / %spx", (name, sizePx, lineHeightPx) => {
    expect(toPx(name)).toBe(sizePx);
    expect(toPx(`${name}--line-height`)).toBe(lineHeightPx);
  });

  it("Small's line-height fits inside the 24px Small control height", () => {
    // design-spec §3: Small control height is 24px with 3px vertical padding,
    // so the line box has exactly 18px to occupy. A larger line-height
    // silently pushes the control past its specified height.
    const lineHeight = toPx("text-control-sm--line-height");
    const verticalPadding = 3 * 2;
    expect(lineHeight + verticalPadding).toBe(24);
  });
});
