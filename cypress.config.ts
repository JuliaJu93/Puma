import { defineConfig } from "cypress";

export default defineConfig({
  // Migrated off Cypress.env() already, so opt into the future default now
  // rather than get the deprecation warning on every run.
  allowCypressEnv: false,
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
