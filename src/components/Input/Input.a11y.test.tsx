import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { Input } from "./Input";

/**
 * color-contrast is disabled for the same two reasons as Button.a11y.test.tsx:
 * docs/accessibility.md's recorded, inherited-from-Figma AA gaps (e.g. the
 * Input focus border, placeholder text), and jsdom not resolving the
 * `var(--color-*)` chains this project's tokens compile to — so the rule
 * cannot fire meaningfully in Jest either way. Real computed-value contrast
 * coverage lives in Input.cy.tsx. What Jest *can* verify — and does below —
 * is the non-visual half: does the field have an accessible name at all.
 */
const AXE_OPTIONS = {
  rules: { "color-contrast": { enabled: false } },
};

describe("Input accessibility", () => {
  it("without label, aria-label, or aria-labelledby has a real accessible-name violation", async () => {
    const { container } = render(<Input />);
    const results = await axe(container, AXE_OPTIONS);
    const nameViolation = results.violations.find((v) => v.id === "label");
    expect(nameViolation).toBeDefined();
  });

  it("with a label has no violations", async () => {
    const { container } = render(<Input label="Email" />);
    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });

  it("in error state has no violations — the error message stays correctly associated", async () => {
    const { container } = render(<Input label="Email" error="Required field" />);
    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });

  it("disabled has no violations", async () => {
    const { container } = render(<Input label="Email" disabled />);
    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });
});
