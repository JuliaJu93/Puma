import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input, type InputProps, type InputSize } from "./Input";

/**
 * Storybook-only icons (Input ships icon-agnostic, same rationale as
 * Button.stories.tsx — cosmetic slots, not part of the component). Plain
 * inline SVGs, stroke="currentColor" so each inherits --color-fg-muted for
 * free via Input's own ICON_CLASS.
 */
const SearchIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MailIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

type Anatomy = "basic" | "startIcon" | "endIcon" | "prefixSuffix" | "number";

interface InputPlaygroundProps
  extends Omit<InputProps, "startIcon" | "endIcon" | "prefix" | "suffix" | "type" | "error"> {
  /** Styling group */
  anatomy: Anatomy;
  /** Validation group */
  showError: boolean;
  errorMessage: string;
}

function InputPlayground({ anatomy, showError, errorMessage, ...props }: InputPlaygroundProps) {
  return (
    <Input
      {...props}
      error={showError ? errorMessage || true : false}
      startIcon={anatomy === "startIcon" ? SearchIcon : undefined}
      endIcon={anatomy === "endIcon" ? MailIcon : undefined}
      prefix={anatomy === "prefixSuffix" ? "¥" : undefined}
      suffix={anatomy === "prefixSuffix" ? "CNY" : undefined}
      type={anatomy === "number" ? "number" : "text"}
    />
  );
}

const meta: Meta<typeof InputPlayground> = {
  title: "Input",
  component: InputPlayground,
  args: {
    label: "Label",
    placeholder: "Placeholder",
    size: "md",
    anatomy: "basic",
    clearable: true,
    disabled: false,
    showError: false,
    errorMessage: "This field is required",
  },
  argTypes: {
    // Content — what's inside the field, not how it looks
    label: {
      control: "text",
      description: "Renders a real <label> wired to the field via a generated id",
      table: { category: "Content" },
    },
    placeholder: {
      control: "text",
      description: "Placeholder text shown while the field is empty",
      table: { category: "Content" },
    },
    // Styling
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Sets a predetermined size of the component",
      table: { category: "Styling", defaultValue: { summary: "md" } },
    },
    anatomy: {
      control: "select",
      options: ["basic", "startIcon", "endIcon", "prefixSuffix", "number"],
      description: "Which composable slot is populated — design-spec §5's 7 anatomy variants collapse to one component plus slots",
      table: { category: "Styling", defaultValue: { summary: "basic" } },
    },
    clearable: {
      control: "boolean",
      description: "Shows an inline × button while focused with content",
      table: { category: "Styling", defaultValue: { summary: "true" } },
    },
    disabled: {
      control: "boolean",
      description: "Sets the component to look disabled",
      table: { category: "Styling", defaultValue: { summary: "false" } },
    },
    // Validation
    showError: {
      control: "boolean",
      description: "Toggles the error border and, when errorMessage is set, the message below the field",
      table: { category: "Validation", defaultValue: { summary: "false" } },
    },
    errorMessage: {
      control: "text",
      description: "Message rendered below the field when showError is on",
      table: { category: "Validation" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Main: Story = {};

const SIZES: InputSize[] = ["sm", "md", "lg"];

const headerCellStyle: CSSProperties = {
  textAlign: "left",
  padding: "8px 16px 8px 0",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "capitalize",
};

const cellStyle: CSSProperties = {
  padding: "8px 16px 8px 0",
  verticalAlign: "middle",
};

function InputVariations() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, fontFamily: "sans-serif" }}>
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={headerCellStyle} />
            <th style={headerCellStyle}>Default</th>
            <th style={headerCellStyle}>Error</th>
            <th style={headerCellStyle}>Disabled</th>
          </tr>
        </thead>
        <tbody>
          {SIZES.map((size) => (
            <tr key={size}>
              <td style={headerCellStyle}>{size}</td>
              <td style={cellStyle}>
                <Input size={size} placeholder="Placeholder" aria-label={`${size} default`} />
              </td>
              <td style={cellStyle}>
                <Input
                  size={size}
                  defaultValue="Invalid value"
                  error="This field is required"
                  aria-label={`${size} error`}
                />
              </td>
              <td style={cellStyle}>
                <Input size={size} defaultValue="Can't edit" disabled aria-label={`${size} disabled`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Anatomy (Medium)</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}>
          <Input label="Left icon" startIcon={SearchIcon} placeholder="Search" />
          <Input label="Right icon" endIcon={MailIcon} placeholder="you@example.com" />
          <Input label="Prefix & suffix" prefix="¥" suffix="CNY" defaultValue="100" />
          <Input label="Number stepper" type="number" defaultValue={1} />
          <Input label="Clearable (focus the field to see the × button)" clearable defaultValue="Clear me" />
        </div>
      </div>
    </div>
  );
}

export const Variations: Story = {
  render: () => <InputVariations />,
  // Static render of every combination — same reasoning as
  // Button.stories.tsx's Variations: the controls/actions/etc. panels would
  // otherwise show dead UI for a story that ignores args entirely.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    interactions: { disable: true },
    a11y: { disable: true },
  },
};
