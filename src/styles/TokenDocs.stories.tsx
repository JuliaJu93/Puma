import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Reads a CSS custom property's resolved value straight from :root, rather
 * than duplicating hex values here — that keeps this story honest as the
 * token file changes. src/styles/tokens.test.ts is the thing that actually
 * guards index.css against docs/design-spec.md; this story is visual proof
 * the values it asserts are really wired into the cascade.
 *
 * No state/effect needed: the stylesheet is already on the page by the time
 * Storybook renders this story, so document.documentElement can be read
 * directly during render rather than deferred to an effect.
 *
 * Every className below is written out as a full literal string, never
 * built with a template literal. Tailwind's compiler statically scans
 * source text for whole class names — `` `bg-${token}` `` is invisible to
 * it, so a first pass at this story (built that way) silently generated
 * utilities for only a handful of swatches. That's the real "does it
 * compile" risk Task 5 warns about, at least as much as the primitive/
 * semantic var() chaining is.
 */
function readCssVar(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function Swatch({ varName, bgClassName }: { varName: string; bgClassName: string }) {
  const value = readCssVar(varName);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        className={bgClassName}
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          border: "1px solid #e1e1e1",
          flexShrink: 0,
        }}
      />
      <code style={{ fontSize: 12 }}>{varName}</code>
      <span style={{ fontSize: 12, color: "#8e8e8e" }}>{value || "—"}</span>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{title}</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function TextSample({ varName, className, label }: { varName: string; className: string; label: string }) {
  const size = readCssVar(varName);
  const lineHeight = readCssVar(`${varName}--line-height`);
  return (
    <div style={{ marginBottom: 10 }}>
      <p className={className}>{label} — the quick brown fox</p>
      <span style={{ fontSize: 12, color: "#8e8e8e" }}>
        {varName}: {size || "—"} / {lineHeight || "—"}
      </span>
    </div>
  );
}

function TokenDocs() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 900 }}>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Primitives</h2>
        <p style={{ fontSize: 13, color: "#8e8e8e", marginBottom: 16 }}>
          What each color IS. docs/design-spec.md §1.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <Group title="Neutral">
            <Swatch varName="--color-neutral-50" bgClassName="bg-neutral-50" />
            <Swatch varName="--color-neutral-100" bgClassName="bg-neutral-100" />
            <Swatch varName="--color-neutral-200" bgClassName="bg-neutral-200" />
            <Swatch varName="--color-neutral-300" bgClassName="bg-neutral-300" />
            <Swatch varName="--color-neutral-400" bgClassName="bg-neutral-400" />
            <Swatch varName="--color-neutral-500" bgClassName="bg-neutral-500" />
            <Swatch varName="--color-neutral-600" bgClassName="bg-neutral-600" />
            <Swatch varName="--color-neutral-700" bgClassName="bg-neutral-700" />
            <Swatch varName="--color-neutral-800" bgClassName="bg-neutral-800" />
            <Swatch varName="--color-neutral-900" bgClassName="bg-neutral-900" />
          </Group>
          <Group title="Brand (teal)">
            <Swatch varName="--color-brand-100" bgClassName="bg-brand-100" />
            <Swatch varName="--color-brand-200" bgClassName="bg-brand-200" />
            <Swatch varName="--color-brand-300" bgClassName="bg-brand-300" />
            <Swatch varName="--color-brand-500" bgClassName="bg-brand-500" />
            <Swatch varName="--color-brand-700" bgClassName="bg-brand-700" />
          </Group>
          <Group title="Danger (red)">
            <Swatch varName="--color-danger-50" bgClassName="bg-danger-50" />
            <Swatch varName="--color-danger-100" bgClassName="bg-danger-100" />
            <Swatch varName="--color-danger-200" bgClassName="bg-danger-200" />
            <Swatch varName="--color-danger-300" bgClassName="bg-danger-300" />
            <Swatch varName="--color-danger-500" bgClassName="bg-danger-500" />
            <Swatch varName="--color-danger-600" bgClassName="bg-danger-600" />
          </Group>
          <Group title="Functional">
            <Swatch varName="--color-warning-500" bgClassName="bg-warning-500" />
          </Group>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Semantics</h2>
        <p style={{ fontSize: 13, color: "#8e8e8e", marginBottom: 16 }}>
          What each color is FOR. Components reference only these, never the primitives above.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          <Group title="Surface">
            <Swatch varName="--color-surface" bgClassName="bg-surface" />
            <Swatch varName="--color-surface-disabled" bgClassName="bg-surface-disabled" />
          </Group>
          <Group title="Foreground">
            <Swatch varName="--color-fg" bgClassName="bg-fg" />
            <Swatch varName="--color-fg-muted" bgClassName="bg-fg-muted" />
            <Swatch varName="--color-fg-subtle" bgClassName="bg-fg-subtle" />
            <Swatch varName="--color-fg-disabled" bgClassName="bg-fg-disabled" />
            <Swatch varName="--color-fg-heading" bgClassName="bg-fg-heading" />
            <Swatch varName="--color-fg-on-accent" bgClassName="bg-fg-on-accent" />
            <Swatch varName="--color-input-fg-disabled" bgClassName="bg-input-fg-disabled" />
            <Swatch varName="--color-link-fg-disabled" bgClassName="bg-link-fg-disabled" />
          </Group>
          <Group title="Border">
            <Swatch varName="--color-border" bgClassName="bg-border" />
            <Swatch varName="--color-border-disabled" bgClassName="bg-border-disabled" />
            <Swatch varName="--color-border-focus" bgClassName="bg-border-focus" />
            <Swatch varName="--color-border-error" bgClassName="bg-border-error" />
          </Group>
          <Group title="Accent (brand)">
            <Swatch varName="--color-accent" bgClassName="bg-accent" />
            <Swatch varName="--color-accent-hover" bgClassName="bg-accent-hover" />
            <Swatch varName="--color-accent-pressed" bgClassName="bg-accent-pressed" />
            <Swatch varName="--color-accent-disabled" bgClassName="bg-accent-disabled" />
          </Group>
          <Group title="Danger">
            <Swatch varName="--color-danger" bgClassName="bg-danger" />
            <Swatch varName="--color-danger-hover" bgClassName="bg-danger-hover" />
            <Swatch varName="--color-danger-pressed" bgClassName="bg-danger-pressed" />
            <Swatch varName="--color-danger-disabled-fill" bgClassName="bg-danger-disabled-fill" />
            <Swatch varName="--color-danger-disabled-fg" bgClassName="bg-danger-disabled-fg" />
          </Group>
          <Group title="Overlay">
            <Swatch varName="--color-overlay" bgClassName="bg-overlay" />
          </Group>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Type scale</h2>
        <p style={{ fontSize: 13, color: "#8e8e8e", marginBottom: 16 }}>
          docs/design-spec.md §2. Shared by Button and Input across their 3 sizes; title is Dialog-only.
        </p>
        <TextSample varName="--text-control-sm" className="text-control-sm" label="Small" />
        <TextSample varName="--text-control-md" className="text-control-md" label="Medium" />
        <TextSample varName="--text-control-lg" className="text-control-lg" label="Large" />
        <TextSample varName="--text-title" className="text-title" label="Dialog title" />
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Radius</h2>
        <p style={{ fontSize: 13, color: "#8e8e8e", marginBottom: 16 }}>docs/design-spec.md §3.</p>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <div className="rounded-control bg-neutral-200" style={{ width: 64, height: 64 }} />
            <span style={{ fontSize: 12, color: "#8e8e8e" }}>--radius-control (4px)</span>
          </div>
          <div>
            <div className="rounded-pill bg-neutral-200" style={{ width: 64, height: 64 }} />
            <span style={{ fontSize: 12, color: "#8e8e8e" }}>--radius-pill (100px)</span>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Shadow</h2>
        <p style={{ fontSize: 13, color: "#8e8e8e", marginBottom: 16 }}>
          docs/design-spec.md §3. Dialog modal only.
        </p>
        <div className="shadow-dialog bg-surface" style={{ width: 160, height: 90, borderRadius: 4 }} />
        <span style={{ fontSize: 12, color: "#8e8e8e" }}>--shadow-dialog</span>
      </section>

      <section>
        <h2 style={{ marginBottom: 4 }}>Control heights &amp; odd padding</h2>
        <p style={{ fontSize: 13, color: "#8e8e8e", marginBottom: 16 }}>
          docs/design-spec.md §3. The two values that break the 4px grid, kept at component level.
        </p>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 16 }}>
          <div className="h-control-lg bg-neutral-200" style={{ width: 48 }} />
          <div className="h-control-md bg-neutral-200" style={{ width: 48 }} />
          <div className="h-control-sm bg-neutral-200" style={{ width: 48 }} />
        </div>
        <span style={{ fontSize: 12, color: "#8e8e8e", display: "block", marginBottom: 16 }}>
          --spacing-control-lg / -md / -sm (40 / 36 / 24px)
        </span>
        <div style={{ display: "flex", gap: 16 }}>
          <div className="py-control-py-md bg-neutral-200" style={{ width: 80, paddingLeft: 8, paddingRight: 8 }}>
            py-control-py-md
          </div>
          <div className="py-control-py-sm bg-neutral-200" style={{ width: 80, paddingLeft: 8, paddingRight: 8 }}>
            py-control-py-sm
          </div>
          <div className="p-iconbutton-p-lg bg-neutral-200" style={{ width: 24, height: 24 }} />
        </div>
        <span style={{ fontSize: 12, color: "#8e8e8e" }}>
          --spacing-control-py-md / -sm (7 / 3px), --spacing-iconbutton-p-lg (11px)
        </span>
      </section>
    </div>
  );
}

const meta: Meta<typeof TokenDocs> = {
  title: "Foundations/Tokens",
  component: TokenDocs,
};

export default meta;

type Story = StoryObj<typeof TokenDocs>;

export const Default: Story = {};
