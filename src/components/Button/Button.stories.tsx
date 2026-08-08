import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, type ButtonIntent, type ButtonProps, type ButtonVariant } from "./Button";

/**
 * Storybook-only icons (Button ships icon-agnostic per design-spec §4 —
 * "cosmetic only, no color/geometry change" — so these live here, not in
 * the component). Plain inline SVGs rather than a new icon-package
 * dependency; stroke="currentColor" so each inherits the button's own
 * text color for free across every variant/intent/state.
 */
const ICONS = {
  plus: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
} satisfies Record<string, ReactNode>;

type IconName = keyof typeof ICONS;

type ButtonMode = "text" | "icon";

interface ButtonPlaygroundProps
  extends Omit<ButtonProps, "startIcon" | "endIcon" | "children" | "asChild"> {
  /** Content group */
  label: string;
  link: boolean;
  /** Styling group */
  icon: IconName;
  iconEnd: boolean;
  mode: ButtonMode;
  round: boolean;
  /** Accessibility group */
  rtl: boolean;
}

// Arabic for "button" — swapped in for `label` under rtl so the RTL check
// exercises real bidi text (mirrored glyphs, connected script) rather than
// just flipping direction on the same English word.
const ARABIC_LABEL = "زر";

function ButtonPlayground({ label, icon, iconEnd, link, mode, round, rtl, ...props }: ButtonPlaygroundProps) {
  const iconNode = ICONS[icon];
  const isIconOnly = mode === "icon";
  const displayLabel = rtl ? ARABIC_LABEL : label;

  // asChild (link mode) clones the child as-is and only merges className —
  // see Button.tsx — so an icon-only link needs its own aria-label rather
  // than relying on Button to forward one.
  const linkChild = (
    <a
      href="/"
      aria-label={isIconOnly ? displayLabel : undefined}
      onClick={(e) => {
        e.preventDefault();
        alert("Navigate to /");
      }}
    >
      {isIconOnly ? iconNode : displayLabel}
    </a>
  );

  return (
    <div dir={rtl ? "rtl" : "ltr"}>
      <Button
        {...props}
        asChild={link}
        aria-label={!link && isIconOnly ? displayLabel : undefined}
        className={round ? "rounded-pill" : undefined}
        startIcon={!link && (isIconOnly || !iconEnd) ? iconNode : undefined}
        endIcon={!link && !isIconOnly && iconEnd ? iconNode : undefined}
      >
        {link ? linkChild : isIconOnly ? undefined : displayLabel}
      </Button>
    </div>
  );
}

const meta: Meta<typeof ButtonPlayground> = {
  title: "Button",
  component: ButtonPlayground,
  args: {
    label: "Button",
    link: false,
    variant: "primary",
    intent: "default",
    size: "md",
    disabled: false,
    icon: "plus",
    iconEnd: false,
    mode: "text",
    round: false,
    rtl: false,
  },
  argTypes: {
    // Content — what's inside the button, not how it looks
    label: {
      control: "text",
      description: "Sets the text label of the component",
      table: { category: "Content" },
    },
    link: {
      control: "boolean",
      description: "Renders via the asChild escape hatch as a real <a> instead of a <button> — see Button.tsx.",
      table: { category: "Content", defaultValue: { summary: "false" } },
    },
    // Styling
    variant: {
      control: "radio",
      options: ["primary", "outline", "ghost", "link"],
      description: "Sets a predetermined styling of the button",
      table: { category: "Styling", defaultValue: { summary: "primary" } },
    },
    intent: {
      control: "radio",
      options: ["default", "danger"],
      description: "Sets the button's intent — default or danger",
      table: { category: "Styling", defaultValue: { summary: "default" } },
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Sets a predetermined size of the component",
      table: { category: "Styling", defaultValue: { summary: "md" } },
    },
    icon: {
      control: "select",
      options: Object.keys(ICONS) as IconName[],
      description: "Option to select an icon to be displayed in the component",
      table: { category: "Styling" },
    },
    iconEnd: {
      control: "boolean",
      description: "Render the icon after the text label",
      table: { category: "Styling", defaultValue: { summary: "false" } },
    },
    mode: {
      control: "radio",
      options: ["text", "icon"],
      description: "Sets the button mode",
      table: { category: "Styling", defaultValue: { summary: "text" } },
    },
    round: {
      control: "boolean",
      description: "Set rounded corners",
      table: { category: "Styling", defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Sets the component to look disabled",
      table: { category: "Styling", defaultValue: { summary: "false" } },
    },
    // Accessibility
    rtl: {
      control: "boolean",
      description: "Sets the parent container to display children in RTL mode",
      table: { category: "Accessibility", defaultValue: { summary: "false" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Main: Story = {};

const VARIANTS: ButtonVariant[] = ["primary", "outline", "ghost", "link"];
const INTENTS: ButtonIntent[] = ["default", "danger"];
const SIZES = ["sm", "md", "lg"] as const;

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

function ButtonVariations() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 60, fontFamily: "sans-serif" }}>
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={headerCellStyle} />
            {INTENTS.map((intent) => (
              <th key={intent} style={headerCellStyle}>
                {intent}
              </th>
            ))}
            {INTENTS.map((intent) => (
              <th key={`${intent}-disabled`} style={headerCellStyle}>
                {intent} (disabled)
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map((variant) => {
            // Link is plain text sized to its own content (design-spec §4 "Min-width
            // and Link's box"), so its row is intrinsically narrower than Primary/
            // Outline/Ghost's padded, min-width boxes. Reserving the same footprint
            // as the other rows (98px text button + 8px gap + 36px icon-only, at the
            // default md size) keeps every row's buttons starting at the same column
            // position instead of the row collapsing to Link's own narrow width.
            const rowStyle: CSSProperties = { display: "flex", gap: 8, minWidth: 142 };
            const onLinkClick =
              variant === "link"
                ? (e: MouseEvent) => {
                    e.preventDefault();
                    alert("Navigate to /");
                  }
                : undefined;
            return (
              <tr key={variant}>
                <td style={{ ...headerCellStyle, padding: "12px 20px 12px 0" }}>{variant}</td>
                {INTENTS.map((intent) => (
                  <td key={`${variant}-${intent}`} style={cellStyle}>
                    <div style={rowStyle}>
                      <Button variant={variant} intent={intent} startIcon={ICONS.plus} onClick={onLinkClick}>
                        Button
                      </Button>
                      <Button
                        variant={variant}
                        intent={intent}
                        startIcon={ICONS.plus}
                        aria-label="Button"
                        onClick={onLinkClick}
                      />
                    </div>
                  </td>
                ))}
                {INTENTS.map((intent) => (
                  <td key={`${variant}-${intent}-disabled`} style={cellStyle}>
                    <div style={rowStyle}>
                      <Button variant={variant} intent={intent} disabled startIcon={ICONS.plus}>
                        Button
                      </Button>
                      <Button
                        variant={variant}
                        intent={intent}
                        disabled
                        startIcon={ICONS.plus}
                        aria-label="Button"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, width: 100 }}>Sizes (text)</span>
          {SIZES.map((size) => (
            <Button key={size} size={size}>
              {size}
            </Button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, width: 100 }}>Sizes (icon)</span>
          {SIZES.map((size) => (
            <Button key={size} size={size} startIcon={ICONS.plus} aria-label={size} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Variations: Story = {
  render: () => <ButtonVariations />,
  // This story ignores args entirely (static render of every combination),
  // so the addons panel would otherwise show controls/actions/etc. that do
  // nothing here — disable them rather than leave dead UI.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    interactions: { disable: true },
    a11y: { disable: true },
  },
};
