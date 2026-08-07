import { Button } from "../Button";
import { Dialog } from "./Dialog";

/**
 * jsdom (Jest) can't do focus trapping, scroll locking, or real keyboard
 * navigation — those need a real DOM and a real Radix mount. This file tests
 * Dialog's composition (that we wired Radix correctly), not Radix's own focus
 * trap implementation, per STEP-5-TESTS.md rule 2.
 */
function BasicDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Open dialog</Button>
      </Dialog.Trigger>
      <Dialog.Content size="md">
        <Dialog.Header>
          <Dialog.Title>Delete project</Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        <Dialog.Body>This action cannot be undone.</Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="ghost">Cancel</Button>
          </Dialog.Close>
          <Button>Confirm</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}

describe("Dialog", () => {
  beforeEach(() => {
    cy.get("body").realHover({ position: "bottomRight" });
  });

  describe("mounting & rendering", () => {
    it("mounts closed — content is not in the DOM until opened", () => {
      cy.mount(<BasicDialog />);
      cy.get('[role="dialog"]').should("not.exist");
      cy.contains("button", "Open dialog").should("be.visible");
    });

    it("each size renders at its design-spec §6 width", () => {
      // Wide enough that the `max-w-[calc(100vw-2rem)]` responsive clamp
      // (Step 4's granted exception) never kicks in — this test is about the
      // unclamped size tokens; §responsive below covers the clamp itself.
      cy.viewport(1280, 900);

      cy.mount(
        <Dialog.Root defaultOpen>
          <Dialog.Content size="sm">
            <Dialog.Title>Small</Dialog.Title>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog.Root>,
      );
      cy.get('[role="dialog"]').should("have.css", "width", "400px");

      cy.mount(
        <Dialog.Root defaultOpen>
          <Dialog.Content size="md">
            <Dialog.Title>Medium</Dialog.Title>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog.Root>,
      );
      cy.get('[role="dialog"]').should("have.css", "width", "600px");

      cy.mount(
        <Dialog.Root defaultOpen>
          <Dialog.Content size="lg">
            <Dialog.Title>Large</Dialog.Title>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog.Root>,
      );
      cy.get('[role="dialog"]').should("have.css", "width", "900px");
    });
  });

  describe("open / close", () => {
    it("opens from the trigger and closes from DialogClose", () => {
      cy.mount(<BasicDialog />);
      cy.contains("button", "Open dialog").realClick();
      cy.get('[role="dialog"]').should("be.visible");

      cy.contains("button", "Cancel").realClick();
      cy.get('[role="dialog"]').should("not.exist");
    });

    it("closes on Escape", () => {
      cy.mount(<BasicDialog />);
      cy.contains("button", "Open dialog").realClick();
      cy.get('[role="dialog"]').should("be.visible");
      cy.realPress("Escape");
      cy.get('[role="dialog"]').should("not.exist");
    });

    it("closes on overlay click", () => {
      cy.mount(<BasicDialog />);
      cy.contains("button", "Open dialog").realClick();
      cy.get('[role="dialog"]').should("be.visible");
      // Click the overlay itself, not the modal card sitting on top of it.
      cy.get('[role="dialog"]').parent().find("> :first-child").realClick("topLeft");
      cy.get('[role="dialog"]').should("not.exist");
    });
  });

  describe("focus behaviour", () => {
    it("traps focus — Tab cycles inside the dialog instead of escaping to the page", () => {
      cy.mount(<BasicDialog />);
      cy.contains("button", "Open dialog").realClick();
      cy.get('[role="dialog"]').should("be.visible");

      // Radix autofocuses the first focusable descendant on open — Close —
      // before any Tab is pressed. From there Tab should visit Cancel, then
      // Confirm, then wrap back to Close, never escaping to the trigger
      // behind it.
      cy.focused().should("have.attr", "aria-label", "Close");
      cy.realPress("Tab");
      cy.focused().should("contain.text", "Cancel");
      cy.realPress("Tab");
      cy.focused().should("contain.text", "Confirm");
      cy.realPress("Tab");
      cy.focused().should("have.attr", "aria-label", "Close");
    });

    it("returns focus to the trigger on close", () => {
      cy.mount(<BasicDialog />);
      cy.contains("button", "Open dialog").realClick();
      cy.get('[role="dialog"]').should("be.visible");
      cy.realPress("Escape");
      cy.get('[role="dialog"]').should("not.exist");
      cy.focused().should("contain.text", "Open dialog");
    });
  });

  describe("scroll lock", () => {
    // Radix's scroll lock (react-remove-scroll under the hood) works by
    // injecting a <style> rule, not by setting body.style.overflow inline —
    // verified by probing the DOM directly — so this asserts the *computed*
    // overflow rather than the inline style property.
    it("locks body scroll while open and unlocks after close", () => {
      cy.mount(<BasicDialog />);
      cy.get("body").should(($body) => {
        expect(getComputedStyle($body[0]).overflow).not.to.equal("hidden");
      });

      cy.contains("button", "Open dialog").realClick();
      cy.get('[role="dialog"]').should("be.visible");
      cy.get("body").should(($body) => {
        expect(getComputedStyle($body[0]).overflow).to.equal("hidden");
      });

      cy.realPress("Escape");
      cy.get('[role="dialog"]').should("not.exist");
      cy.get("body").should(($body) => {
        expect(getComputedStyle($body[0]).overflow).not.to.equal("hidden");
      });
    });
  });

  describe("responsive", () => {
    it("does not overflow a 375px viewport even at the Large size", () => {
      cy.viewport(375, 700);
      cy.mount(
        <Dialog.Root defaultOpen>
          <Dialog.Content size="lg">
            <Dialog.Title>Large on mobile</Dialog.Title>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog.Root>,
      );
      cy.get('[role="dialog"]').then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.width).to.be.at.most(375);
        expect(rect.left).to.be.at.least(0);
        expect(rect.right).to.be.at.most(375);
      });
    });
  });
});
