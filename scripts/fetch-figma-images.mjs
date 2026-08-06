// Render and download PNGs for the 22 top-level component frames.
// Usage: node --env-file=.env scripts/fetch-figma-images.mjs [--force]

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const pngDir = path.join(repoRoot, ".cache", "figma", "png");

const FILE_KEY = "NLc9P4tRkrtOLz7yqgR6K8";

const FRAMES = {
  "button-primary": "15:12712",
  "button-danger": "15:13318",
  "button-outline": "15:13924",
  "button-outline-danger": "15:14530",
  "button-ghost": "15:15136",
  "button-ghost-danger": "15:15745",
  "button-link": "15:16354",
  "button-link-danger": "15:16837",
  "iconbutton-primary": "15:20209",
  "iconbutton-outline": "15:20436",
  "iconbutton-ghost": "15:20663",
  "input-basic": "11:7673",
  "input-left-icon": "11:8260",
  "input-right-icon": "11:8913",
  "input-number": "11:9533",
  "input-prefix-suffix": "11:10115",
  "input-prefix": "11:10732",
  "input-suffix": "11:11310",
  "dialog-basic": "13:11412",
  "dialog-warning": "13:11890",
  "dialog-scrollable": "13:12410",
  "dialog-with-divider": "13:12903",
};

const force = process.argv.includes("--force");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    console.error(
      "FIGMA_TOKEN is not set. Run with `node --env-file=.env scripts/fetch-figma-images.mjs`."
    );
    process.exit(1);
  }

  await mkdir(pngDir, { recursive: true });

  const toRender = [];
  for (const [name, id] of Object.entries(FRAMES)) {
    const outPath = path.join(pngDir, `${name}.png`);
    if (!force && (await exists(outPath))) {
      console.log(`[skip] ${name} already cached`);
      continue;
    }
    toRender.push([name, id]);
  }

  if (toRender.length === 0) {
    console.log("All PNGs already cached.");
    return;
  }

  const CHUNK_SIZE = 2;
  for (let i = 0; i < toRender.length; i += CHUNK_SIZE) {
    if (i > 0) await sleep(30000);
    const chunk = toRender.slice(i, i + CHUNK_SIZE);
    const ids = chunk.map(([, id]) => id).join(",");
    const url = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=2`;
    console.log(`[fetch] image URLs for chunk ${i / CHUNK_SIZE + 1}: ${chunk.map(([n]) => n).join(", ")}`);

    const json = await fetchWithRetry(url, token);
    if (json.err) {
      throw new Error(`Figma images API returned error: ${json.err}`);
    }

    for (const [name, id] of chunk) {
      const imageUrl = json.images[id];
      if (!imageUrl) {
        console.error(`[warn] no image URL returned for ${name} (${id})`);
        continue;
      }
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        console.error(`[warn] failed to download ${name}: HTTP ${imgRes.status}`);
        continue;
      }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const outPath = path.join(pngDir, `${name}.png`);
      await writeFile(outPath, buf);
      console.log(`[ok] wrote ${outPath} (${buf.length} bytes)`);
    }
  }

  console.log("Done.");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, token, attempts = 6) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { "X-Figma-Token": token } });
      if (res.status === 429) {
        const wait = 30000 * (i + 1);
        console.error(`[retry] rate limited, waiting ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText}\n${body}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      console.error(`[retry] attempt ${i + 1} failed: ${err.message}`);
      await sleep(5000);
    }
  }
  throw lastErr ?? new Error("rate limited after all retries");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
