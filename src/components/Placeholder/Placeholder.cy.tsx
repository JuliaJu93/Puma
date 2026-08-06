import { Placeholder } from "./Placeholder";

describe("Placeholder", () => {
  it("mounts and shows the label", () => {
    cy.mount(<Placeholder label="hello" />);
    cy.contains("hello").should("be.visible");
  });

  it("applies the Tailwind class", () => {
    cy.mount(<Placeholder label="hello" />);
    cy.get(".text-blue-500")
      .should("have.css", "color")
      .and("not.equal", "rgb(0, 0, 0)");
  });
});
