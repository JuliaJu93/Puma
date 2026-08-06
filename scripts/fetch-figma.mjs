// Fetch Figma node JSON for the three component pages and cache to disk.
// Usage: node --env-file=.env scripts/fetch-figma.mjs [--force]

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(repoRoot, ".cache", "figma");

const FILE_KEY = "NLc9P4tRkrtOLz7yqgR6K8";

const PAGES = {
  button: "15:12480",
  input: "11:7661",
  dialog: "12:11244",
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

async function fetchNode(name, nodeId, token) {
  const outPath = path.join(cacheDir, `${name}.json`);

  if (!force && (await exists(outPath))) {
    console.log(`[skip] ${name} already cached at ${outPath}`);
    return;
  }

  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(nodeId)}`;
  console.log(`[fetch] ${name} (${nodeId})`);

  const res = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Figma API error for ${name} (${nodeId}): HTTP ${res.status} ${res.statusText}\n${body}`
    );
  }

  const json = await res.json();
  await writeFile(outPath, JSON.stringify(json, null, 2), "utf8");
  console.log(`[ok] wrote ${outPath}`);
}

async function fetchJson(name, url, token, { allow403 = false } = {}) {
  const outPath = path.join(cacheDir, `${name}.json`);

  if (!force && (await exists(outPath))) {
    console.log(`[skip] ${name} already cached at ${outPath}`);
    return;
  }

  console.log(`[fetch] ${name}`);
  const res = await fetch(url, { headers: { "X-Figma-Token": token } });

  if (!res.ok) {
    if (allow403 && res.status === 403) {
      await writeFile(
        outPath,
        JSON.stringify({ error: "403 Forbidden (Enterprise-only, as expected)" }, null, 2),
        "utf8"
      );
      console.log(`[ok] ${name}: 403 as expected, noted`);
      return;
    }
    const body = await res.text().catch(() => "");
    throw new Error(`Figma API error for ${name}: HTTP ${res.status} ${res.statusText}\n${body}`);
  }

  const json = await res.json();
  await writeFile(outPath, JSON.stringify(json, null, 2), "utf8");
  console.log(`[ok] wrote ${outPath}`);
}

async function main() {
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    console.error(
      "FIGMA_TOKEN is not set. Run with `node --env-file=.env scripts/fetch-figma.mjs`."
    );
    process.exit(1);
  }

  await mkdir(cacheDir, { recursive: true });

  for (const [name, nodeId] of Object.entries(PAGES)) {
    await fetchNode(name, nodeId, token);
  }

  await fetchJson("styles", `https://api.figma.com/v1/files/${FILE_KEY}/styles`, token);
  await fetchJson(
    "variables-local",
    `https://api.figma.com/v1/files/${FILE_KEY}/variables/local`,
    token,
    { allow403: true }
  );

  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
