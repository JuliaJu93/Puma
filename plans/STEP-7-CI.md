# Step 7 — CI/CD and the npm release

**Audience: Sonnet.** This is an executable task spec. Follow it in order.

**Goal:** a GitHub Actions workflow that runs every quality gate on every push and PR, and
publishes the library to npm from `main`.

---

## Context

Assumes step 6 (stories) has landed. Everything else is done and verified.

Facts the workflow depends on — all confirmed:

| Thing | Value |
|---|---|
| Package | `@juliaju93/faster-ui`, currently `0.0.0`, `publishConfig.access: public` |
| Node | `.nvmrc` = `20.19.0`; `engines.node` = `>=20.19` |
| pnpm | `packageManager: pnpm@10.13.1` |
| Remote | `git@github.com:JuliaJu93/Puma.git`, tracking `origin/main` |
| Workflows | none yet — `.github/workflows/` does not exist |

**Scripts CI must call, exactly as named:**
`lint` · `typecheck` · `test` · `cypress:component` · `build` · `build-storybook`

> The Node pin matters. Vite 7 requires 20.19+, and the local machine is on **20.18.3** —
> below the floor. CI will be correct because it reads `.nvmrc`; the local environment is
> what's out of date.

---

## What the brief requires

The task lists these explicitly, and the acceptance criteria include *"CI/CD pipeline executes
successfully"*:

Install Dependencies · Lint · Type Check · Jest Tests · Cypress Tests · Storybook Build ·
Production Build · NPM Library Release

Every one needs to be visibly present in the workflow.

---

## Rules

1. **No source changes.** If CI reveals a real failure, report it — don't fix components here.
2. Least-privilege permissions: default `contents: read`, elevate only per job that needs more.
3. `pnpm install --frozen-lockfile` everywhere, so a drifted lockfile fails loudly.
4. The workflow must be **green on a repo with no secrets configured**. A red badge on the
   deliverable is worse than an unpublished package — see Task 5.

---

## Task 1 — Workflow skeleton

Create `.github/workflows/ci.yml`.

- Triggers: `push` to `main`, `pull_request` targeting `main`
- `concurrency` group per ref with `cancel-in-progress: true`, so superseded runs stop

Structure it as parallel jobs feeding a gated release, rather than one long sequential job:

```
quality  ──┐
e2e      ──┼──> release   (main only)
storybook──┘
```

## Task 2 — The setup steps (get this order right)

Every job repeats the same preamble. **`pnpm/action-setup` must run BEFORE
`actions/setup-node`.** With `cache: "pnpm"`, setup-node shells out to pnpm to locate the
store — if pnpm isn't installed yet, that step fails with a confusing error. This is the most
common way this workflow gets broken.

```yaml
- uses: actions/checkout@v4
- uses: pnpm/action-setup@v4          # must come first
- uses: actions/setup-node@v4
    with:
      node-version-file: .nvmrc        # not a hardcoded version
      cache: pnpm
- run: pnpm install --frozen-lockfile
```

Read the Node version from `.nvmrc` rather than hardcoding it, so the pin lives in one place.

## Task 3 — quality, e2e, storybook jobs

**`quality`** — lint → typecheck → `pnpm test` → `pnpm build`.
After the build, re-assert the packaging invariants step 2 established, since they're easy to
regress silently: `dist/` contains ESM + CJS + types + CSS, and React is **not** bundled.

**`e2e`** — `pnpm cypress:component`.
Cache the Cypress binary at `~/.cache/Cypress`, keyed on the Cypress version, or every run
re-downloads it. `cypress-io/github-action` handles this, or do it manually with
`actions/cache`. Component testing needs a real browser; the Ubuntu runners already have
Chrome.

**`storybook`** — `pnpm build-storybook`, then upload `storybook-static/` as an artifact.

## Task 4 — Changesets

Add `@changesets/cli` and initialise it.

Also add an initial changeset — the package is at `0.0.0`, which is not a meaningful published
version, so the first release needs a bump to land.

## Task 5 — The release job (and how it must fail safely)

Runs only on `main`, `needs: [quality, e2e, storybook]`.

Use `changesets/action@v1`, which opens a "Version Packages" PR and publishes when merged.
Requires:

- `permissions: contents: write` and `pull-requests: write`
- `NPM_TOKEN` repository secret, exposed as `NODE_AUTH_TOKEN` for publish

**Guard it so a missing secret skips rather than fails.** Someone cloning or forking this repo
without an npm token must still see a green pipeline. Set a job-level
`env: HAS_NPM_TOKEN: ${{ secrets.NPM_TOKEN != '' }}` and gate the publish step on it —
the `secrets` context behaves inconsistently in job-level `if`, so verify whichever pattern you
use actually skips cleanly rather than assuming.

Consider npm provenance (`NPM_CONFIG_PROVENANCE: true` plus `id-token: write`). It's a nice
supply-chain touch and free on public repos.

## Task 6 — Deploy Storybook to GitHub Pages

This resolves the ambiguity PLAN.md flagged: the brief's step 7 is titled *"Publish Repository
& Storybook"*, but its bullets only ask for local Storybook. Deploying costs little and removes
the doubt.

Use `actions/upload-pages-artifact` and `actions/deploy-pages`, with `pages: write` and
`id-token: write`, on `main` only.

**This needs Pages enabled in the repository settings with source "GitHub Actions" — a manual
step in the GitHub UI that Sonnet cannot do.** Flag it for the user rather than leaving the job
to fail mysteriously.

## Task 7 — README

- Add the CI status badge at the top. Reviewers look for it.
- Installation section covering **both** required imports — the package and
  `@juliaju93/faster-ui/styles.css`.
- A link to the deployed Storybook once Pages is live.

## Task 8 — Verify it actually runs

Push a branch, open a PR, and watch the run. A workflow that has never executed is not done.

Confirm: all jobs pass, the cache hits on a second run, and the release job skips cleanly
rather than erroring when no token is present.

---

## Definition of done

- [ ] `.github/workflows/ci.yml` exists and has run green on a real PR
- [ ] All eight brief-required steps are visibly present
- [ ] `pnpm/action-setup` runs before `actions/setup-node`
- [ ] Node comes from `.nvmrc`, not a hardcoded version
- [ ] pnpm store and Cypress binary both cached
- [ ] Packaging invariants re-asserted after build
- [ ] Release job gated on all three checks and on `main`
- [ ] **Missing `NPM_TOKEN` skips the release cleanly — pipeline still green**
- [ ] Storybook deployed to Pages (or deliberately deferred, and noted)
- [ ] README has the badge and both imports
- [ ] No source files changed

---

## Decisions that need the user, not a guess

1. **Does an npm account exist for the `@juliaju93` scope?** The scope must match the
   publishing account. Without it the release job can be complete and correct but will never
   actually publish — and "NPM Library" is a listed deliverable. Ask before assuming.
2. **`NPM_TOKEN` must be created and added as a repository secret** — the user has to do this;
   never handle the token value directly.
3. **GitHub Pages must be enabled** in repository settings with source "GitHub Actions".
4. **Branch protection on `main`** requiring the checks — good practice and a nice thing to
   show, but it changes how the user pushes.

---

## Then stop

Step 8 is the README polish, the final clean-clone check, and presentation prep.
