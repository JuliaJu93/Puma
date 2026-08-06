import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Placeholder } from "./Placeholder";

describe("Placeholder", () => {
  it("renders the label", () => {
    render(<Placeholder label="hello" />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Placeholder label="hello" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
