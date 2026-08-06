# Step 3 — Build the token layer

**Audience: Sonnet.** This is an executable task spec. Follow it in order.

**Goal:** turn `docs/design-spec.md` into a working, tested, documented token system — with
**zero components built**. At the end, every color, size, and type style in the design exists
as a named token, is proven correct by a test, and is visible in Storybook.

---

## Context

Steps 1 and 2 are done and verified.

- **`docs/design-spec.md` is the single source of truth.** Every value in it was checked
  against the raw Figma API. Do not re-fetch from Figma, and do not invent values.
- The scaffold is green: build, lint, typecheck, Jest, Cypress, Storybook all pass.
- `src/styles/index.css` has an **empty `@theme` block** waiting to be filled.
- `src/components/Placeholder/` still exists. Leave it — step 4 deletes it.

---

## Decisions already made

| Thing | Decision |
|---|---|
| Tiers | **Primitive → Semantic.** Component-level tokens only where genuinely needed |
| Hard rule | Components may reference **only semantic tokens**, never primitives |
| Mechanism | Tailwind v4 `@theme`, which compiles tokens to CSS variables |
| Why | CSS variables give runtime theming and multi-brand support — the answer to *"how would you scale this?"* |

---

## Rules

1. **No components.** Not even a Button skeleton. This step is tokens only.
2. **No invented values.** If something is needed but not in the spec, add it to Open
   Questions instead of guessing.
3. Every token value must be traceable to a line in `docs/design-spec.md`.
4. Primitives describe **what a color is**. Semantics describe **what it's for**. Never name a
   primitive after a use case.

---

## Tasks

### 1. Primitive ramps

Read the palette from `docs/design-spec.md` §1 and build three ramps plus functional colors.

**Verify this ordering before using it** — it's derived from the spec but worth a sanity check:

- **Neutral** — the greys form a genuinely clean 10-step ramp, lightest to darkest:
  `#ffffff → #fafafa → #f5f5f5 → #eeeeee → #e1e1e1 → #cacaca → #8e8e8e → #4b4b4b → #1f1f1f → #000000`
- **Brand (teal)** — 5 steps: `#b0ebec → #7ddde1 → #47cfd6 → #15c5ce → #00abb6`
- **Danger (red)** — 6 steps: `#fef2f2 → #ffccd2 → #f49898 → #eb6f70 → #f64c4c → #ec2d30`
- **Functional** — `#ffad0d` (warning icon, Dialog/Warning only)

Number them on a conventional scale (`50`, `100`, … `900`) rather than naming them
`brand-hover` or `brand-disabled`. The ramps happen to map to interaction states in this
design, but that mapping belongs in the semantic layer — bake it into the primitive names and
the system stops being reusable the moment a second component uses teal differently.

Note in a comment that the base brand color (`#15c5ce`) and base danger (`#f64c4c`) are the
"500" of their ramps, so the naming stays intuitive.

### 2. Semantic tokens

This is the layer that matters, and the one the panel will probe. Build roles, not colors.

Cover at minimum:

- **Surface** — default, disabled
- **Foreground** — default, muted, subtle, disabled, heading, on-accent
- **Border** — default, disabled, focus, error
- **Accent** (brand) — base, hover, pressed, disabled
- **Danger** — base, hover, pressed, disabled, plus the separate disabled tints noted below
- **Overlay** — the dialog scrim

**Use this finding from the verified spec** (§4): on the default intent, Outline and Ghost
buttons **share one neutral foreground pair** — `#4b4b4b` at rest, `#cacaca` disabled. That
collapses into `--color-fg` and `--color-fg-disabled` rather than per-style tokens. This was a
correction made during the step 1 review; the design is more consistent than it first looked.

Three real inconsistencies from the spec's Open Questions need a **decision, recorded in a
comment** next to the token:

1. The danger ramp uses **two** disabled tints — `#ffccd2` for fills, `#f49898` for
   borders/text — while brand uses one (`#b0ebec`) for everything. Unify or keep both?
2. Input disabled text (`#e1e1e1`) differs from Button disabled text (`#cacaca`). One
   `fg-disabled` token or two?
3. Ghost/danger changes text color on Pressed but not Hover. Replicate or normalize?

Pick an answer for each, write one sentence of reasoning, and move on. Having a *reasoned*
answer matters more than which one you pick — these are exactly the trade-off questions the
presentation asks about.

### 3. Non-color tokens

From spec §2 and §3:

- **Type scale** — 12/18, 14/22, 16/24, 18/26, with weights 400 and 500
- **Radius** — `4px` (everything) and `100px` (pill, IconButton)
- **Border width** — `1px`
- **Shadow** — the Dialog's two-layer drop shadow, as a single token
- **Sizing** — control heights 40 / 36 / 24 for large / medium / small

**On spacing, do not force a scale.** The spec (§3) found paddings of 7px and 3px that
deliberately break a 4-multiple grid so heights land exactly on 36px and 24px. Put the regular
values in a spacing scale and keep the odd ones as **component-level** padding tokens. Do not
round them to fit a tidy ramp — that changes the design.

### 4. Resolve the font stack

Spec Open Question #6: the file specifies **PingFang SC**, a CJK-first family with no fallback.
A component library needs solid Latin rendering.

Define a `--font-sans` token with PingFang SC first and a sensible fallback chain after it.
Document the reasoning in a comment — this is a judgment call the design file doesn't make, and
being able to explain it is worth more than the stack itself.

### 5. Wire into Tailwind v4 and verify utilities generate

Tailwind v4 generates utilities from `@theme` namespaces — `--color-*` produces `bg-*`,
`text-*`, `border-*`; `--radius-*` produces `rounded-*`; `--text-*` produces text sizes.

**Verify the two-tier setup actually compiles.** Referencing one theme variable from another
inside `@theme` has version-specific caveats. If semantic tokens defined in terms of primitives
don't generate utilities, fall back to declaring primitives in `:root` and semantics in
`@theme`. Check the built `dist/faster.css` to confirm, and note whichever approach you used.

### 6. Enforce "no hardcoded colors"

The brief makes this an explicit requirement, so make it mechanical rather than a promise.

Add a check that fails when a hex code, `rgb(`, or `hsl(` appears in any file under
`src/components/`. A Jest test is the simplest route; an ESLint rule works too.

It should pass trivially right now (no components exist) and start protecting real code in
step 4. This is a good thing to be able to point at during the presentation.

### 7. Token test

A Jest test that asserts the token layer matches the spec — catching a mistyped hex, which is
otherwise invisible until someone eyeballs a screenshot.

Assert the semantic tokens resolve to the expected primitive values, and that every ramp step
in `docs/design-spec.md` §1 exists somewhere in the token file.

### 8. Token documentation story

A Storybook story rendering the whole system: color swatches with token name and hex, the type
scale, radii, shadows.

This does triple duty — visual verification that tokens compile, documentation for other
developers (a scored criterion), and a ready-made slide for the presentation.

### 9. Contrast audit

Now that colors are named, check foreground/background pairs against WCAG AA and record the
results in `docs/design-spec.md` or a new `docs/accessibility.md`.

Expect some failures — `#cacaca` disabled text on white is around 1.9:1. Disabled controls are
exempt from WCAG contrast, so that's defensible, but **know which pairs fail and why before
someone asks**. Do not change design values to fix them; record and move on.

---

## Definition of done

- [ ] `src/styles/index.css` has primitives and semantics, with the three inconsistency
      decisions recorded as comments
- [ ] Every value traces to `docs/design-spec.md` — nothing invented
- [ ] Non-color tokens exist: type, radius, border, shadow, sizing, spacing
- [ ] Font stack resolved and reasoning documented
- [ ] Utilities actually generate — confirmed in built `dist/faster.css`
- [ ] The no-hardcoded-color check exists and passes
- [ ] Token test passes
- [ ] Token story renders in Storybook with **zero console errors**
- [ ] Contrast audit written down, including known-failing pairs
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all green
- [ ] **No component was built**

---

## Then stop

Step 4 builds Button, Input, and Dialog on top of this. The user reviews the token layer
first — and reviewing it is much cheaper now than after three components depend on it.
