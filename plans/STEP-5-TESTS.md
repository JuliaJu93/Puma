# Step 5 — Write the tests

**Audience: Sonnet.** This is an executable task spec. Follow it in order.

**Goal:** full Jest and Cypress coverage for `Button`, `Input`, and `Dialog` — and get
`pnpm cypress:component` back to green, which it currently is not.

---

## Context

Step 4 is done and verified: all three components match `docs/design-spec.md`, accessibility
holds up under real interaction, and the package builds clean.

**Cypress is currently red.** `Placeholder.cy.tsx` was deleted in step 4 and nothing replaced
it, so `pnpm cypress:component` exits 1 with *"no spec files were found"*. That was a
contradiction in the step 4 plan, not a mistake in the work — fixing it is this step's first
job, and CI in step 7 depends on it.

Existing Jest coverage: 85 tests across `tokens.test.ts` and `no-hardcoded-colors.test.ts`.
Keep both. `jest-axe` is installed but not yet used anywhere.

---

## What the brief actually requires

These are scored acceptance criteria. Map tests to them explicitly so none is missed.

**Jest + React Testing Library:** component rendering · variants and states · user interactions
· accessibility where applicable

**Cypress (marked mandatory):** successful mounting · basic rendering validation · component
interactions · Dialog open/close · Input interactions · Button interactions

---

## The key decision: what goes where

**jsdom cannot compute CSS.** No Tailwind, no `:hover`, no `:focus-visible`, no real layout,
no computed colors. Asserting visual correctness in Jest is impossible — attempts to fake it
produce tests that pass while the component is visibly broken.

So split on that line, and be able to explain the split in the presentation:

| Jest + RTL | Cypress |
|---|---|
| Rendering, props → correct DOM and ARIA | Computed colors against the spec |
| Event handlers firing with right args | Focus rings (`:focus-visible`) |
| Controlled vs uncontrolled behaviour | Hover and active states |
| Conditional rendering logic | Focus trap, scroll lock, real keyboard |
| `jest-axe` violations | Anything needing real layout |

**Do not assert on Tailwind class strings.** `toHaveClass("bg-accent")` tests CVA's output, not
behaviour — it breaks on harmless refactors and passes when tokens are wrong. Assert on roles,
ARIA, and behaviour in Jest; assert on **computed values** in Cypress. That's the pair that
actually catches regressions.

---

## Rules

1. **No stories.** Step 6 owns those. The existing minimal ones stay as they are.
2. **Test our composition, not Radix.** Radix's focus trap is Radix's problem. That we wired it
   up correctly is ours — so test the integration, not the library.
3. No broad DOM snapshots. They're noise in review and fail on every innocent change.
4. Every test name should say what breaks if it fails.

---

## Task 1 — Cypress specs (do this first, it's the red one)

Create `Button.cy.tsx`, `Input.cy.tsx`, `Dialog.cy.tsx` colocated with their components.

Cover the brief's mandatory list: mounting, rendering validation, interactions, Dialog
open/close, Input interactions, Button interactions.

Confirm `pnpm cypress:component` is green before moving on.

While you're in the config: set `allowCypressEnv: false` in `cypress.config.ts` — it currently
prints a deprecation warning on every run.

## Task 2 — Button (Jest)

- Renders children; `type="button"` by default so it never submits a form accidentally
- Every `variant` × `intent` × `size` renders without error
- `onClick` fires; **does not fire when `disabled`**
- `startIcon` / `endIcon` render and are `aria-hidden`
- `asChild` renders the child element instead of a `<button>`, merges `className`, and — per
  its own JSDoc — does **not** forward the ref. Test the documented behaviour so it stays
  deliberate rather than becoming an accidental regression.
- `className` passthrough survives `cn()` merging
- `forwardRef` gives a real `HTMLButtonElement`

## Task 3 — Input (Jest)

This component has the most non-obvious logic. Give it the most attention.

- `label` renders a real `<label>` correctly associated with the input
- Passing neither `label`, `aria-label`, nor `aria-labelledby` **triggers the dev console
  error** — assert the guard actually fires
- `error` as a string renders the message, sets `aria-invalid`, and wires `aria-describedby`
  to it; a caller's own `aria-describedby` is preserved alongside, not overwritten
- `error` as `true` sets the error state with no message
- **Disabled wins over error** — the documented precedence
- `clearable`: the × appears only when focused **and** the field has content; clicking it
  empties the field **and fires `onChange`**
- **`type="number"` steppers fire `onChange`** and are out of the tab order
- Controlled (`value`) and uncontrolled (`defaultValue`) both drive "has content" correctly
- `prefix`, `suffix`, `startIcon`, `endIcon` render

> The clear button and steppers mutate the DOM value directly and rely on `fireNativeChange`
> dispatching a synthetic `input` event for React to notice. That is exactly the kind of code
> that silently stops working. **Assert `onChange` actually fires** — not just that the value
> looks empty.

## Task 4 — Dialog (Jest)

- Opens from the trigger, closes from `DialogClose`
- Title and body render, and Radix's `aria-labelledby` / `aria-describedby` point at them
- Close button has an accessible name; a custom `aria-label` overrides it
- `DialogBody` with `asChild` renders a `<div>`, not a `<p>` — block content inside a `<p>` is
  invalid HTML, which is why it was built that way
- Each `size` renders

## Task 5 — Accessibility (jest-axe)

Run `axe` on each component across meaningful states — Button in each variant, Input with and
without label, in error, disabled, and Dialog while open.

Expect **contrast rules to fire**: `docs/accessibility.md` records that the default Primary
button and several Outline/Link pairings fail AA, inherited from the Figma palette. Do not
change design values to make axe quiet. Disable the `color-contrast` rule for those assertions
with a comment pointing at `docs/accessibility.md`, so the suppression is a documented decision
rather than a silent dodge.

## Task 6 — Computed values against the spec (Cypress)

The highest-value tests in the suite, because they're the only ones that catch a token
regression.

For a representative sample, mount and assert **computed** values against `design-spec.md` §4
and §5:

- Button: Primary/default, Primary/danger, Outline/default, Ghost/default, Link/default —
  background, text color, border
- Button disabled states, including `--color-link-fg-disabled` being distinct
- Input: default, error, disabled — background, border, text
- Heights at all three sizes: 24 / 36 / 40

Also assert what only a real browser can:

- `:focus-visible` produces a visible ring; a **mouse click does not**
- Ghost/danger changes text color on `:active` but **not** on `:hover` — the one deliberate
  inconsistency, recorded as Decision 3

## Task 7 — Dialog behaviour (Cypress)

- Opens, closes on Escape, closes on overlay click
- **Focus is trapped**; Tab cycles inside
- **Focus returns to the trigger** on close
- Body scroll locks while open and unlocks after
- The responsive cap holds — at a 375px viewport the dialog does not overflow

---

## Definition of done

- [ ] `pnpm cypress:component` **green** with real specs
- [ ] `pnpm test` green, all existing token tests still passing
- [ ] Every bullet in the brief's Jest and Cypress lists has a test
- [ ] `jest-axe` runs on all three components, contrast suppressions documented
- [ ] Computed-value tests cover Button, Input, and both size and color axes
- [ ] Dialog focus trap, restore, Escape, and scroll lock all tested
- [ ] `fireNativeChange` paths asserted via `onChange`, not just resulting value
- [ ] No class-string assertions standing in for visual checks
- [ ] `allowCypressEnv: false`
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green

---

## Open questions to raise, not guess

1. **Coverage thresholds** — worth enforcing a minimum in CI, or does that invite tests written
   for the number rather than the risk?
2. **Cypress in CI** — component tests only, or add a smoke run against built Storybook?

---

## Then stop

Step 6 writes the full stories. Do not start it.
