# @kashlewa.ju93/faster-ui

[![CI](https://github.com/JuliaJu93/Puma/actions/workflows/ci.yml/badge.svg)](https://github.com/JuliaJu93/Puma/actions/workflows/ci.yml)

Button, Input, and Dialog components for Faster design system.

Storybook: https://juliaju93.github.io/Puma/ 

## Requirements
ffff

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

## Releasing

Versioning and publishing go through [Changesets](https://github.com/changesets/changesets):

1. Add a changeset with `pnpm changeset` describing the change.
2. On merge to `main`, CI opens a "Version Packages" PR bumping versions and updating
   `CHANGELOG.md`.
3. Merging that PR publishes to npm, provided the `NPM_TOKEN` repository secret is set.
   Without it, the release job still runs and stays green, it just skips the publish step.
