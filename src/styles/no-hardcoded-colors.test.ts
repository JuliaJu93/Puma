import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Mechanical enforcement of the brief's "no hardcoded colors" requirement:
 * component implementation files must reference only design tokens
 * (Tailwind utility classes backed by src/styles/index.css), never a raw
 * hex/rgb/hsl value.
 *
 * Scoped to implementation files only (`.tsx`/`.ts`/`.css`, excluding
 * `.test.`, `.stories.`, and `.cy.` files) — test and Cypress files
 * legitimately assert against computed color values (e.g.
 * `.should("have.css", "color").and("not.equal", "rgb(0, 0, 0)")`), which
 * isn't the same thing as a component styling itself with a hardcoded color.
 */
const COMPONENTS_DIR = join(__dirname, "..", "components");
const HARDCODED_COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const IMPLEMENTATION_FILE_PATTERN = /\.(tsx|ts|css)$/;
const NON_IMPLEMENTATION_FILE_PATTERN = /\.(test|stories|cy)\.[tj]sx?$/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function findImplementationFiles(): string[] {
  return walk(COMPONENTS_DIR).filter(
    (file) =>
      IMPLEMENTATION_FILE_PATTERN.test(file) &&
      !NON_IMPLEMENTATION_FILE_PATTERN.test(file),
  );
}

describe("no hardcoded colors in component implementation files", () => {
  const files = findImplementationFiles();

  it("found at least one implementation file to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s uses only design tokens, no raw color values", (file) => {
    const content = readFileSync(file, "utf8");
    expect(content).not.toMatch(HARDCODED_COLOR_PATTERN);
  });
});
