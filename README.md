# @juliaju93/faster-ui

Button, Input, and Dialog components for PUMA's Faster design system.

> **Status:** scaffold only. No components exist yet — see [`plans/PLAN.md`](plans/PLAN.md) for the
> build sequence. The `Placeholder` component below exists solely to prove the toolchain works
> end to end and will be deleted once real components land.

## Requirements

- Node 20+ (see [`.nvmrc`](.nvmrc))
- pnpm

## Getting started

```bash
pnpm install
pnpm dev          # Storybook at http://localhost:6006
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` / `pnpm storybook` | Start Storybook |
| `pnpm build` | Build the library to `dist/` (ESM + CJS + `.d.ts` + CSS) |
| `pnpm build-storybook` | Build the static Storybook site |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier, writes in place |
| `pnpm test` / `pnpm test:watch` | Jest (unit + accessibility via `jest-axe`) |
| `pnpm cypress:component` | Cypress component tests (headless) |

## Using the library

```tsx
import { Placeholder } from "@juliaju93/faster-ui";
import "@juliaju93/faster-ui/styles.css";

function App() {
  return <Placeholder label="Hello" />;
}
```

The stylesheet import is required — components ship unstyled without it.

React and ReactDOM are peer dependencies (`^18.2.0 || ^19.0.0`); this package never bundles its own
copy.

## Notes on the toolchain

A few deviations from the original scaffold plan, driven by what the currently installed tool
versions actually support:

- **Vite is pinned to 7.x, not 8.x.** Vite 8 and TypeScript 7 were the `latest` dist-tags at
  setup time, but the ESLint plugin ecosystem (`typescript-eslint`, `eslint-plugin-react`,
  `eslint-plugin-jsx-a11y`) doesn't support ESLint 10 or TypeScript 7 yet, and Storybook 10
  requires Node 20.19+ (the dev machine runs 20.18.3). Vite 7 + Storybook 9 + TypeScript 5.9 +
  ESLint 9 is the newest combination where every tool in the chain is mutually compatible.
- **`vite-plugin-dts`'s API changed under the hood** (now built on `unplugin-dts`): the
  `rollupTypes` option was renamed `bundleTypes`. Not used here — declaration files are emitted
  per-module rather than bundled into one file.
- **`preserveModules` was considered and declined.** The plan flagged this as a tree-shaking-vs-
  output-count tradeoff to confirm rather than guess. Decision: keep the single-bundle output —
  simpler `dist/`, fewer files to publish and reason about. Revisit if bundle size becomes a real
  concern once Button/Input/Dialog exist.

## Open questions

1. **npm package name.** `faster` and `faster-ui` are taken on npm. This package currently
   publishes as `@juliaju93/faster-ui` as a placeholder — confirm the scope before actually
   publishing.
