# Step 4 — Build the components

**Audience: Sonnet.** This is an executable task spec. Follow it in order.

**Goal:** build `Button`, `Input`, and `Dialog` on top of the token layer — accessible, typed,
composable, and matching `docs/design-spec.md` exactly.

---

## Context

Steps 1–3 are done and verified.

- **`docs/design-spec.md`** — every value, verified against the raw Figma API. Source of truth.
- **`src/styles/index.css`** — the token layer. Semantic tokens only from component code.
- **`docs/accessibility.md`** — the contrast audit, including known-failing pairs.
- `src/components/Placeholder/` still exists and **must be deleted** in this step.

---

## Rules

1. **Semantic tokens only.** Never a primitive (`--color-brand-500`), never a raw hex. The
   `no-hardcoded-colors` test enforces this and will now be checking real files.
2. **Do not invent design values.** If something isn't in the spec, it goes in Open Questions —
   with two explicit exceptions granted below (focus rings, responsive widths), because the
   design file genuinely lacks them and the components can't ship without.
3. **No test suites and no full story coverage.** Those are steps 5 and 6. One minimal render
   story per component, so Storybook isn't empty and the work is visually verifiable.
4. Keep every check green as you go: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

---

## Task 1 — Dependencies and packaging

Add `class-variance-authority`, `clsx`, `tailwind-merge`, and `@radix-ui/react-dialog`.

**These are runtime `dependencies`, not `devDependencies`** — consumers need them at runtime.
Add each to `rollupOptions.external` in `vite.config.ts` alongside React, so they resolve from
the consumer's `node_modules` instead of being duplicated inside the bundle.

After this, re-run the step 2 packaging checks: `npm pack --dry-run` still clean, and nothing
unexpected inlined into `dist/index.js`.

---

## Task 2 — Focus rings (a granted exception)

**The Figma file has no distinct focus-visible state for Button.** Spec §4 lists only Default,
Hover, Pressed, Disabled. Input merges focus into a combined "Pressed & Focus" state.

Keyboard users need a visible focus indicator, so this has to be designed net-new. That is
allowed here — it's an accessibility requirement, not a design preference.

- Add focus-ring tokens to `src/styles/index.css` (color, width, offset) with a comment
  explaining they are **not** from Figma and why they exist.
- Use `:focus-visible`, never `:focus` — mouse users should not see rings.
- Reuse `--color-border-focus` for the color unless there's a reason not to.
- Note in `docs/accessibility.md` that this was added, and check its contrast.

This is a strong presentation point: the design file omitted it, you caught it, you documented
the decision rather than silently shipping an inaccessible component.

---

## Task 3 — Button

### API

| Prop | Type | Notes |
|---|---|---|
| `variant` | `primary \| outline \| ghost \| link` | Spec §4 |
| `intent` | `default \| danger` | **Not a separate component** — spec §7.7 |
| `size` | `sm \| md \| lg` | Heights 24 / 36 / 40 |
| `startIcon` / `endIcon` | `ReactNode` | Cosmetic only — no color/geometry change |
| everything else | `ButtonHTMLAttributes` | Plus `forwardRef`, `className` passthrough |

Danger is an `intent` prop on one component, not a second `DangerButton` — Figma models it as
a separate page purely as a documentation convention.

### Build it from the spec table

Spec §4 gives all 32 combinations of style × intent × state with exact tokens. Use CVA with
`variant` and `intent` as compound variants. Get these right:

- **Ghost/danger changes text color on Pressed but not Hover** — every other colored style
  tracks the full ramp. Step 3 Decision 3 says replicate exactly. Do not normalize it.
- **Outline and Ghost on the default intent both rest at `--color-fg`** and disable to
  `--color-fg-disabled`. Only Outline tints on hover/pressed.
- **Link uses `--color-link-fg-disabled`**, which is deliberately different from
  `--color-accent-disabled`.
- **Danger disabled splits two ways** — `--color-danger-disabled-fill` for backgrounds,
  `--color-danger-disabled-fg` for text and borders.

### Two decisions to make and document

**Is `variant="link"` a `<button>` or an `<a>`?** It's a visual style, and a control that
doesn't navigate must stay a `<button>` for keyboard and screen-reader semantics. Recommend
keeping `<button>` and adding an `asChild`-style escape hatch for genuine navigation. Whatever
you choose, write down why.

**There is no loading state in Figma.** Earlier planning assumed one. Spec §4 has only four
states. Either omit it, or design it net-new and flag it clearly — do not quietly invent one.

---

## Task 4 — Input

**Do not build seven components.** Spec §5 is explicit that the 7 Figma variants change only
what sits inside the field — colors and border logic are identical. Build **one** `Input` with
composable slots.

| Prop | Purpose |
|---|---|
| `size` | `sm \| md \| lg` |
| `startIcon` / `endIcon` | Left icon / right icon variants |
| `prefix` / `suffix` | Static text before/after the value |
| `error` | Boolean or message string — drives the error state |
| `clearable` | The × that appears when focused with content |
| `disabled` | Uses `--color-input-fg-disabled` on `--color-surface-disabled` |

`type="number"` covers the stepper variant — decide whether to style native spinners or render
custom stepper buttons, and note the reasoning.

### Accessibility — the important part

**Spec §5 found no label in any variant**, only the error message below the field. That leaves
a real gap you must close:

- Support a `label` prop rendering a real `<label>` with a generated `id` association. If no
  visible label is provided, require `aria-label` — and consider failing loudly in dev when
  neither exists.
- Wire the error message with `aria-describedby`, and set `aria-invalid` when in error.
- The clear button needs an accessible name and must be reachable by keyboard.
- Generate ids with React's `useId`, never a counter or random value — it breaks SSR hydration.

Since the label isn't in Figma, its typography and spacing are a granted exception. Use
existing tokens, don't invent new values, and flag the choice.

---

## Task 5 — Dialog

Build on `@radix-ui/react-dialog` for focus trap, portal, scroll lock, and ARIA wiring.

**Use compound components,** not a monolithic prop-driven API:

```
Dialog.Root, Dialog.Trigger, Dialog.Content, Dialog.Header,
Dialog.Title, Dialog.Body, Dialog.Footer, Dialog.Close
```

This matches Radix's own shape and lets the four Figma variants fall out of composition rather
than a `variant` enum:

| Figma variant | How it's expressed |
|---|---|
| Basic | Header + Body + Footer |
| Warning | Consumer puts a warning icon in the body; footer uses an **Outline-danger** button |
| Scrollable | `Dialog.Body` with a max height and internal scroll |
| With divider | A `divided` prop (or a `Dialog.Separator`) |

Spec §6 flags that Warning deliberately uses **Outline-danger, not Primary-danger** for its
action. That falls out naturally from composition — the consumer picks the Button.

Wire the styling from spec §6 and §3: `--shadow-dialog`, `--color-overlay`, radius, 24px
padding, 32px content-to-footer gap, and the reused Button tokens in the footer.

**Responsive widths — a granted exception.** Sizes are 900 / 600 / 400px fixed. A 900px dialog
overflows every phone. Add a `max-width` constraint and viewport margin. Figma specifies no
responsive behaviour, so document what you chose.

---

## Task 6 — Clean up and wire exports

- Delete `src/components/Placeholder/` entirely, including its test, story, and Cypress spec.
- Export `Button`, `Input`, `Dialog` and all their prop types from `src/index.ts`.
- Confirm the built `.d.ts` actually exposes the prop types — a consumer who can't import
  `ButtonProps` has a broken library.

---

## Task 7 — Verify against the spec

Prove the components match, rather than assuming. For a representative sample across all three:

1. Render the variant in Storybook.
2. Read the **computed** background, text color, border, height, padding, and radius.
3. Compare against the spec table for that exact combination.

Getting the CVA class strings right and the token wiring wrong produces components that look
plausible and are subtly incorrect everywhere. Checking computed values is what catches that.

Also confirm keyboard behaviour by hand: tab to each control, see a visible focus ring, open
the Dialog and check focus is trapped and returns to the trigger on close.

---

## Definition of done

- [ ] `Button`, `Input`, `Dialog` built and exported with their prop types
- [ ] `Placeholder` fully deleted
- [ ] Every color, size, and radius comes from a **semantic token** — `no-hardcoded-colors` passes
- [ ] All three components `forwardRef` and accept `className`
- [ ] Focus rings implemented with `:focus-visible`, tokens documented as net-new
- [ ] Input has real label support, `aria-describedby`, and `aria-invalid`
- [ ] Dialog traps focus, restores it on close, and closes on Escape
- [ ] Computed values spot-checked against the spec across all three
- [ ] Radix and the CVA helpers are `dependencies` **and** externalized in the build
- [ ] `npm pack --dry-run` still clean
- [ ] One minimal story per component, Storybook has **zero console errors**
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green, Cypress green

---

## Open questions to raise, not guess

1. **Loading state** — absent from Figma. Omit or design net-new?
2. **`variant="link"` semantics** — `<button>` with an escape hatch, or polymorphic?
3. **Number stepper** — native spinners or custom buttons?
4. **Dialog responsive behaviour** — what happens to a 900px dialog on a 375px screen?
5. **IconButton** — exists in Figma, not required by the brief, currently out of scope. Confirm
   it stays out.

---

## Then stop

Step 5 writes the full Jest and Cypress suites; step 6 writes the full stories. Do not start
either. The user reviews the component APIs first — changing an API after tests and stories are
written costs three times as much.
