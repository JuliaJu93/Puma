import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { Button, type ButtonIntent, type ButtonVariant } from "./Button";

/**
 * axe's color-contrast rule is disabled here for two independent reasons,
 * both worth stating rather than leaving the suppression to look like a
 * blanket dodge:
 *
 * 1. docs/accessibility.md records that Primary/default and most Outline/
 *    Link/Ghost-danger text pairings genuinely fail WCAG AA — inherited
 *    unchanged from the Figma palette (STEP-3-TOKENS.md: values are
 *    recorded and traced, not adjusted to pass). That's a known,
 *    already-flagged limitation, not something a passing test should hide.
 * 2. Independently of (1), this project's Tailwind classes resolve through
 *    CSS custom properties (`var(--color-accent)` etc. — the two-tier
 *    token system PLAN.md describes), and jsdom's getComputedStyle does not
 *    resolve `var()` — verified directly: a `color: var(--x)` rule reads
 *    back as the literal string `"var(--x)"`, not a color axe can parse. So
 *    color-contrast cannot fire meaningfully in Jest regardless of (1); the
 *    real, computed-value contrast coverage lives in Button.cy.tsx.
 */
const AXE_OPTIONS = {
  rules: { "color-contrast": { enabled: false } },
};

describe("Button accessibility", () => {
  const VARIANTS: ButtonVariant[] = ["primary", "outline", "ghost", "link"];
  const INTENTS: ButtonIntent[] = ["default", "danger"];

  describe.each(VARIANTS)("variant=%s", (variant) => {
    it.each(INTENTS)("intent=%s has no violations beyond the documented contrast gap", async (intent) => {
      const { container } = render(
        <Button variant={variant} intent={intent}>
          Save
        </Button>,
      );
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });
  });

  it("disabled has no violations", async () => {
    const { container } = render(
      <Button variant="primary" disabled>
        Save
      </Button>,
    );
    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });

  it("icon-only (startIcon + aria-label) has no violations — the icon stays hidden from assistive tech", async () => {
    const { container } = render(<Button aria-label="Add item" startIcon={<svg />} />);
    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });
});
