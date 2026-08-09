import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  // `.mdx` is listed first so standalone docs pages (Introduction) sort above
  // the component entries in the sidebar. Without this pattern the glob only
  // matched `*.stories.*` and src/Introduction.mdx was silently never indexed
  // — the file existed and compiled, it just never appeared in Storybook.
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    defaultName: "Playground",
  },
  features: {
    interactions: false,
  },
};

export default config;
