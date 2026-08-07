# @kashlewa.ju93/faster-ui

[![CI](https://github.com/JuliaJu93/Puma/actions/workflows/ci.yml/badge.svg)](https://github.com/JuliaJu93/Puma/actions/workflows/ci.yml)

Button, Input, and Dialog components for PUMA's Faster design system.

Storybook: https://juliaju93.github.io/Puma/ (live once GitHub Pages is enabled — see
[`plans/STEP-7-CI.md`](plans/STEP-7-CI.md)).

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
import { Button } from "@kashlewa.ju93/faster-ui";
import "@kashlewa.ju93/faster-ui/styles.css";

function App() {
  return <Button variant="primary">Hello</Button>;
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
- **`human-id` is pinned to `1.0.2` via a pnpm override.** `@changesets/cli` depends on
  `human-id@^4.1.1`, which shipped as ESM-only and crashes every `changeset` CLI command
  (`ERR_REQUIRE_ESM`) when required from the CLI's CJS code. `1.0.2` is the last release with the
  same API and a CommonJS build. Upstream issue: changesets/changesets.

## Releasing

Versioning and publishing go through [Changesets](https://github.com/changesets/changesets):

1. Add a changeset with `pnpm changeset` describing the change.
2. On merge to `main`, CI opens a "Version Packages" PR bumping versions and updating
   `CHANGELOG.md`.
3. Merging that PR publishes to npm, provided the `NPM_TOKEN` repository secret is set.
   Without it, the release job still runs and stays green, it just skips the publish step.
