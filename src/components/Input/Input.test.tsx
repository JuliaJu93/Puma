import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./Input";

/**
 * jsdom can't compute CSS, so this file sticks to rendering, ARIA wiring,
 * and event handlers. Computed colors/borders and the real :focus-visible
 * ring live in Input.cy.tsx instead — see STEP-5-TESTS.md's Jest/Cypress
 * split. "Disabled wins over error" is a border/background precedence, so
 * its visual half is verified there too; this file covers the behavioural
 * half (the field stays genuinely non-interactive).
 */
describe("Input", () => {
  it("label renders a real <label> correctly associated with the input", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email").tagName).toBe("INPUT");
  });

  it("hideLabel keeps the label as the accessible name but visually hides it", () => {
    render(<Input label="Search" hideLabel />);
    const input = screen.getByLabelText("Search");
    const label = screen.getByText("Search");
    expect(input.tagName).toBe("INPUT");
    expect(label).toHaveClass("sr-only");
  });

  describe("error", () => {
    it("as a string renders the message, sets aria-invalid, and wires aria-describedby to it", () => {
      render(<Input label="Name" error="Required field" />);
      const input = screen.getByRole("textbox");
      const message = screen.getByText("Required field");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input.getAttribute("aria-describedby")).toBe(message.id);
    });

    it("preserves a caller's own aria-describedby alongside the error message id, rather than overwriting it", () => {
      render(<Input label="Name" error="Required" aria-describedby="external-hint" />);
      const input = screen.getByRole("textbox");
      const message = screen.getByText("Required");
      const describedBy = (input.getAttribute("aria-describedby") ?? "").split(" ");
      expect(describedBy).toContain("external-hint");
      expect(describedBy).toContain(message.id);
    });

    it("as true sets the error state with no message", () => {
      const { container } = render(<Input label="Name" error />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(container.querySelector("p")).not.toBeInTheDocument();
    });

    it("disabled stays genuinely non-interactive even when error is also set (visual precedence verified in Input.cy.tsx)", () => {
      render(<Input label="Name" error="Required" disabled defaultValue="x" />);
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("clearable", () => {
    it("shows the × only once focused with content, clears the field, and fires onChange", () => {
      const onChange = jest.fn();
      render(<Input label="Name" clearable defaultValue="hello" onChange={onChange} />);
      const input = screen.getByRole("textbox");

      expect(screen.queryByRole("button", { name: "Clear Name" })).not.toBeInTheDocument();

      fireEvent.focus(input);
      const clearButton = screen.getByRole("button", { name: "Clear Name" });
      expect(clearButton).toBeVisible();

      fireEvent.click(clearButton);
      expect(input).toHaveValue("");
      expect(onChange).toHaveBeenCalled();
    });

    it("does not show the × when focused but empty", () => {
      render(<Input label="Name" clearable />);
      fireEvent.focus(screen.getByRole("textbox"));
      expect(screen.queryByRole("button", { name: "Clear Name" })).not.toBeInTheDocument();
    });
  });

  describe("number steppers", () => {
    it("fire onChange on click and are excluded from the tab order", () => {
      const onChange = jest.fn();
      const { container } = render(<Input label="Amount" type="number" defaultValue={1} onChange={onChange} />);
      const [upButton, downButton] = container.querySelectorAll("button");

      expect(upButton).toHaveAttribute("tabIndex", "-1");
      expect(downButton).toHaveAttribute("tabIndex", "-1");

      fireEvent.click(upButton);
      expect(screen.getByRole("spinbutton")).toHaveValue(2);
      expect(onChange).toHaveBeenCalledTimes(1);

      fireEvent.click(downButton);
      expect(screen.getByRole("spinbutton")).toHaveValue(1);
      expect(onChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("controlled vs uncontrolled hasValue", () => {
    it("uncontrolled: defaultValue and subsequent typing drive whether the clear button shows", () => {
      render(<Input label="Name" clearable defaultValue="" />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      expect(screen.queryByRole("button", { name: "Clear Name" })).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: "hi" } });
      expect(screen.getByRole("button", { name: "Clear Name" })).toBeInTheDocument();
    });

    it("controlled: the value prop alone drives it, independent of internal state", () => {
      const { rerender } = render(<Input label="Name" clearable value="x" onChange={() => {}} />);
      fireEvent.focus(screen.getByRole("textbox"));
      expect(screen.getByRole("button", { name: "Clear Name" })).toBeInTheDocument();

      rerender(<Input label="Name" clearable value="" onChange={() => {}} />);
      expect(screen.queryByRole("button", { name: "Clear Name" })).not.toBeInTheDocument();
    });
  });

  describe("anatomy slots", () => {
    it("renders prefix, suffix, startIcon, and endIcon", () => {
      render(
        <Input
          label="Amount"
          prefix="¥"
          suffix="CNY"
          startIcon={<svg data-testid="start-icon" />}
          endIcon={<svg data-testid="end-icon" />}
        />,
      );
      expect(screen.getByText("¥")).toBeInTheDocument();
      expect(screen.getByText("CNY")).toBeInTheDocument();
      expect(screen.getByTestId("start-icon")).toBeInTheDocument();
      expect(screen.getByTestId("end-icon")).toBeInTheDocument();
    });
  });
});
