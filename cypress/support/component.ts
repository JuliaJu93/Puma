import { mount } from "cypress/react";
import "../../src/styles/index.css";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required by Cypress's own augmentation pattern
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add("mount", mount);
