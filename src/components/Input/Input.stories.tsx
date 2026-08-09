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

interface InputPlaygroundProps extends Omit<InputProps, "error" | "startIcon" | "endIcon"> {
  /** Validation group */
  showError: boolean;
  errorMessage: string;
  /** Accessibility group */
  rtl: boolean;
  /** Ungrouped */
  leftIcon: boolean;
  rightIcon: boolean;
}

// Arabic for "label" / "placeholder text" / "This field is required" —
// swapped in under rtl so the check exercises real bidi text (mirrored
// glyphs, connected script) rather than just flipping direction on the same
// English words. Same idea as Button.stories.tsx's ARABIC_LABEL. Every
// visible string in the field needs to swap under rtl, not just the label —
// the error message and the clear button's aria-label (derived from label
// below) are both rendered text a real RTL consumer would translate too.
const ARABIC_LABEL = "التسمية";
const ARABIC_PLACEHOLDER = "نص مؤقت";
const ARABIC_ERROR_MESSAGE = "هذا الحقل مطلوب";

function InputPlayground({ showError, errorMessage, rtl, leftIcon, rightIcon, label, placeholder, ...props }: InputPlaygroundProps) {
  return (
    <div dir={rtl ? "rtl" : "ltr"}>
      <Input
        {...props}
        label={rtl ? ARABIC_LABEL : label}
        placeholder={rtl ? ARABIC_PLACEHOLDER : placeholder}
        error={showError ? (rtl ? ARABIC_ERROR_MESSAGE : errorMessage) || true : false}
        startIcon={leftIcon ? SearchIcon : undefined}
        endIcon={rightIcon ? MailIcon : undefined}
      />
    </div>
  );
}

const meta: Meta<typeof InputPlayground> = {
  title: "Input",
  component: InputPlayground,
  args: {
    label: "Label",
    // Matches Input's own default (design-spec §5 / §7.5 — Figma has no
    // visible label on any variant). `label` is still required (it's the
    // field's real accessible name either way) — toggle hideLabel off to
    // see it rendered.
    hideLabel: true,
    placeholder: "Placeholder",
    size: "md",
    clearable: true,
    disabled: false,
    showError: false,
    errorMessage: "This field is required",
    type: "text",
    autoComplete: "off",
    dataTestId: "input-field",
    leftIcon: false,
    rightIcon: false,
    rtl: false,
  },
  argTypes: {
    // Content — what's inside the field, not how it looks
    label: {
      control: "text",
      description: "Renders a real <label> wired to the field via a generated id — required",
      table: { category: "Content" },
    },
    hideLabel: {
      control: "boolean",
      description: "Visually hides the label (sr-only) while keeping it as the field's accessible name",
      table: { category: "Content", defaultValue: { summary: "true" } },
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
    // Properties — native <input> attributes
    type: {
      control: "select",
      options: ["text", "number", "email", "tel"],
      description: "Native input type",
      table: { category: "Properties", defaultValue: { summary: "text" } },
    },
    minLength: {
      control: "number",
      description: "Native minlength attribute",
      table: { category: "Properties" },
    },
    maxLength: {
      control: "number",
      description: "Native maxlength attribute",
      table: { category: "Properties" },
    },
    // Ungrouped
    autoComplete: {
      control: "text",
      description: "Native autocomplete attribute",
    },
    dataTestId: {
      control: "text",
      description: "Sets data-testid on the rendered <input>, for test selectors",
    },
    prefix: {
      control: "text",
      description: "Static text before the value, e.g. a currency symbol",
    },
    suffix: {
      control: "text",
      description: "Static text after the value, e.g. a unit",
    },
    leftIcon: {
      control: "boolean",
      description: "Shows a leading icon in the field — design-spec §5 \"Left icon\" anatomy",
    },
    rightIcon: {
      control: "boolean",
      description: "Shows a trailing icon in the field — design-spec §5 \"Right icon\" anatomy",
    },
    // Accessibility
    rtl: {
      control: "boolean",
      description: "Sets the field to display in RTL mode",
      table: { category: "Accessibility", defaultValue: { summary: "false" } },
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
                <Input size={size} placeholder="Placeholder" label={`${size} default`} hideLabel />
              </td>
              <td style={cellStyle}>
                <Input
                  size={size}
                  defaultValue="Invalid value"
                  error="This field is required"
                  label={`${size} error`}
                  hideLabel
                />
              </td>
              <td style={cellStyle}>
                <Input size={size} defaultValue="Can't edit" disabled label={`${size} disabled`} hideLabel />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* hideLabel={false}: the label here doubles as this catalog's own
            caption for each row (Input itself hides it by default, since
            Figma has no visible-label anatomy — see design-spec §5/§7.5). */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}>
          <Input label="Left icon" startIcon={SearchIcon} placeholder="Search" hideLabel={false} />
          <Input label="Right icon" endIcon={MailIcon} placeholder="you@example.com" hideLabel={false} />
          <Input label="Prefix & suffix" prefix="¥" suffix="CNY" defaultValue="100" hideLabel={false} />
          <Input label="Input number" type="number" defaultValue={1} hideLabel={false} />
          <Input label="Clearable" clearable defaultValue="Clear me" hideLabel={false} />
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
