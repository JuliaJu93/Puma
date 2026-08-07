import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { Button } from "../Button";
import { Dialog } from "./Dialog";

/**
 * color-contrast disabled for the same reasons as Button.a11y.test.tsx /
 * Input.a11y.test.tsx (docs/accessibility.md's recorded gaps, and jsdom not
 * resolving this project's var(--color-*) token chains either way).
 *
 * `Dialog.Content` renders through a Radix Portal straight into
 * document.body, not into RTL's own `container` div — verified directly:
 * `container.innerHTML` is empty for an open dialog. So this file runs axe
 * against `document.body`, not `container`, or it would silently check
 * nothing and pass for the wrong reason.
 */
const AXE_OPTIONS = {
  rules: { "color-contrast": { enabled: false } },
};

describe("Dialog accessibility", () => {
  it("while open has no violations", async () => {
    render(
      <Dialog.Root defaultOpen>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Delete project</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body>This action cannot be undone.</Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button intent="danger">Delete</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>,
    );
    const results = await axe(document.body, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });
});
