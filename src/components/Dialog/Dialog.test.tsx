import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog, type DialogSize } from "./Dialog";

/**
 * Test our composition, not Radix's — focus trap, scroll lock, and real
 * keyboard navigation need a real browser and live in Dialog.cy.tsx. This
 * file covers what jsdom can: that we wired Radix's Trigger/Content/Title/
 * Close correctly, and DialogBody's asChild override.
 */
describe("Dialog", () => {
  it("opens from the trigger and closes from DialogClose", () => {
    render(
      <Dialog.Root>
        <Dialog.Trigger>Open dialog</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Delete project</Dialog.Title>
          <Dialog.Close>Close me</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Open dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close me"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("wires Radix's aria-labelledby / aria-describedby to Title and Body", () => {
    render(
      <Dialog.Root defaultOpen>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Delete project</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body>This action cannot be undone.</Dialog.Body>
        </Dialog.Content>
      </Dialog.Root>,
    );

    const dialog = screen.getByRole("dialog");
    const title = screen.getByText("Delete project");
    const body = screen.getByText("This action cannot be undone.");

    expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    expect(dialog).toHaveAttribute("aria-describedby", body.id);
  });

  describe("DialogClose accessible name", () => {
    it("has an accessible name by default", () => {
      render(
        <Dialog.Root defaultOpen>
          <Dialog.Content>
            <Dialog.Title>Delete project</Dialog.Title>
            <Dialog.Close />
          </Dialog.Content>
        </Dialog.Root>,
      );
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("a custom aria-label overrides the default", () => {
      render(
        <Dialog.Root defaultOpen>
          <Dialog.Content>
            <Dialog.Title>Delete project</Dialog.Title>
            <Dialog.Close aria-label="Dismiss" />
          </Dialog.Content>
        </Dialog.Root>,
      );
      expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });
  });

  it("DialogBody's asChild renders a <div>, not Radix's default <p> — body content isn't inline text", () => {
    render(
      <Dialog.Root defaultOpen>
        <Dialog.Content>
          <Dialog.Title>Delete project</Dialog.Title>
          <Dialog.Body data-testid="body">This action cannot be undone.</Dialog.Body>
        </Dialog.Content>
      </Dialog.Root>,
    );
    expect(screen.getByTestId("body").tagName).toBe("DIV");
  });

  describe("sizes", () => {
    const SIZES: DialogSize[] = ["sm", "md", "lg"];

    it.each(SIZES)("size=%s renders", (size) => {
      render(
        <Dialog.Root defaultOpen>
          <Dialog.Content size={size}>
            <Dialog.Title>Delete project</Dialog.Title>
          </Dialog.Content>
        </Dialog.Root>,
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
