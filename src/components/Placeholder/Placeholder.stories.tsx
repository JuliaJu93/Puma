import type { Meta, StoryObj } from "@storybook/react-vite";
import { Placeholder } from "./Placeholder";

const meta: Meta<typeof Placeholder> = {
  title: "Placeholder",
  component: Placeholder,
  args: {
    label: "Placeholder",
  },
};

export default meta;

type Story = StoryObj<typeof Placeholder>;

export const Default: Story = {};
