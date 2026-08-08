import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

/**
 * design-spec.md §4. Structure (layout, border width, font weight) lives in
 * `variant`; color lives in `compoundVariants` keyed on variant+intent,
 * since "default intent = neutral text at rest, danger intent = colored
 * text at rest" cuts across all four styles (see spec's "Text-color
 * behaviour by intent" finding) rather than varying per style.
 */
const buttonVariants = cva(
  // The focus ring is one arbitrary-property class (not the separate
  // outline / outline-width / outline-color utilities) so tailwind-merge
  // never has two focus-visible: outline-* classes to (mis)dedupe — see
  // src/utils/cn.ts for the same class of bug on text-color vs font-size.
  //
  // Transitions are listed explicitly (color, background-color,
  // border-color) rather than via the `transition-colors` utility, which
  // also includes outline-color: transitioning outline-color at the same
  // moment outline-style flips none -> solid on :focus-visible leaves
  // Chromium's computed outline-color stuck at its pre-focus value
  // (currentColor) instead of the token color — verified by isolating the
  // rule in Storybook. Leaving outline-color out of the transition means
  // the ring appears instantly, which is the standard, expected behaviour
  // for a focus indicator anyway.
  "inline-flex items-center justify-center gap-1 rounded-control font-sans outline-none transition-[color,background-color,border-color] duration-150 cursor-pointer focus-visible:[outline:var(--focus-ring-width)_solid_var(--focus-ring-color)] focus-visible:outline-offset-[var(--focus-ring-offset)] disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "border-0 font-medium text-fg-on-accent",
        outline: "border bg-surface font-normal",
        ghost: "border-0 bg-transparent font-normal",
        link: "border-0 bg-transparent font-normal",
      },
      intent: {
        default: "",
        danger: "",
      },
      size: {
        sm: "h-control-sm min-w-button-sm px-1 py-control-py-sm text-control-sm",
        md: "h-control-md min-w-button-md px-2 py-control-py-md text-control-md",
        lg: "h-control-lg min-w-button-lg px-2 py-2 text-control-lg",
      },
    },
    compoundVariants: [
      {
        // design-spec §4 "Min-width and Link's box": Link has no padding, no
        // fixed height, and no min-width — it's plain text sized to its own
        // content, not a padded control box like the other three styles.
        variant: "link",
        size: ["sm", "md", "lg"],
        class: "h-auto min-w-0 p-0",
      },
      {
        variant: "primary",
        intent: "default",
        class: "bg-accent hover:bg-accent-hover active:bg-accent-pressed disabled:bg-accent-disabled",
      },
      {
        variant: "primary",
        intent: "danger",
        class: "bg-danger hover:bg-danger-hover active:bg-danger-pressed disabled:bg-danger-disabled-fill",
      },
      {
        variant: "outline",
        intent: "default",
        class:
          "text-fg border-border hover:text-accent-hover hover:border-accent-hover active:text-accent-pressed active:border-accent-pressed disabled:text-fg-disabled disabled:border-border-disabled",
      },
      {
        variant: "outline",
        intent: "danger",
        class:
          "text-danger border-danger hover:text-danger-hover hover:border-danger-hover active:text-danger-pressed active:border-danger-pressed disabled:text-danger-disabled-fg disabled:border-danger-disabled-fg",
      },
      {
        variant: "ghost",
        intent: "default",
        class: "text-fg hover:bg-surface-hover active:bg-surface-pressed disabled:text-fg-disabled",
      },
      {
        // design-spec §7.1 / index.css Decision 3: danger Ghost changes text
        // color on Pressed only, not Hover — every other colored style
        // tracks the full ramp. Replicated exactly, not normalized.
        variant: "ghost",
        intent: "danger",
        class:
          "text-danger hover:bg-danger-surface-hover active:bg-danger-surface-pressed active:text-danger-pressed disabled:text-danger-disabled-fg",
      },
      {
        variant: "link",
        intent: "default",
        class: "text-accent hover:text-accent-hover active:text-accent-pressed disabled:text-link-fg-disabled",
      },
      {
        variant: "link",
        intent: "danger",
        class: "text-danger hover:text-danger-hover active:text-danger-pressed disabled:text-danger-disabled-fg",
      },
    ],
    defaultVariants: {
      variant: "primary",
      intent: "default",
      size: "md",
    },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonIntent = NonNullable<VariantProps<typeof buttonVariants>["intent"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

// design-spec §4 "Icon size" — 18/16/14px, scales with Size and is identical
// across styles/intents. Forced via [&>svg]:size-full below rather than left
// to whatever width/height the consumer's SVG happens to declare.
const ICON_SIZE_CLASS: Record<ButtonSize, string> = {
  lg: "size-icon-lg",
  md: "size-icon-md",
  sm: "size-icon-sm",
};

// design-spec §4 "Padding and square dimensions" (IconButton). A Button with
// no visible children — only startIcon/endIcon, e.g. an icon-only close or
// menu trigger — is a different shape than a text button at the same Size:
// square (40/36/24, matching --spacing-control-* exactly) with its own
// 11/10/5px padding and a pill radius, not the text box's height/min-width/
// padding/corner-radius. Applied automatically from content, not a prop:
// this is what an icon-only Button already looks like when built correctly,
// not an opt-in variant.
const ICON_ONLY_CLASS: Record<ButtonSize, string> = {
  lg: "size-control-lg min-w-0 p-iconbutton-p-lg",
  md: "size-control-md min-w-0 p-iconbutton-p-md",
  sm: "size-control-sm min-w-0 p-iconbutton-p-sm",
};

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  /** Cosmetic only (color, choice of icon) — geometry is sized by Button per design-spec §4. */
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /**
   * Renders this button's classes onto its single child instead of a
   * `<button>`. A control that doesn't navigate must stay a `<button>` for
   * keyboard/screen-reader semantics, but `variant="link"` used for real
   * navigation needs an `<a>` — this is that escape hatch. Does not merge
   * refs onto the child; the `ref` passed to `Button` is ignored in this
   * mode, so ref the child element directly if you need one.
   */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, intent, size, startIcon, endIcon, asChild = false, type = "button", children, ...props },
    ref,
  ) => {
    const resolvedSize = size ?? "md";
    const isIconOnly = !children && Boolean(startIcon || endIcon);
    const classes = cn(
      buttonVariants({ variant, intent, size }),
      isIconOnly && ["rounded-pill", ICON_ONLY_CLASS[resolvedSize]],
      className,
    );
    const iconClasses = cn("inline-flex shrink-0 [&>svg]:size-full", ICON_SIZE_CLASS[resolvedSize]);

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;
      return cloneElement(child, {
        className: cn(classes, child.props.className),
      });
    }

    return (
      <button ref={ref} type={type} className={classes} {...props}>
        {startIcon && (
          <span className={iconClasses} aria-hidden="true">
            {startIcon}
          </span>
        )}
        {children}
        {endIcon && (
          <span className={iconClasses} aria-hidden="true">
            {endIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
