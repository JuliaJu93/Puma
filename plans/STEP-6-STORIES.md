# Step 6 — Write the stories

**Audience: Sonnet.** This is an executable task spec. Follow it in order.

**Goal:** Storybook documentation good enough that another developer can learn the whole
library from it without reading the source.

---

## Context

Step 5 is done and verified: 160 Jest tests, 37 Cypress tests, all green.

Current stories are the **minimal placeholders** step 4 was told to write — `Main` and
`Variations` for each component, plus `Foundations/Tokens`. The `Variations` matrices are
genuinely useful; keep and extend them rather than starting over.

Autodocs is already enabled globally in `.storybook/preview.ts`, and `@storybook/addon-a11y`
is installed.

---

## What the brief requires

Quoting the task, because this step is scored directly against it:

- Write stories for **all component variants**
- Include **disabled, error, and interaction states** where applicable
- Include a **Playground story with full control exposure**
- Stories are **clear, structured, and useful for other developers**

And from the acceptance criteria:

- *"Storybook provides full control and visibility of the components"*
- ***"No console errors in Storybook"*** — a hard pass/fail

---

## Rules

1. **No component changes.** If a story reveals a component bug, write it down rather than
   fixing it here — a component change now invalidates step 5's tests.
2. Stories are documentation. Every one should answer "when would I use this?", not just
   render a thing.
3. Use tokens for any styling inside stories. The `no-hardcoded-colors` test excludes
   `.stories.` files, so nothing will catch a raw hex — but a design system's own docs using
   off-system colors is exactly what a reviewer notices.
4. Keep `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green, and Cypress green.

---

## Task 1 — Hierarchy

Titles are currently flat (`Button`, `Input`, `Dialog`) alongside `Foundations/Tokens`.
Normalize to a deliberate structure:

```
Foundations/Tokens
Components/Button
Components/Input
Components/Dialog
```

Consider a short `Introduction` docs page covering what the library is, how to install it, and
the **two imports a consumer needs** — the component and `@juliaju93/faster-ui/styles.css`.
People forget the stylesheet, and it's the first thing a reviewer will hit.

## Task 2 — Button stories

- **Variants** — all four styles × both intents
- **Sizes** — all three, side by side
- **With icons** — `startIcon`, `endIcon`, both, and icon-only with `aria-label`
- **Disabled** — every style × intent, since the disabled tints genuinely differ
- **States** — see the interaction-states note below
- **asChild** — the escape hatch rendering a real `<a>`, with a note on why `variant="link"`
  is still a `<button>` by default

## Task 3 — Input stories

Cover all seven anatomy variants from spec §5: Basic, left icon, right icon, number,
prefix & suffix, prefix, suffix.

Plus: sizes, `error` as boolean and as a message string, disabled, clearable, and a story
showing `label` versus `aria-label`.

> **Every story must give the field an accessible name.** `Input` deliberately logs a
> `console.error` when it has no `label`, `aria-label`, or `aria-labelledby` — so an unlabelled
> story would fail the "no console errors" criterion using the component's own guard. This is
> the single most likely way to trip that criterion.

## Task 4 — Dialog stories

The four spec §6 layouts, built by composition rather than a variant prop: Basic, Warning,
Scrollable, With divider.

Plus all three sizes, and a story showing the responsive cap at a narrow viewport.

Radix warns to the console when `Dialog.Content` has no accessible description — make sure
every story provides one or explicitly opts out.

## Task 5 — Playground stories (explicitly required)

One per component, with **every prop exposed as a control**.

The hard part is `ReactNode` props — `startIcon`, `endIcon`, `prefix`, `suffix` — which can't
be edited as text. Use the `options` + `mapping` pattern so they become a picker:

```ts
argTypes: {
  startIcon: {
    control: "select",
    options: ["none", "plus", "search"],
    mapping: { none: undefined, plus: <PlusIcon />, search: <SearchIcon /> },
  },
}
```

Also set explicit `control` types for the union props: `select` for `variant`, `intent`,
`size`; `boolean` for `disabled`; `text` for children.

`Input`'s `error` is `boolean | string`, which Storybook can't infer a single control for.
Pick one — a text control where empty means "no error" is usually clearest — and say so in the
description.

Dialog needs a trigger-driven Playground, since its content only exists while open.

## Task 6 — Make the props tables real

Autodocs generates prop tables from the types. **Verify they actually populate** — open each
component's Docs tab and confirm every prop appears with its description and default.

Storybook's `react-vite` framework defaults to `react-docgen`, which is fast but extracts less
than `react-docgen-typescript` — in particular it can miss props coming through extended
interfaces like `ButtonHTMLAttributes`. If the tables come out thin, switch
`typescript.reactDocgen` to `"react-docgen-typescript"` in `.storybook/main.ts` and note the
build-time cost.

Add component-level descriptions via `parameters.docs.description.component`, and a short
description on each story explaining when to reach for it.

## Task 7 — Interaction states

Hover and pressed can't be shown in a static story, and they're explicitly in the brief.

Two options — pick one and say why:

1. **`storybook-addon-pseudo-states`** — renders `:hover`, `:active`, and `:focus-visible`
   variants statically, so the full state matrix is visible at a glance. Costs one dev
   dependency.
2. **Document them** in a states table, pointing at the Cypress specs that assert them.

Option 1 shows better in a design-system review; option 2 adds nothing to the dependency tree.
Either is defensible — the decision and its reasoning are what matter.

Whichever you choose, make sure **Ghost/danger's deliberate quirk** is visible or documented:
it changes text color on pressed but not on hover, unlike every other colored style.

## Task 8 — Console and a11y sweep

Open **every** story and confirm a clean console. Likely culprits:

- Missing `key` props in the `.map()` calls that build the variant matrices
- An `Input` with `value` but no `onChange` — React's controlled/uncontrolled warning
- Unlabelled inputs tripping the component's own guard
- Radix's missing-description warning

Then run the a11y addon on every story. Contrast violations are expected and documented in
`docs/accessibility.md` — everything else should be clean.

---

## Definition of done

- [ ] Every variant of every component has a story
- [ ] Disabled and error states covered across all applicable variants
- [ ] A Playground per component with **every prop** controllable, `ReactNode` props included
- [ ] Props tables populated with descriptions and defaults
- [ ] Interaction states either rendered or documented, with the choice explained
- [ ] Hierarchy is consistent; an Introduction page covers both required imports
- [ ] **Zero console errors across every story**
- [ ] a11y addon clean apart from the documented contrast gaps
- [ ] `pnpm build-storybook` green
- [ ] No component source changed
- [ ] All step 5 checks still green

---

## Open questions to raise, not guess

1. **`storybook-addon-pseudo-states`** — worth the dependency?
2. **Play functions** — Storybook interaction tests would demo behaviour in-browser, but
   overlap what Cypress already covers. Worth it, or duplicated effort?
3. **Deploying Storybook to GitHub Pages** — PLAN.md flags that the brief's step 7 is titled
   "Publish Repository & Storybook" while its bullets only ask for local. Confirm whether to
   deploy in step 7.

---

## Then stop

Step 7 is CI/CD and the npm release. Do not start it.
