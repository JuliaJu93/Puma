# "Faster" — Plan

Build a small component library for PUMA's task: **Button, Input, Dialog**.
Tested, documented in Storybook, released to npm through CI.

**Where things stand:** repo has git, the task PDF, and a `.gitignore`. No code yet.

**Don't wait for Figma.** The Figma specs only block the colors and sizes.
Everything else — setup, structure, tooling — can start today.

---

## 1. Get the specs out of Figma

> **Detailed plan → [STEP-1-FIGMA.md](STEP-1-FIGMA.md)**

Open the file and write down: colors, fonts, corner radius, spacing, and how each
component looks in every state (normal, hover, focused, disabled, error).

Components: Button `15-12480`, Input `11-7661`, Dialog `12-11244`.

## 2. Set up the project

> **Detailed plan → [STEP-2-SCAFFOLD.md](STEP-2-SCAFFOLD.md)**

Vite in **library mode** (not app mode), TypeScript, ESLint, Prettier.

This matters: the task asks for an npm package, so it has to build as a package
from the start — with type files and a proper `exports` field. Fixing this later is a pain.

Keep each component in its own folder with its tests and stories next to it.

## 3. Build the token layer

> **Detailed plan → [STEP-3-TOKENS.md](STEP-3-TOKENS.md)**

Two levels: raw colors first (`blue-500`), then meaning-based names on top
(`danger-background`, `focus-border`).

**Components only ever use the meaning-based names.** That's the rule the
interviewers will ask about, so be ready to explain it.

Tailwind v4 turns these into CSS variables, which makes theming and dark mode easy later.

## 4. Build the components

> **Detailed plan → [STEP-4-COMPONENTS.md](STEP-4-COMPONENTS.md)**

Use CVA for variants so they're typed. Every component forwards its ref and accepts
a `className`.

For **Dialog**, use Radix instead of writing it yourself. Focus trapping and keyboard
handling are genuinely hard to get right, and "I didn't rebuild what already works"
is a good answer — just be ready to defend the extra dependency.

## 5. Write the tests

Jest for rendering, variants, and clicks. Add `jest-axe` so accessibility is actually
checked, not just claimed.

Cypress for the interactive parts: dialog opening and closing, typing in inputs,
clicking buttons.

Cypress with Vite and Tailwind is fiddly. Start it early, it will take longer than expected.

## 6. Write the stories

One story per variant, plus the disabled and error states, plus a Playground story
where everything is adjustable.

**Check the browser console is clean.** "No console errors" is on their scoring list.

## 7. Set up CI

One GitHub Actions workflow: install, lint, typecheck, Jest, Cypress, build Storybook,
build the package, publish to npm.

Publishing needs an `NPM_TOKEN` secret in the repo settings.

## 8. Publish and prepare

README with setup steps. Push it, then clone it fresh somewhere else to check it
actually runs.

Then prepare to talk through: your architecture, the token approach, accessibility
choices, testing, CI, what you'd do differently, and **how you'd grow this into a
full design system**. That last one is what they're really testing.

---

## Two things to decide early

**The npm name.** `faster` and `faster-ui` are both already taken. Use something
like `@yourname/faster-ui`.

**How Tailwind ships.** Either you ship ready-made CSS, or users have to set up
Tailwind themselves. Shipping the CSS is easier for them. Decide before step 4.

## One unclear thing in the brief

Step 7 is called "Publish Repository & Storybook", but the details only mention
running Storybook locally. Deploying it to GitHub Pages is quick — just do both
and it's covered either way.
