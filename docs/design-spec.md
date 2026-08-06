# Design Spec — Button, Input, Dialog

Extracted from the Figma file **TapTap Design System丨Developers (Community) (Copy)**
(`NLc9P4tRkrtOLz7yqgR6K8`) via the REST API. Every value below is a real number read from
the API response, not estimated from a screenshot. Source JSON is cached in
`.cache/figma/` (gitignored); scripts are `scripts/fetch-figma.mjs` and
`scripts/fetch-figma-images.mjs`.

## Method note — how frame mapping was actually resolved

STEP-1-FIGMA.md expected the three CANVAS pages to break down into flat frames whose
variant/state had to be inferred from PNGs, fill colors, and grid position, because Figma
frame names are duplicated ("Button" appears 4 times, etc.).

That assumption turned out to be wrong in a useful way. Each of the 22 top-level frames is
not a single component — it's a full documentation page (title, usage notes, a "Variants"
teaser row, and a "🔒 Main components" section). Nested inside every one of those pages is a
real Figma `COMPONENT_SET` whose children are `COMPONENT` nodes with **explicit, unambiguous
variant names** — e.g. `"Size=Large, State=Hover, Left Icon=False, Right Icon=False"`. That is
strictly more reliable than sorting frames by pixel position or guessing state from a grey
fill, so it's what this spec is built from. All node IDs below point at these named
`COMPONENT` nodes, not at the 22 outer documentation frames.

PNGs of the 22 outer frames were still rendered to `.cache/figma/png/` per the task
instructions and used as a sanity check, but the source of truth for every value in this
document is the named component tree, not pixel-peeping.

---

## 0. The 22 top-level frames, mapped

| # | Frame ID | Name | What it actually is |
|---|---|---|---|
| 1 | `15:12712` | Button | Documentation page for **Button / Primary** style (contains `COMPONENT_SET 15:12968`) |
| 2 | `15:13318` | Danger Button | Doc page for **Button / Primary**, danger intent (`15:13574`) |
| 3 | `15:13924` | Button | Doc page for **Button / Outline** (`15:14180`) |
| 4 | `15:14530` | Danger Button | Doc page for **Button / Outline**, danger intent (`15:14786`) |
| 5 | `15:15136` | Button | Doc page for **Button / Ghost** (`15:15392`) |
| 6 | `15:15745` | Danger Button | Doc page for **Button / Ghost**, danger intent (`15:16001`) |
| 7 | `15:16354` | Button | Doc page for **Button / Link** (`15:16610`) |
| 8 | `15:16837` | Danger Button | Doc page for **Button / Link**, danger intent (`15:17093`) |
| 9 | `15:20209` | IconButton | Doc page for **IconButton / Primary** (`15:20350`) |
| 10 | `15:20436` | IconButton | Doc page for **IconButton / Outline** (`15:20577`) |
| 11 | `15:20663` | IconButton | Doc page for **IconButton / Ghost** (`15:20824`) |
| 12 | `11:7673` | Input | Doc page for **Input / Basic** (`11:7949`) |
| 13 | `11:8260` | Input | Doc page for **Input / Left icon** (`11:8536`) |
| 14 | `11:8913` | Input | Doc page for **Input / Right icon** (`11:9189`) |
| 15 | `11:9533` | Input | Doc page for **Input / Number** (`11:9747`) |
| 16 | `11:10115` | Input | Doc page for **Input / Prefix & Suffix** (`11:10328`) |
| 17 | `11:10732` | Input | Doc page for **Input / Prefix** (`11:10945`) |
| 18 | `11:11310` | Input | Doc page for **Input / Suffix** (`11:11523`) |
| 19 | `13:11412` | Dialog | Doc page for **Dialog / Basic** (`13:11504`) |
| 20 | `13:11890` | Dialog | Doc page for **Dialog / Warning** (`13:11982`) |
| 21 | `13:12410` | Dialog | Doc page for **Dialog / Scrollable** (`13:12502`) |
| 22 | `13:12903` | Dialog | Doc page for **Dialog / With divider** (`13:12995`) |

The x-position of each Button/Danger-Button frame pair encodes the *style* (Primary,
Outline, Ghost, Link, left to right); the y-position (or the "Danger Button" vs "Button" page
name) encodes the *intent* (default vs danger). IconButton has only 3 styles — no Link, no
danger intent exist for it in this file.

Button and IconButton page also render a "🛠 Variants" teaser strip and a "📐 Space" example
row; those are documentation illustrations, not additional components, and are not itemized
below.

---

## 1. Color palette

Values were tallied by walking every node **inside each `COMPONENT_SET`** (i.e. the real
components, not the documentation chrome — headers, redline annotations, and spacing
diagrams use a completely different, much louder color set and would pollute this table).
Counts are number of fill/stroke occurrences found by the API across Button, Input, and
Dialog combined.

### Neutrals / greys

| Hex | Count | Role |
|---|---|---|
| `#ffffff` | 429 | Base background — button fills, input fields, dialog modal |
| `#4b4b4b` | 243 | Primary body text (filled input text, Outline/Ghost button text, dialog body) |
| `#8e8e8e` | 231 | Icon default tint (search/close/stepper icons, prefix/suffix text) |
| `#cacaca` | 177 | Placeholder text; disabled text on Outline/Ghost buttons |
| `#fafafa` | 90 | Disabled input background |
| `#eeeeee` | 60 (stroke) | Disabled Outline-button border; disabled input border |
| `#e1e1e1` | 96 (36 fill + 60 stroke) | Default input/Outline-button border; Ghost-button pressed fill |
| `#f5f5f5` | 27 | Ghost-button hover fill |
| `#1f1f1f` | 12 | Headings — dialog title text |
| `#000000` | 12 | Dialog overlay ("Smoke") base color, always at 30% opacity |

### Brand teal ramp (Button Primary / Outline / Link, Input focus)

| Hex | Count | Role |
|---|---|---|
| `#b0ebec` | 12 | Primary-button disabled background |
| `#47cfd6` | 93 (42 fill + 51 stroke) | Hover — Primary bg, Outline border, Link text |
| `#15c5ce` | 105 (36 fill + 69 stroke) | Default/base — Primary bg, Outline border/Link text, **Input focus border** |
| `#00abb6` | 51 (42 fill + 9 stroke) | Pressed — Primary bg, Outline border, Link text |
| `#7ddde1` | 15 | Link-button disabled text (a distinct tint, not the same as `#b0ebec`) |

### Danger/red ramp (Button danger intent, Input error state)

| Hex | Count | Role |
|---|---|---|
| `#ffccd2` | 18 | Danger-Primary disabled background; Danger-Ghost pressed fill |
| `#f49898` | 54 (45 fill + 9 stroke) | Danger-Outline border/text disabled; Danger-Link disabled text |
| `#eb6f70` | 48 (39 fill + 9 stroke) | Hover — Danger-Primary bg, Danger-Outline border, Danger-Link text |
| `#f64c4c` | 168 (114 fill + 54 stroke) | Default — Danger-Primary bg, Danger-Outline border/text, Danger-Link text, **Input error border/text** |
| `#ec2d30` | 63 (54 fill + 9 stroke) | Pressed — Danger-Primary bg, Danger-Outline border, Danger-Link text |
| `#fef2f2` | 9 | Danger-Ghost hover fill |

### Single-use / functional

| Hex | Count | Role |
|---|---|---|
| `#ffad0d` | 7 | Warning icon (triangle "!") in Dialog / Warning variant only |

**Is this a deliberate ramp?** Yes for both brand and danger — each is a 4–5 step scale that
maps cleanly to interaction state (disabled → hover → default → pressed, roughly
light-to-dark). The two ramps are *not* parameterized the same way though: brand reuses one
"disabled" tint (`#b0ebec`) for every disabled brand surface, whereas danger uses two
different disabled tints depending on whether it's a fill (`#ffccd2`) or a
border/text-on-white (`#f49898`). See open questions.

---

## 2. Typography

Font families in the file: **PingFang SC** (all component text), PingFang HK and Roboto (used
only in documentation headers/logos — not part of any component, excluded here).

| Size / Line-height | Weight | Used in |
|---|---|---|
| 12px / 18px | 400 (regular) | Button Small — Outline/Ghost/Link label |
| 12px / 18px | 500 (medium) | Button Small — Primary label; Input Small field text |
| 14px / 22px | 400 (regular) | Button Medium — Outline/Ghost/Link label; Input error/help text; Dialog body text; Input Medium field text |
| 14px / 22px | 500 (medium) | Button Medium — Primary label; Dialog footer-button (Confirm) label |
| 16px / 24px | 400 (regular) | Button Large — Outline/Ghost/Link label; Input Large field text |
| 16px / 24px | 500 (medium) | Button Large — Primary label |
| 18px / 26px | 500 (medium) | Dialog title |

**Rule found in the data:** filled buttons (Primary, white-on-color) always use weight 500;
buttons with a transparent/white background and colored text (Outline, Ghost, Link) always
use weight 400. Input field text is always weight 400 regardless of size or state.

**Input font size scales with the `Size` prop** exactly like Button does: Large → 16/24,
Medium → 14/22, Small → 12/18.

---

## 3. Geometry scales

### Corner radius

| Radius | Used on |
|---|---|
| `4px` | Button (all styles/sizes), Input (all variants/sizes), Dialog Modal card |
| `100px` (i.e. fully round) | IconButton (all sizes) |

Note: the outer `COMPONENT` node for every Dialog and Button variant also carries a stray
`cornerRadius: 8`, but that's on the invisible documentation-canvas wrapper, not on anything
that actually renders — the real, visible radius comes from the nested "Modal" (Dialog) or
the component root itself (Button). Don't copy the `8`.

### Border width

`1px` everywhere a border/stroke appears (Outline button, Input border, Dialog divider
lines). No file uses a heavier stroke.

### Spacing — is it a consistent 4/8 scale?

Mostly yes, with one intentional shrink at Small size:

| Token | Large | Medium | Small |
|---|---|---|---|
| Button padding (L/R, T/B) | 8 / 8 | 8 / 7 | 4 / 3 |
| Button icon↔text gap | 4 | 4 | 4 |
| Input padding (L/R, T/B) | 12 / 8 | 12 / 7 | 8 / 3 |
| IconButton padding (all sides) | 11 | *not verified* | *not verified* |
| Dialog Modal padding (all sides) | 24 | 24 | 24 |
| Dialog content↔footer gap | 32 | 32 | 32 |

Vertical paddings of 7 and 3 (Medium/Small) break a strict 4-multiple scale — they're clearly
chosen to make total height land on 36px/24px rather than following 4/8 religiously. Treat the
scale as **"4 as the base unit, adjusted to hit exact component heights of 40/36/24"** rather
than a pure 4/8/12/16 ramp.

### Component heights (derived, all confirmed against `absoluteBoundingBox`)

| Size | Button height | Input height | IconButton (square) |
|---|---|---|---|
| Large | 40px | 40px | 40px |
| Medium | 36px | 36px | 36px |
| Small | 24px | 24px | 24px |

### Dialog Modal width by size

| Size | Modal width |
|---|---|
| Large | 900px |
| Medium | 600px |
| Small | 400px |

(Height is intrinsic/auto — `202px` for Basic/Warning content, `400px` for Scrollable/With
divider, driven by content, not a fixed token.)

### Shadows

Dialog Modal uses a two-layer drop shadow (identical across all sizes/variants):

```
0px 24px 60px rgba(0,0,0,0.12)
0px 8px 20px rgba(0,0,0,0.06)
```

Dialog overlay ("Smoke"): solid `#000000` at **30% opacity**, full-bleed behind the modal.

---

## 4. Button

Button has **4 styles** (Primary, Outline, Ghost, Link) × **2 intents** (default, danger) ×
**3 sizes** (Large/Medium/Small) × **4 states** (Default, Hover, Pressed, Disabled) × icon
slot (none / left / right — cosmetic only, doesn't change color/geometry). Rows below are one
per style × intent × state, sampled at Large size; the size table in §3 gives the
Medium/Small deltas (padding/font only — colors are identical across sizes). Node IDs point
at the `Left Icon=False, Right Icon=False` component for that combination.

| Style | Intent | State | Background | Text | Border | Node ID |
|---|---|---|---|---|---|---|
| Primary | default | Default | `#15c5ce` | `#ffffff` | — | `15:13086` |
| Primary | default | Hover | `#47cfd6` | `#ffffff` | — | `15:13047` |
| Primary | default | Pressed | `#00abb6` | `#ffffff` | — | `15:13008` |
| Primary | default | Disabled | `#b0ebec` | `#ffffff` | — | `15:12969` |
| Primary | danger | Default | `#f64c4c` | `#ffffff` | — | `15:13692` |
| Primary | danger | Hover | `#eb6f70` | `#ffffff` | — | `15:13653` |
| Primary | danger | Pressed | `#ec2d30` | `#ffffff` | — | `15:13614` |
| Primary | danger | Disabled | `#ffccd2` | `#ffffff` | — | `15:13575` |
| Outline | default | Default | `#ffffff` | `#4b4b4b` | `#e1e1e1` | `15:14298` |
| Outline | default | Hover | `#ffffff` | `#47cfd6` | `#47cfd6` | `15:14259` |
| Outline | default | Pressed | `#ffffff` | `#00abb6` | `#00abb6` | `15:14220` |
| Outline | default | Disabled | `#ffffff` | `#cacaca` | `#eeeeee` | `15:14181` |
| Outline | danger | Default | `#ffffff` | `#f64c4c` | `#f64c4c` | `15:14904` |
| Outline | danger | Hover | `#ffffff` | `#eb6f70` | `#eb6f70` | `15:14865` |
| Outline | danger | Pressed | `#ffffff` | `#ec2d30` | `#ec2d30` | `15:14826` |
| Outline | danger | Disabled | `#ffffff` | `#f49898` | `#f49898` | `15:14787` |
| Ghost | default | Default | transparent | `#4b4b4b` | — | `15:15510` |
| Ghost | default | Hover | `#f5f5f5` | `#4b4b4b` | — | `15:15471` |
| Ghost | default | Pressed | `#e1e1e1` | `#4b4b4b` | — | `15:15432` |
| Ghost | default | Disabled | transparent | `#cacaca` | — | `15:15393` |
| Ghost | danger | Default | transparent | `#f64c4c` | — | `15:16119` |
| Ghost | danger | Hover | `#fef2f2` | `#f64c4c` | — | `15:16080` |
| Ghost | danger | Pressed | `#ffccd2` | `#ec2d30` | — | `15:16041` |
| Ghost | danger | Disabled | transparent | `#f49898` | — | `15:16002` |
| Link | default | Default | — | `#15c5ce` | — | `15:16729` |
| Link | default | Hover | — | `#47cfd6` | — | `15:16671` |
| Link | default | Pressed | — | `#00abb6` | — | `15:16641` |
| Link | default | Disabled | — | `#7ddde1` | — | `15:16611` |
| Link | danger | Default | — | `#f64c4c` | — | `15:17212` |
| Link | danger | Hover | — | `#eb6f70` | — | `15:17154` |
| Link | danger | Pressed | — | `#ec2d30` | — | `15:17124` |
| Link | danger | Disabled | — | `#f49898` | — | `15:17094` |

**Text-color behaviour by intent** (corrected — the two Outline/default rows above were
originally transcribed with the border color in the text column; re-verified against the raw
API response for every one of the 32 rows):

*Default intent* — Outline and Ghost both **rest at neutral `#4b4b4b`** and both **disable to
neutral `#cacaca`**. They differ only in between: Outline tints to the brand ramp on
Hover/Pressed (`#47cfd6` / `#00abb6`), Ghost stays `#4b4b4b` throughout. Link is the odd one
out — it uses the brand ramp at every state, including rest.

*Danger intent* — all three rest at `#f64c4c` and disable to `#f49898`. Outline and Link track
the full ramp; Ghost changes only on Pressed (`#ec2d30`).

So the real rule is: **neutral text at rest on the default intent, colored text at rest on
danger** — with `#4b4b4b` / `#cacaca` as the shared neutral foreground pair. That maps cleanly
onto two semantic tokens rather than per-style special cases. The one genuine oddity left is
Ghost/danger reacting on Pressed but not Hover; decide whether to replicate or normalize it.

**Radius:** `4px` at every size/style. **Font:** per §2 (weight 500 for Primary, 400 for
Outline/Ghost/Link).

### IconButton (not required by the brief, included for completeness — 3 of the 22 frames)

Same states/ramp as Button, but only 3 styles exist (no Link, no danger intent), radius
`100px`, and no text — just a centered icon (default tint `#8e8e8e`, inherits white on
Primary via the icon SVG fill).

| Style | State | Background | Border | Node ID (Large) |
|---|---|---|---|---|
| Primary | Default | `#15c5ce` | — | `15:20369` |
| Primary | Hover | `#47cfd6` | — | `15:20363` |
| Primary | Pressed | `#00abb6` | — | `15:20357` |
| Primary | Disabled | `#b0ebec` | — | `15:20351` |
| Outline | Default | `#ffffff` | `#e1e1e1` | `15:20596` |
| Outline | Hover | `#f5f5f5` | `#e1e1e1` | `15:20590` |
| Outline | Pressed | `#e1e1e1` | `#e1e1e1` | `15:20584` |
| Outline | Disabled | `#ffffff` | `#eeeeee` | `15:20578` |
| Ghost | Default | transparent | — | `15:20843` |
| Ghost | Hover | `#f5f5f5` | — | `15:20837` |
| Ghost | Pressed | `#e1e1e1` | — | `15:20831` |
| Ghost | Disabled | transparent | — | `15:20825` |

Padding sampled at Large = `11px` all sides (`15:20369`). Medium/Small padding was not
sampled since IconButton isn't a required deliverable — flagged in Open Questions if it's
ever needed.

---

## 5. Input

Input has **7 anatomy variants** (Basic, Left icon, Right icon, Number, Prefix & Suffix,
Prefix, Suffix) that only change what sits inside the field — not color or border logic. All
seven share one state machine. Table below is the full state set, sampled from **Basic** at
Large size; anatomy differences for the other six variants follow in their own table.

### States (Basic, Large)

| State | Text entered? | Background | Border | Text/Placeholder color | Node ID |
|---|---|---|---|---|---|
| Default | empty | `#ffffff` | `#e1e1e1` | `#cacaca` (placeholder) | `11:8076` |
| Default | filled | `#ffffff` | `#e1e1e1` | `#4b4b4b` | `11:8079` |
| Hover | empty | `#ffffff` | `#47cfd6` | `#cacaca` | `11:8040` |
| Pressed & Focus | empty, not typing | `#ffffff` | `#15c5ce` | `#4b4b4b` | `11:7986` |
| Pressed & Focus | typing, empty | `#ffffff` | `#15c5ce` | `#4b4b4b` | `11:7992` |
| Error | empty | `#ffffff` | `#f64c4c` | `#cacaca` (placeholder); helper text `#f64c4c` 14px | `11:7956` |
| Error | filled | `#ffffff` | `#f64c4c` | `#4b4b4b`; helper text `#f64c4c` 14px | `11:7961` |
| Disabled | empty/filled | `#fafafa` | `#eeeeee` | `#e1e1e1` | `11:8058` |

**Note on disabled text color:** Input disabled text (`#e1e1e1`) is a different token from
Button disabled text on Outline/Ghost (`#cacaca`). Both are real, verified values — not a
transcription error. Worth a decision on whether these should be the same semantic token.

**Clear button:** when the field has focus *and* the user is typing *and* text is present, an
inline clear (×) icon appears at the trailing edge (`state 2` in the Figma variant props: Not
Applicable / Clear Hover / Clear Pressed). Icon tint `#cacaca` idle. This is a real,
interactive sub-element of the Pressed & Focus state, not a separate top-level state.

**No `read-only` state exists in this file.** STEP-1-FIGMA.md's guess included one; it isn't
there. Flagged in Open Questions rather than invented.

**No label or helper text above the field exists in any captured variant** (outside the Error
state's below-field message). Flagged in Open Questions.

### Anatomy variants (state colors identical to Basic above — only anatomy differs)

| Variant | Adds | Node ID (Default, Large, empty) |
|---|---|---|
| Left icon | Leading icon, 18×18, tint `#8e8e8e`, 12px gap before text | `11:8541` |
| Right icon | Trailing icon, 18×18, tint `#8e8e8e` | `11:9194` |
| Number | Trailing up/down stepper buttons, 26px wide column, icon tint `#8e8e8e` | `11:9754` |
| Prefix & Suffix | Static text before *and* after the value (e.g. `¥` … `CNY`), color `#8e8e8e`, same 16px/24 type as field text | `11:10336` |
| Prefix | Static text before the value only | `11:10945` (component-set root) |
| Suffix | Static text after the value only | `11:11523` (component-set root) |

### Padding / height by size

See §3 spacing table. Field text size also scales with `Size` (§2).

**Radius:** `4px` at every size/variant.

---

## 6. Dialog

Dialog has **4 layout variants** × **3 sizes**. Anatomy is shared: overlay + a white "Modal"
card containing a title row (title text + close icon, top-right), a body area, and a
two-button footer (right-aligned, secondary button first/left, primary or destructive action
second/right).

| Variant | Adds vs. Basic | Footer buttons | Node ID (Large) |
|---|---|---|---|
| Basic | — | Ghost "Cancel" + Primary "Confirm" | `13:11505` |
| Warning | Warning icon (`#ffad0d`) inline at the start of the body text | Ghost "Cancel" + **Outline-danger** "Delete" | `13:11983` |
| Scrollable | Taller fixed-height body region (content scrolls internally) | Ghost "Disagree" + Primary "Agree" | `13:12503` |
| With divider | Horizontal `1px #eeeeee` divider lines separating title / body / footer; title and close button sit directly in the card (no inner "Content" wrapper) | Ghost "Cancel" + Primary "Save" | `13:12996` |

**Warning's footer button choice (Outline in the danger ramp, not Primary-danger) is a real,
deliberate difference** — worth keeping when building the component rather than normalizing
away.

### Structure (Basic, Large — `13:11505`)

- **Overlay ("Smoke")**: `#000000` @ 30% opacity, full frame.
- **Modal**: `#ffffff`, radius `4px`, padding `24px` all sides, `32px` gap between content
  block and footer, two-layer drop shadow (§3).
  - **Title row**: title text `#1f1f1f`, 18px/26 weight 500; close icon `#8e8e8e`, 14×14,
    pushed to the far right (`counterAxisAlignItems: MAX`).
  - **Body text**: `#4b4b4b`, 14px/22 weight 400.
  - **Footer**: right-aligned button row, `Ghost` then `Primary`/`Outline-danger` per variant
    table above, using the exact same Button tokens documented in §4.

### Sizes

| Size | Modal width | Node ID |
|---|---|---|
| Large | 900px | `13:11505` |
| Medium | 600px | `13:11517` |
| Small | 400px | `13:11529` |

---

## 7. Open questions

1. **Ghost-button text-color inconsistency** (§4): default intent keeps text static across
   Hover/Pressed, danger intent changes text color on Pressed only. Decide: replicate exactly,
   or normalize so Ghost text always tracks the ramp (or never does)?

2. **Two different "disabled" tokens on the danger ramp** — `#ffccd2` for disabled fills
   (Primary bg, Ghost-pressed bg) vs `#f49898` for disabled borders/text (Outline, Link). The
   brand ramp only uses one disabled tint (`#b0ebec`) for everything. Is this intentional
   (fill vs. line-art needing different contrast) or should the token layer unify it?

3. **Input disabled text (`#e1e1e1`) vs Button disabled text (`#cacaca`)** are different
   values for what reads as the same semantic role ("disabled foreground"). Confirm whether
   these should become one `disabled-foreground` token or stay separate
   (`input-disabled-foreground` vs `button-disabled-foreground`).

4. **No `read-only` Input state exists** in the file, though the original task brief guessed
   one might. If the component needs one, it has to be designed net-new — there's nothing to
   extract.

5. **No label / helper text above the Input field** in any of the 7 anatomy variants (only
   the Error state has below-field text). If the component needs a label, it isn't specified
   here.

6. **Font is PingFang SC** (a CJK-first font family) throughout. For a component library that
   needs solid Latin-script rendering, you'll want a fallback stack (e.g. `PingFang SC,
   -apple-system, "Segoe UI", Inter, sans-serif`) rather than shipping PingFang SC alone —
   this file doesn't specify a fallback, so that's a judgment call for implementation.

7. **Danger is modeled as an entirely separate top-level Figma page** ("Danger Button"), not
   as a variant property inside one component set. Recommend implementing it as an `intent`
   (or `danger`) boolean/enum prop on one `Button` component rather than a second component —
   but that's an implementation decision this spec doesn't make for you.

8. **IconButton has no Link style and no danger intent** in this file, and its Medium/Small
   padding wasn't sampled (only Large, since IconButton isn't a required component for this
   task). If IconButton gets built, padding for Medium/Small needs a fresh API check.

9. **Published Figma styles are empty** (`GET /v1/files/.../styles` returned
   `meta.styles: []`) — this is a duplicated community file where the original styles weren't
   republished, so there were no ready-made names to borrow for tokens. `variables/local`
   returned 403 as expected (Enterprise-only).

10. **Hover and focus states do exist** in this file for every interactive component (Button,
    Input) — they were not omitted by the designer, so no derivation was needed there.
