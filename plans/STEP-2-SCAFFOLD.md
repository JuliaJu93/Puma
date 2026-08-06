# Step 2 — Project scaffold

**Audience: Sonnet.** This is an executable task spec. Follow it in order.

**Goal:** a real, publishable, *empty* library where **every command in the toolchain runs
green** — before any component logic exists.

The point is to discover toolchain problems now, on a throwaway placeholder, rather than at
step 5 with three components already written. Cypress + Vite + Tailwind is the known fiddly
combination; it gets configured here, not later.

---

## Context

Step 1 is complete. `docs/design-spec.md` holds every extracted value and is the source of
truth for steps 3–4. **Do not read design values into this step** — no colors, no sizes. This
step produces structure only.

What the library will eventually export, so the scaffold anticipates it:

| Component | Shape |
|---|---|
| `Button` | 4 styles (primary/outline/ghost/link) × 2 intents (default/danger) × 3 sizes × 4 states |
| `Input` | 7 anatomy variants × 8 states × 3 sizes |
| `Dialog` | 4 layout variants × 3 sizes |
| `IconButton` | Exists in Figma, **not required by the brief** — leave it out for now |

---

## Decisions already made

| Thing | Decision |
|---|---|
| Package manager | pnpm |
| Build | Vite **library mode** + `vite-plugin-dts` |
| Output | ESM **and** CJS, plus `.d.ts` |
| Styling | Tailwind v4, CSS-first `@theme` |
| CSS distribution | **Ship compiled CSS.** Consumers import `dist/faster.css` and need no Tailwind setup of their own |
| React | A **peer** dependency, range `^18.2.0 \|\| ^19.0.0` — never a hard dependency |
| Node | 20+ |

---

## Rules

1. **No component logic.** The placeholder in Task 9 is throwaway and gets deleted in step 4.
2. **No design values.** Not one hex code from the spec. Tokens are step 3.
3. React, `react-dom`, and `react/jsx-runtime` must be **externalized** in the build. If React
   ends up bundled into `dist/`, consumers get two React copies and hook errors. Verify this
   explicitly in Task 11.
4. If a tool's current API differs from what's written here, follow the tool's docs and note
   the deviation in the README. These configs move between major versions.

---

## Tasks

### 1. Initialize

`pnpm init` at the repo root. Node 20+. Add `.nvmrc`.

Do not scaffold with `create-vite` — it produces an *app*. This is a library.

### 2. `package.json` as a library

This is the file that makes step 7's npm release possible. Get it right now.

```jsonc
{
  "name": "@<scope>/faster-ui",   // see Open questions
  "version": "0.0.0",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "files": ["dist"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./styles.css": "./dist/faster.css"
  },
  "peerDependencies": {
    "react": "^18.2.0 || ^19.0.0",
    "react-dom": "^18.2.0 || ^19.0.0"
  },
  "publishConfig": { "access": "public" }
}
```

`sideEffects` matters: without the CSS entry, a consumer's bundler will tree-shake the
stylesheet away and the components render unstyled.

### 3. Vite library build

`vite.config.ts` with `@vitejs/plugin-react`, `@tailwindcss/vite`, and `vite-plugin-dts`.

- `build.lib.entry` → `src/index.ts`
- `formats: ["es", "cjs"]`
- `rollupOptions.external` → `react`, `react-dom`, `react/jsx-runtime`
- Emit the stylesheet as `faster.css`

Consider `preserveModules: true` so consumers can tree-shake individual components. Note the
trade-off in the README: better tree-shaking, more output files.

### 4. TypeScript

`strict: true`, `jsx: "react-jsx"`, `declaration: true`. A separate `tsconfig.build.json` that
excludes tests and stories from the published types.

Script: `typecheck` → `tsc --noEmit`.

### 5. Tailwind v4

Install and wire `@tailwindcss/vite`. Create `src/styles/index.css` with the Tailwind import
and an **empty** `@theme` block — step 3 fills it.

### 6. Lint and format

ESLint (flat config) with the TypeScript, React, react-hooks, and jsx-a11y plugins. Prettier
with `prettier-plugin-tailwindcss`.

`jsx-a11y` is not optional here — accessibility is a scored acceptance criterion, and having
the linter catch violations during development is far cheaper than finding them in review.

### 7. Jest

Jest + `ts-jest` or `@swc/jest`, `jsdom` environment, `@testing-library/react`,
`@testing-library/jest-dom`, `jest-axe`. Map CSS imports to a stub via `moduleNameMapper`.

This is a known-awkward combination — Jest is CJS-native and this package is ESM. Budget time,
and if transform config fights you, `@swc/jest` is usually the path of least resistance.

### 8. Cypress component testing

Configure `component` testing with the `react` framework and the `vite` bundler, reusing
`vite.config.ts` so Tailwind classes actually apply in mounted components.

**Verify styles render in a mounted component before moving on.** The classic failure is
Cypress mounting the component successfully with no CSS loaded, which makes every later visual
assertion meaningless. Import the stylesheet in `cypress/support/component.ts`.

### 9. Placeholder component

Create `src/components/Placeholder/` with `Placeholder.tsx`, `Placeholder.test.tsx`,
`Placeholder.cy.tsx`, `Placeholder.stories.tsx`, `index.ts`.

Keep it trivial — a `<div>` with one Tailwind class and one prop. Its only job is to prove
every tool in the chain sees a real component. Export it from `src/index.ts`.

### 10. Storybook

Storybook with the `react-vite` framework, autodocs enabled, plus `@storybook/addon-a11y`.
Import the stylesheet in `.storybook/preview.ts`.

### 11. Verify the whole chain

Every one of these must pass on the placeholder:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Then, separately: `pnpm cypress:component`, `pnpm build-storybook`, `pnpm storybook`.

Then verify the build output by hand:

- [ ] `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, `dist/faster.css` all exist
- [ ] **No React in the bundle** — grep `dist/index.js` for `react` and confirm only
      `import`/`require` references, never inlined React source
- [ ] `dist/faster.css` contains the placeholder's Tailwind class
- [ ] `npm pack --dry-run` lists only `dist/` and the manifest — no `src/`, no `.env`, no `.cache/`

### 12. README stub

Install, dev, test, storybook, build. Include the consumer-side snippet showing both the
component import and the `@<scope>/faster-ui/styles.css` import — people forget the stylesheet,
and it's the first thing a reviewer will try.

### 13. Scripts

`dev`, `build`, `typecheck`, `lint`, `format`, `test`, `test:watch`, `cypress:component`,
`storybook`, `build-storybook`.

Name them exactly as step 7's CI workflow will call them.

---

## Definition of done

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all green
- [ ] `pnpm cypress:component` green, **with Tailwind styles visibly applied**
- [ ] `pnpm build-storybook` green; `pnpm storybook` opens with **zero console errors**
- [ ] `dist/` contains ESM + CJS + types + CSS
- [ ] React is external, not bundled
- [ ] `npm pack --dry-run` output is clean
- [ ] `git status` shows no `.env`, no `.cache/`, no `node_modules/`, no `dist/`
- [ ] The whole thing still contains **zero real design values**

---

## Open questions to raise, not guess

1. **The npm package name.** `faster` and `faster-ui` are both taken. A scope is required, and
   the scope must match the npm account that will publish. Use `@juliaju93/faster-ui` as a
   placeholder and flag it — do not register anything.
2. **`preserveModules`** — confirm the tree-shaking/output-count trade-off is wanted.
3. Any tool whose current API differs from this document.

---

## Then stop

Do not build tokens or components. Step 2 ends with a green, empty, publishable package.
The user reviews before step 3.
