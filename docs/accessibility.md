# Contrast audit

WCAG 2.1 AA thresholds used below:

- **4.5:1** — normal text (anything not qualifying as "large text")
- **3:1** — large text (≥18px regular, or ≥14px/18.66px at 700+ weight) and
  **non-text UI components** (borders, focus indicators, icons) per
  [1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
- **Disabled controls are exempt** from both — WCAG only requires contrast
  for content that conveys information the user needs to perceive to use
  the interface, and a disabled control isn't actionable. Ratios for
  disabled pairs are listed below for completeness, not as failures.

None of the values below were changed to pass — per `STEP-3-TOKENS.md`,
design values are recorded and traced, not adjusted to fix contrast. Every
hex here traces to `docs/design-spec.md` §1.

## Passing pairs

| Pair | Ratio | Needs | Where |
|---|---|---|---|
| `--color-fg` (`#4b4b4b`) on `--color-surface` (`#fff`) | 8.72:1 | 4.5:1 | body text, filled input, Outline/Ghost button text |
| `--color-fg-heading` (`#1f1f1f`) on `--color-surface` | 16.48:1 | 4.5:1 | Dialog title |
| `--color-fg-muted` (`#8e8e8e`) on `--color-surface` | 3.28:1 | 3:1 (icon, non-text) | icon default tint |
| `--color-danger-pressed` (`#ec2d30`) on `--color-surface` | 4.21:1 | 3:1 (non-text) | Danger-Outline pressed border |
| `--color-border-error` (`#f64c4c`) on `--color-surface` | 3.47:1 | 3:1 (non-text) | Input error border |

## Known failures — disabled (exempt, recorded for completeness)

| Pair | Ratio | Where |
|---|---|---|
| `--color-fg-disabled` / `--color-fg-subtle` (`#cacaca`) on `--color-surface` | 1.64:1 | Button/Link disabled text, Input placeholder |
| `--color-input-fg-disabled` (`#e1e1e1`) on `--color-surface-disabled` (`#fafafa`) | 1.25:1 | Input disabled text |
| `--color-link-fg-disabled` (`#7ddde1`) on `--color-surface` | 1.58:1 | Link disabled text |
| `--color-danger-disabled-fg` (`#f49898`) on `--color-surface` | 2.14:1 | Outline/Link-danger disabled border+text |
| white on `--color-accent-disabled` (`#b0ebec`) | 1.32:1 | Primary disabled bg |
| white on `--color-danger-disabled-fill` (`#ffccd2`) | 1.42:1 | Primary-danger disabled bg |
| `--color-border-disabled` (`#eeeeee`) on `--color-surface` | 1.16:1 | disabled Outline/Input border |

## Known failures — active states (not exempt — real, spec-inherited limitations)

These are **not** disabled-state exemptions. They're the brand and danger
ramps' base/hover/pressed values used at normal text size, and they fall
short of AA on white regardless of interaction state. This is a property of
the palette itself (mid-lightness teal/red can't clear 4.5:1 on white at
these saturations), not something introduced by the token layer — worth
knowing before it comes up.

| Pair | Ratio | Needs | Where |
|---|---|---|---|
| white on `--color-accent` (`#15c5ce`) | 2.12:1 | 4.5:1 (label text) | Primary button, default state |
| white on `--color-accent-hover` (`#47cfd6`) | 1.88:1 | 4.5:1 | Primary button, hover |
| white on `--color-accent-pressed` (`#00abb6`) | 2.80:1 | 4.5:1 | Primary button, pressed |
| white on `--color-danger` (`#f64c4c`) | 3.47:1 | 4.5:1 | Primary-danger button, default |
| white on `--color-danger-hover` (`#eb6f70`) | 2.98:1 | 4.5:1 | Primary-danger button, hover |
| white on `--color-danger-pressed` (`#ec2d30`) | 4.21:1 | 4.5:1 | Primary-danger button, pressed (closest to passing) |
| `--color-accent` (`#15c5ce`) on white | 2.12:1 | 4.5:1 | Outline/Link button text, default |
| `--color-accent-hover` (`#47cfd6`) on white | 1.88:1 | 4.5:1 | Outline/Link button text, hover |
| `--color-danger` (`#f64c4c`) on white | 3.47:1 | 4.5:1 | Outline/Link-danger text, Input error text, default |
| `--color-danger-hover` (`#eb6f70`) on white | 2.98:1 | 4.5:1 | Outline/Link-danger text, hover |
| `--color-fg-muted` (`#8e8e8e`) on white, as **text** (not icon) | 3.28:1 | 4.5:1 | Input prefix/suffix text |
| `--color-border-focus` (`#15c5ce`) on white | 2.12:1 | 3:1 (non-text) | Input focus border |

**Worth flagging explicitly for the presentation:** the Input focus border
and every Outline/Link/Primary text-on-brand pairing fail AA at their
*active*, non-disabled state — including the most prominent one, the
default Primary button. Fixing it would mean darkening the brand/danger
"500" base colors, which is a design-value change outside this step's
scope (`STEP-3-TOKENS.md`: don't invent or adjust spec values). Flagging it
here is the deliverable; changing the ramp is a decision for whoever owns
the Figma file.

## Focus ring (added in Step 4, Task 2)

Figma has no distinct focus-visible state for Button (spec §4 lists only
Default/Hover/Pressed/Disabled), and Input folds focus into a combined
"Pressed & Focus" state with no separate visible-focus treatment. Neither
is a substitute for a real `:focus-visible` indicator, so `--focus-ring-color`
/ `--focus-ring-width` / `--focus-ring-offset` were added net-new to
`src/styles/index.css` and are applied only via `:focus-visible` (never
`:focus`, so mouse users don't see them).

The ring reuses `--color-border-focus` (`#15c5ce`) rather than inventing a
new hue. That inherits the existing known failure above: `#15c5ce` on white
is 2.12:1 against the 3:1 non-text-contrast threshold. Recorded here rather
than silently accepted — same underlying palette limitation as the Input
focus border, not a new problem introduced by the ring itself.
