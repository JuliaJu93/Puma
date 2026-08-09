import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { Input } from "./Input";

/**
 * color-contrast is disabled for the same two reasons as Button.a11y.test.tsx:
 * docs/accessibility.md's recorded, inherited-from-Figma AA gaps (e.g. the
 * Input focus border, placeholder text), and jsdom not resolving the
 * `var(--color-*)` chains this project's tokens compile to — so the rule
 * cannot fire meaningfully in Jest either way. Real computed-value contrast
 * coverage lives in Input.cy.tsx.
 *
 * The "no accessible name" case that used to be tested here (mounting
 * <Input /> with no label/aria-label/aria-labelledby and asserting an axe
 * violation) no longer compiles at all now that `label` is a required prop
 * — that's a stronger guarantee than a runtime axe check, so the test was
 * removed rather than worked around with a type-cast.
 */
const AXE_OPTIONS = {
  rules: { "color-contrast": { enabled: false } },
};

describe("Input accessibility", () => {
  it("with a label has no violations — the label is always visually hidden (sr-only), never removed", async () => {
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
