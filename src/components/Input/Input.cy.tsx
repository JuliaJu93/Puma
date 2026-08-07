import { Input } from "./Input";

/**
 * jsdom (Jest) can't compute CSS — see Button.cy.tsx's header comment for the
 * full rationale (real pseudo-classes, transition-timing fix, mouse-position
 * reset) shared by every spec in this file.
 */
describe("Input", () => {
  beforeEach(() => {
    cy.get("body").realHover({ position: "bottomRight" });
  });

  describe("mounting & rendering", () => {
    it("mounts and renders a real text input", () => {
      cy.mount(<Input aria-label="Name" placeholder="Jane Doe" />);
      cy.get("input").should("be.visible").and("have.attr", "placeholder", "Jane Doe");
    });

    it("renders a real label wired to the field", () => {
      cy.mount(<Input label="Email" />);
      cy.get("label").should("contain.text", "Email");
      cy.get("input")
        .invoke("attr", "id")
        .then((id) => {
          cy.get("label").should("have.attr", "for", id);
        });
    });
  });

  describe("interactions", () => {
    it("fires onChange while typing", () => {
      const onChange = cy.stub().as("onChange");
      cy.mount(<Input aria-label="Name" onChange={onChange} />);
      cy.get("input").type("hi");
      cy.get("@onChange").should("have.callCount", 2);
      cy.get("input").should("have.value", "hi");
    });

    it("clear button empties the field and fires onChange", () => {
      const onChange = cy.stub().as("onChange");
      cy.mount(<Input aria-label="Name" clearable defaultValue="hello" onChange={onChange} />);
      cy.get("input").realClick(); // focus, so the clear button becomes visible
      cy.get("button[aria-label='Clear input']").should("be.visible").realClick();
      cy.get("input").should("have.value", "");
      cy.get("@onChange").should("have.been.called");
    });

    it("number steppers increment/decrement and fire onChange", () => {
      const onChange = cy.stub().as("onChange");
      cy.mount(<Input aria-label="Amount" type="number" defaultValue={1} onChange={onChange} />);
      cy.get("input").parent().find("button").first().realClick();
      cy.get("input").should("have.value", "2");
      cy.get("@onChange").should("have.been.called");
    });
  });

  describe("focus ring — has-[input:focus-visible] on the wrapper", () => {
    it("shows a ring around the wrapper on real keyboard focus", () => {
      cy.mount(<Input aria-label="Name" />);
      cy.realPress("Tab");
      cy.get("input")
        .parent()
        .should("have.css", "outline-style", "solid")
        .and("have.css", "outline-color", "rgb(21, 197, 206)"); // --focus-ring-color, brand-500 #15c5ce
    });

    it("also shows the ring on a real mouse click, unlike Button", () => {
      // Verified against real Chromium: text-entry widgets (input/textarea)
      // are exempt from the "no ring on mouse focus" heuristic that
      // Button.cy.tsx relies on — a focused text field always gets a
      // visible :focus-visible ring regardless of input modality, since the
      // blinking caret alone isn't a reliable enough affordance. Not a
      // component bug, so asserted as the real, deliberate difference it is.
      cy.mount(<Input aria-label="Name" />);
      cy.get("input").realClick();
      cy.get("input").parent().should("have.css", "outline-style", "solid");
    });
  });

  describe("computed values vs design-spec.md §5", () => {
    it("default: white background, neutral border", () => {
      cy.mount(<Input aria-label="Name" />);
      cy.get("input")
        .parent()
        .should("have.css", "background-color", "rgb(255, 255, 255)")
        .and("have.css", "border-color", "rgb(225, 225, 225)"); // #e1e1e1
    });

    it("error: danger border, text still readable", () => {
      cy.mount(<Input aria-label="Name" error="Required" defaultValue="x" />);
      cy.get("input")
        .parent()
        .should("have.css", "border-color", "rgb(246, 76, 76)") // #f64c4c
        .and("have.css", "background-color", "rgb(255, 255, 255)");
      cy.contains("Required").should("have.css", "color", "rgb(246, 76, 76)");
    });

    it("disabled: muted background, muted border, muted text — and wins over error", () => {
      cy.mount(<Input aria-label="Name" error="Required" disabled defaultValue="x" />);
      cy.get("input")
        .parent()
        .should("have.css", "background-color", "rgb(250, 250, 250)") // #fafafa
        .and("have.css", "border-color", "rgb(238, 238, 238)") // #eeeeee, not the error red
        .and("have.css", "color", "rgb(225, 225, 225)"); // #e1e1e1, --color-input-fg-disabled
    });
  });

  describe("heights by size — design-spec §3", () => {
    it("sm is 24px, md is 36px, lg is 40px", () => {
      cy.mount(
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 200 }}>
          <Input aria-label="Small" size="sm" />
          <Input aria-label="Medium" size="md" />
          <Input aria-label="Large" size="lg" />
        </div>,
      );
      cy.get("input[aria-label=Small]").parent().should("have.css", "height", "24px");
      cy.get("input[aria-label=Medium]").parent().should("have.css", "height", "36px");
      cy.get("input[aria-label=Large]").parent().should("have.css", "height", "40px");
    });
  });
});
