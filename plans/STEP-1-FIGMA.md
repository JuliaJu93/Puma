# Step 1 — Extract design specs from Figma

**Audience: Sonnet.** This is an executable task spec. Follow it in order.

**Goal:** turn the Figma file into a written spec sheet precise enough to build the token
layer and all three components without opening Figma again.

---

## Already verified — do not re-derive

These facts were confirmed against the Figma REST API. Trust them.

| Item | Value |
|---|---|
| File key | `NLc9P4tRkrtOLz7yqgR6K8` |
| File name | TapTap Design System丨Developers (Community) (Copy) |
| Owner | The user (a duplicate they own — full API access) |
| Auth | `FIGMA_TOKEN` in `.env` at repo root, already gitignored |
| API status | Confirmed working, HTTP 200 |

**The three component pages** (these are `CANVAS` nodes — whole pages, not frames):

| Component | Node ID | Frames | Contents |
|---|---|---|---|
| Button | `15:12480` | 11 | 4 × `Button`, 4 × `Danger Button`, 3 × `IconButton` |
| Input | `11:7661` | 7 | 7 × `Input` |
| Dialog | `12:11244` | 4 | 4 × `Dialog` |

> **Critical gotcha:** frame names are duplicated. There are four frames literally named
> "Button". The names carry no state information — the variants and states are distinguished
> only by their **contents and styling**. You cannot map states by name. See Task 3.

---

## Rules

1. **Never print, log, echo, or commit the token.** Read it via `process.env.FIGMA_TOKEN` only.
   Never inline it into a file, a URL you print, or a commit.
2. `.env` is gitignored. Keep it that way. Do not create a second copy of the token anywhere.
3. Cache API responses to disk so you are not re-fetching on every run. Gitignore the cache.
4. If something is genuinely ambiguous in the design, write it down as an open question in the
   spec sheet rather than inventing a value. A flagged unknown is fine; a fabricated hex is not.

---

## Deliverables

All paths below are relative to the **repo root**, not to this `Plans/` folder.

| Path | What |
|---|---|
| `scripts/fetch-figma.mjs` | Pulls node JSON + rendered PNGs, caches both |
| `.cache/figma/` | Raw API responses and PNGs (gitignored) |
| `docs/design-spec.md` | **The main deliverable** — the human-readable spec sheet |

---

## Task 1 — Write the fetch script

Create `scripts/fetch-figma.mjs`. Node 18+ has global `fetch`, no dependencies needed.

It should:

- Read `FIGMA_TOKEN` from the environment (load `.env` with `node --env-file=.env`)
- Fetch each page's full node tree and write to `.cache/figma/<component>.json`
- Skip the fetch if the cache file already exists, unless `--force` is passed
- Exit with a clear error if the token is missing or the API returns non-200

Endpoints:

```
GET https://api.figma.com/v1/files/NLc9P4tRkrtOLz7yqgR6K8/nodes?ids=<id>
    header: X-Figma-Token: <token>
```

Fetch each page separately rather than all three at once — the combined response is large
and harder to work with.

Do **not** pass a shallow `depth` parameter. You need the full tree: fills, strokes, corner
radii, padding, and typography all live on leaf nodes.

## Task 2 — Render PNGs for visual reference

This is the key technique for resolving the duplicate-name problem, so do not skip it.

```
GET https://api.figma.com/v1/images/NLc9P4tRkrtOLz7yqgR6K8?ids=<comma-separated>&format=png&scale=2
```

This returns temporary S3 URLs. Download them to `.cache/figma/png/`.

Render **each individual frame** (all 22), not just the three pages. Then actually look at the
images. The JSON tells you the exact numbers; the PNGs tell you which frame is hover, which is
disabled, and which is the error state. You need both — reading the JSON alone will leave you
guessing at the state mapping.

## Task 3 — Map frames to variants and states

For each page, work out what each frame represents. Use, in order of reliability:

1. **The rendered PNG** — what does it actually look like?
2. **Fill and stroke colors** — a grey fill on a Button frame is almost certainly `disabled`;
   a red border on an Input is `error`; an extra outer stroke is likely `focus`
3. **Absolute position** — designers lay variants out in a grid. Sort by `absoluteBoundingBox`
   x/y. Rows and columns usually correspond to variant and state.
4. **Size differences** — different heights on otherwise identical frames mean size variants
   (sm / md / lg)

Expected shape based on the counts, but **verify rather than assume**:

- Button: 4 frames × 2 styles (`Button`, `Danger Button`) — likely 4 states or 4 sizes
- IconButton: 3 frames — likely 3 sizes
- Input: 7 frames — likely 7 states (default, hover, focus, filled, disabled, error, read-only)
- Dialog: 4 frames — likely 4 size or layout variants

Write your mapping into the spec sheet with the node ID next to each entry, so it can be
re-checked later.

## Task 4 — Extract the values

For every frame, pull from the JSON:

**Colors** — `fills[].color` is `{r,g,b,a}` with channels in the range 0–1. Convert to hex:
`Math.round(channel * 255)`. Do the same for `strokes[]`. Watch for `opacity` on the node
itself, which multiplies with the fill alpha.

**Typography** — `style` object on TEXT nodes: `fontFamily`, `fontWeight`, `fontSize`,
`lineHeightPx`, `letterSpacing`.

**Geometry** — `cornerRadius` (or `rectangleCornerRadii` for per-corner values),
`strokeWeight`, `paddingLeft` / `paddingRight` / `paddingTop` / `paddingBottom`, `itemSpacing`
(the gap in auto-layout), and `absoluteBoundingBox` for width and height.

**Shadows** — `effects[]` where `type` is `DROP_SHADOW`: offset, radius, spread, color.

Also try these two, and note the result:

```
GET /v1/files/NLc9P4tRkrtOLz7yqgR6K8/styles
GET /v1/files/NLc9P4tRkrtOLz7yqgR6K8/variables/local
```

The first returns published styles with their real names — very useful for naming tokens.
The second returns Figma variables but **is Enterprise-only and will likely return 403**.
That's expected, not a failure. Move on if it does.

## Task 5 — Write `docs/design-spec.md`

Structure it in this order. Phase 2 builds the token layer directly from sections 1 and 2, so
those must be complete and unambiguous.

**1. Color palette** — every distinct color found, as hex, with a count of where it appears.
Group into families (greys, brand, red/danger). Note which look like a deliberate ramp.

**2. Typography** — every distinct combination of family, size, weight, and line-height found,
with where each is used.

**3. Geometry scales** — all distinct corner radii, spacing and padding values, and border
widths. Flag whether they form a consistent scale (4/8/12/16) or are ad hoc — this matters for
how the token scale gets built.

**4. Button** — a table with one row per variant × state. Columns: background, text color,
border, height, padding, radius, font. Include the node ID for each row.

**5. Input** — same table shape, one row per state. Also record the anatomy: is there a label,
helper text, an error message, a leading or trailing icon?

**6. Dialog** — width, radius, padding, shadow, overlay color and opacity. Record the anatomy:
header, title, close button, body, footer, and the order and alignment of footer buttons.

**7. Open questions** — anything ambiguous or missing. Specifically check whether hover and
focus states exist in the design at all; designers often omit them, and if they're missing you
will have to derive them, which is a decision worth surfacing rather than burying.

---

## Definition of done

- [ ] `docs/design-spec.md` exists and every section is filled in
- [ ] Every one of the 22 frames is accounted for and mapped to a variant/state
- [ ] Every color is a real hex from the API, not estimated from an image
- [ ] Ambiguities are listed as open questions rather than guessed
- [ ] The token never appears in any file, log line, or commit
- [ ] `.cache/` is gitignored
- [ ] `git status` shows no `.env` and no cached API data

---

## Then stop

Do not start building tokens or components. Step 1 ends with the spec sheet written and the
open questions raised. The user reviews it before Phase 2 begins.
