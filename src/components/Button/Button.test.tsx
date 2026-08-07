import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, type ButtonIntent, type ButtonSize, type ButtonVariant } from "./Button";

/**
 * jsdom can't compute CSS (no Tailwind, no layout), so this file sticks to
 * what it can verify: rendering, ARIA, event handlers, and ref/className
 * plumbing. Computed colors, focus rings, and hover/active states live in
 * Button.cy.tsx instead — see STEP-5-TESTS.md's Jest/Cypress split.
 */
describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByText("Save changes")).toBeInTheDocument();
  });

  it('defaults to type="button" so it never submits a form accidentally', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("respects an explicit type override", () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  describe("variant × intent × size matrix", () => {
    const VARIANTS: ButtonVariant[] = ["primary", "outline", "ghost", "link"];
    const INTENTS: ButtonIntent[] = ["default", "danger"];
    const SIZES: ButtonSize[] = ["sm", "md", "lg"];

    const combinations = VARIANTS.flatMap((variant) =>
      INTENTS.flatMap((intent) => SIZES.map((size) => [variant, intent, size] as const)),
    );

    it.each(combinations)("renders variant=%s intent=%s size=%s without error", (variant, intent, size) => {
      render(
        <Button variant={variant} intent={intent} size={size}>
          Go
        </Button>,
      );
      expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("fires onClick when clicked", () => {
      const onClick = jest.fn();
      render(<Button onClick={onClick}>Save</Button>);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not fire onClick when disabled", () => {
      const onClick = jest.fn();
      render(
        <Button disabled onClick={onClick}>
          Save
        </Button>,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("icons", () => {
    it("renders startIcon and endIcon, both hidden from assistive tech", () => {
      render(
        <Button startIcon={<svg data-testid="start-icon" />} endIcon={<svg data-testid="end-icon" />}>
          Save
        </Button>,
      );
      expect(screen.getByTestId("start-icon").closest("span")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByTestId("end-icon").closest("span")).toHaveAttribute("aria-hidden", "true");
    });

    it("renders no icon wrapper when neither icon prop is given", () => {
      const { container } = render(<Button>Save</Button>);
      expect(container.querySelector("[aria-hidden]")).not.toBeInTheDocument();
    });
  });

  describe("asChild", () => {
    it("renders the given child element instead of a <button>", () => {
      render(
        <Button asChild>
          <a href="/somewhere">Go</a>
        </Button>,
      );
      expect(screen.getByRole("link", { name: "Go" }).tagName).toBe("A");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("merges Button's className onto the child, keeping the child's own class", () => {
      // Deliberately non-Tailwind-shaped names (no bg-/text-/from- etc.
      // prefixes) — tailwind-merge classifies by prefix, and a name that
      // *looks* like a utility gets silently deduped against a same-group
      // class instead of surviving verbatim. See cn.ts's own docstring.
      render(
        <Button asChild className="qa-button-marker">
          <a href="/somewhere" className="qa-child-marker">
            Go
          </a>
        </Button>,
      );
      const link = screen.getByRole("link");
      expect(link.className).toContain("qa-button-marker");
      expect(link.className).toContain("qa-child-marker");
    });

    it("does not forward the ref onto the child — documented in Button's own JSDoc", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <Button asChild ref={ref}>
          <a href="/somewhere">Go</a>
        </Button>,
      );
      expect(ref.current).toBeNull();
    });
  });

  it("passes a custom className through cn() merging", () => {
    render(<Button className="consumer-marker">Save</Button>);
    expect(screen.getByRole("button")).toHaveClass("consumer-marker");
  });

  it("forwards its ref to a real HTMLButtonElement", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
