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
      cy.mount(<Input label="Name" placeholder="Jane Doe" />);
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
      cy.mount(<Input label="Name" onChange={onChange} />);
      cy.get("input").type("hi");
      cy.get("@onChange").should("have.callCount", 2);
      cy.get("input").should("have.value", "hi");
    });

    it("clear button empties the field and fires onChange", () => {
      const onChange = cy.stub().as("onChange");
      cy.mount(<Input label="Name" clearable defaultValue="hello" onChange={onChange} />);
      cy.get("input").realClick(); // focus, so the clear button becomes visible
      cy.get("button[aria-label='Clear Name']").should("be.visible").realClick();
      cy.get("input").should("have.value", "");
      cy.get("@onChange").should("have.been.called");
    });

    it("number steppers increment/decrement and fire onChange", () => {
      const onChange = cy.stub().as("onChange");
      cy.mount(<Input label="Amount" type="number" defaultValue={1} onChange={onChange} />);
      cy.get("input").parent().find("button").first().realClick();
      cy.get("input").should("have.value", "2");
      cy.get("@onChange").should("have.been.called");
    });
  });

  describe("focus ring — has-[input:focus-visible] on the wrapper", () => {
    it("shows a ring around the wrapper on real keyboard focus", () => {
      cy.mount(<Input label="Name" />);
      cy.realPress("Tab");
      // input -> core row (icons/input/clear/stepper) -> the actual bordered
      // field wrapper. Prefix/Suffix need their own background reaching the
      // wrapper's full height (see Input.tsx's CORE_SIZE_CLASS comment), so
      // the border/bg/ring now live two levels up, not one.
      cy.get("input")
        .parent()
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
      cy.mount(<Input label="Name" />);
      cy.get("input").realClick();
      cy.get("input").parent().parent().should("have.css", "outline-style", "solid");
    });
  });

  describe("computed values vs design-spec.md §5", () => {
    it("default: white background, neutral border", () => {
      cy.mount(<Input label="Name" />);
      cy.get("input")
        .parent()
        .parent()
        .should("have.css", "background-color", "rgb(255, 255, 255)")
        .and("have.css", "border-color", "rgb(225, 225, 225)"); // #e1e1e1
    });

    it("error: danger border, text still readable", () => {
      cy.mount(<Input label="Name" error="Required" defaultValue="x" />);
      cy.get("input")
        .parent()
        .parent()
        .should("have.css", "border-color", "rgb(246, 76, 76)") // #f64c4c
        .and("have.css", "background-color", "rgb(255, 255, 255)");
      cy.contains("Required").should("have.css", "color", "rgb(246, 76, 76)");
    });

    it("disabled: muted background, muted border, muted text — and wins over error", () => {
      cy.mount(<Input label="Name" error="Required" disabled defaultValue="x" />);
      cy.get("input")
        .parent()
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
          <Input label="Small" id="small" size="sm" />
          <Input label="Medium" id="medium" size="md" />
          <Input label="Large" id="large" size="lg" />
        </div>,
      );
      // .parent().parent(): the actual h-control-* wrapper, two levels up
      // from input (see the focus-ring describe block above) — checking
      // just .parent() (the core row) happens to read the same height here
      // only because its padding + line-height are tuned to sum to it, not
      // because it's the element the height token is actually set on.
      cy.get("#small").parent().parent().should("have.css", "height", "24px");
      cy.get("#medium").parent().parent().should("have.css", "height", "36px");
      cy.get("#large").parent().parent().should("have.css", "height", "40px");
    });
  });
});
