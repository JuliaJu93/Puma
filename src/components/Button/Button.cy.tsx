import { Button } from "./Button";

/**
 * jsdom (Jest) can't compute CSS — no Tailwind, no :hover/:active/:focus-visible,
 * no real layout. This file covers exactly what Jest can't: computed colors
 * against design-spec.md §4, real pseudo-class states, and real heights.
 * Behavioural/DOM assertions (onClick args, asChild, disabled wiring, aria)
 * live in Button.test.tsx instead — see STEP-5-TESTS.md's Jest/Cypress split.
 *
 * `.realHover()` / `.realMouseDown()` / `.realClick()` come from
 * cypress-real-events: plain `cy.trigger("mouseover"/"mousedown")` dispatches
 * synthetic DOM events that Chromium's hit-testing never sees, so :hover and
 * :active never actually match — verified empirically against this project's
 * Cypress+Chrome setup before writing these tests. cypress-real-events drives
 * the browser over CDP instead, which does.
 */
describe("Button", () => {
  // The real cursor position from one test's realHover/realClick genuinely
  // persists into the next — Cypress component tests remount the React tree
  // per test but never reload the page/iframe, so a leftover hover from the
  // previous test can make a freshly-mounted button at the same screen
  // position read as :hover before this test ever touches it. Move the
  // pointer somewhere neutral before every test starts.
  beforeEach(() => {
    cy.get("body").realHover({ position: "bottomRight" });
  });

  describe("mounting & rendering", () => {
    it("mounts and renders its children as a real button", () => {
      cy.mount(<Button>Save changes</Button>);
      cy.get("button").should("be.visible").and("contain.text", "Save changes");
    });

    it("defaults to type=\"button\" so it never submits a form", () => {
      cy.mount(<Button>Save</Button>);
      cy.get("button").should("have.attr", "type", "button");
    });

    it("renders the native disabled attribute", () => {
      cy.mount(<Button disabled>Save</Button>);
      cy.get("button").should("be.disabled");
    });
  });

  describe("interactions", () => {
    it("fires onClick on a real click", () => {
      const onClick = cy.stub().as("onClick");
      cy.mount(<Button onClick={onClick}>Save</Button>);
      cy.get("button").realClick();
      cy.get("@onClick").should("have.been.calledOnce");
    });

    it("does not fire onClick when disabled", () => {
      const onClick = cy.stub().as("onClick");
      cy.mount(
        <Button disabled onClick={onClick}>
          Save
        </Button>,
      );
      cy.get("button").realClick();
      cy.get("@onClick").should("not.have.been.called");
    });

    it("shows a visible focus ring on real keyboard (Tab) focus", () => {
      cy.mount(<Button>Save</Button>);
      // A real Tab keydown (not the `.focus()` DOM method) is what actually
      // flips Chromium's keyboard-modality flag — that flag is document-
      // scoped and sticky, so a prior test's real click can leave it "mouse"
      // even for a freshly-mounted button. Driving it with a genuine key
      // press is both more realistic and the only way to reliably assert
      // :focus-visible regardless of what ran before this test.
      cy.realPress("Tab");
      cy.get("button")
        .should("have.css", "outline-style", "solid")
        .and("have.css", "outline-color", "rgb(21, 197, 206)"); // --focus-ring-color = --color-border-focus = brand-500 #15c5ce
    });

    it("does not show a focus ring on a real mouse click", () => {
      cy.mount(<Button>Save</Button>);
      cy.get("button").realClick();
      cy.get("button").should("have.css", "outline-style", "none");
    });
  });

  describe("computed values vs design-spec.md §4", () => {
    it("Primary/default: accent background, white text, no border", () => {
      cy.mount(<Button variant="primary">Save</Button>);
      cy.get("button")
        .should("have.css", "background-color", "rgb(21, 197, 206)") // #15c5ce
        .and("have.css", "color", "rgb(255, 255, 255)")
        .and("have.css", "border-width", "0px");
    });

    it("Primary/danger: danger background, white text", () => {
      cy.mount(
        <Button variant="primary" intent="danger">
          Delete
        </Button>,
      );
      cy.get("button")
        .should("have.css", "background-color", "rgb(246, 76, 76)") // #f64c4c
        .and("have.css", "color", "rgb(255, 255, 255)");
    });

    it("Outline/default: white background, neutral text, neutral border", () => {
      cy.mount(<Button variant="outline">Save</Button>);
      cy.get("button")
        .should("have.css", "background-color", "rgb(255, 255, 255)")
        .and("have.css", "color", "rgb(75, 75, 75)") // #4b4b4b
        .and("have.css", "border-color", "rgb(225, 225, 225)"); // #e1e1e1
    });

    it("Ghost/default: transparent background, neutral text, no border", () => {
      cy.mount(<Button variant="ghost">Save</Button>);
      cy.get("button")
        .should("have.css", "background-color", "rgba(0, 0, 0, 0)")
        .and("have.css", "color", "rgb(75, 75, 75)")
        .and("have.css", "border-width", "0px");
    });

    it("Link/default: accent text, no background, no border", () => {
      cy.mount(<Button variant="link">Save</Button>);
      cy.get("button")
        .should("have.css", "color", "rgb(21, 197, 206)") // #15c5ce
        .and("have.css", "background-color", "rgba(0, 0, 0, 0)")
        .and("have.css", "border-width", "0px");
    });

    describe("disabled states", () => {
      it("Primary/default disabled: pale accent background", () => {
        cy.mount(
          <Button variant="primary" disabled>
            Save
          </Button>,
        );
        cy.get("button").should("have.css", "background-color", "rgb(176, 235, 236)"); // #b0ebec
      });

      it("Outline/default disabled: muted text and border", () => {
        cy.mount(
          <Button variant="outline" disabled>
            Save
          </Button>,
        );
        cy.get("button")
          .should("have.css", "color", "rgb(202, 202, 202)") // #cacaca
          .and("have.css", "border-color", "rgb(238, 238, 238)"); // #eeeeee
      });

      it("Link/default disabled uses its own distinct disabled tint, not the shared muted disabled color", () => {
        cy.mount(
          <Button variant="link" disabled>
            Save
          </Button>,
        );
        // --color-link-fg-disabled (#7ddde1) is a deliberately separate token
        // from --color-fg-disabled (#cacaca) — design-spec §1 / index.css.
        cy.get("button")
          .should("have.css", "color", "rgb(125, 221, 225)") // #7ddde1
          .and("not.have.css", "color", "rgb(202, 202, 202)");
      });
    });

    describe("heights by size — design-spec §3", () => {
      it("sm is 24px, md is 36px, lg is 40px", () => {
        cy.mount(
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>,
        );
        cy.contains("button", "Small").should("have.css", "height", "24px");
        cy.contains("button", "Medium").should("have.css", "height", "36px");
        cy.contains("button", "Large").should("have.css", "height", "40px");
      });
    });
  });

  describe("Ghost/danger: the one deliberate hover/active inconsistency (Decision 3)", () => {
    it("text color stays put on hover, but changes on active — every other colored style tracks hover too", () => {
      cy.mount(
        <Button variant="ghost" intent="danger">
          Delete
        </Button>,
      );
      cy.get("button").should("have.css", "color", "rgb(246, 76, 76)"); // #f64c4c at rest

      cy.get("button")
        .realHover()
        .should("have.css", "background-color", "rgb(254, 242, 242)") // #fef2f2, hover fill
        .and("have.css", "color", "rgb(246, 76, 76)"); // text unchanged on hover

      cy.get("button")
        .realMouseDown()
        .should("have.css", "background-color", "rgb(255, 204, 210)") // #ffccd2, pressed fill
        .and("have.css", "color", "rgb(236, 45, 48)"); // #ec2d30, text DOES change on active
    });
  });
});
