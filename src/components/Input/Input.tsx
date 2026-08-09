import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";

/**
 * design-spec.md §5. One Input with composable slots rather than seven
 * components — the 7 Figma anatomy variants (Basic, Left/Right icon, Number,
 * Prefix & Suffix, Prefix, Suffix) only change what sits inside the field;
 * the state machine (color/border/bg by error+disabled) is identical across
 * all of them. Color lives in compoundVariants keyed on error+disabled,
 * mirroring Button's variant+intent split.
 */
const inputWrapperVariants = cva(
  // Ring is applied to the wrapper via has-[input:focus-visible] rather than
  // a plain focus-visible: on this element, because the focusable node is
  // the nested <input>, not the wrapper itself — the ring still needs to
  // outline the whole field (icons/prefix included), not just the input.
  // Explicit transition properties, not the transition-colors utility — see
  // Button.tsx for the outline-color/Chromium transition bug this avoids.
  // No padding or gap here — Prefix/Suffix (design-spec §5) need to sit
  // flush against this border with their own background reaching full
  // height, so padding/gap live on the inner "core" row instead (see
  // CORE_SIZE_CLASS below). Without an affix, core is this wrapper's only
  // child, so visually nothing changes from before.
  "inline-flex w-full items-center rounded-control border bg-surface outline-none transition-[color,background-color,border-color] duration-150 has-[input:focus-visible]:[outline:var(--focus-ring-width)_solid_var(--focus-ring-color)] has-[input:focus-visible]:outline-offset-[var(--focus-ring-offset)]",
  {
    variants: {
      size: {
        sm: "h-control-sm text-control-sm",
        md: "h-control-md text-control-md",
        lg: "h-control-lg text-control-lg",
      } satisfies Record<InputSize, string>,
      error: { true: "", false: "" },
      disabled: { true: "", false: "" },
    },
    compoundVariants: [
      {
        error: false,
        disabled: false,
        // hover:focus-within: is not redundant with focus-within: alone.
        // Tailwind batches all hover: utilities into one @media(hover:hover)
        // block emitted after plain pseudo-class rules like :focus-within,
        // so with equal specificity (one class + one pseudo each), clicking
        // into the field — simultaneously :hover AND :focus-within, which
        // is every mouse click — let hover's later rule win, showing
        // accent-hover instead of the spec's "Pressed & Focus" border
        // (design-spec §5). The 3-part selector's higher specificity
        // forces focus to win whenever both apply, regardless of
        // stylesheet order.
        class:
          "border-border text-fg hover:border-accent-hover focus-within:border-border-focus hover:focus-within:border-border-focus",
      },
      { error: true, disabled: false, class: "border-border-error text-fg" },
      // Disabled wins over error — the spec has no combined disabled+error
      // row, and a disabled field isn't actionable so an error border on it
      // would be misleading. Matches `error`'s absence from this selector:
      // it fires for disabled=true regardless of error, so exactly one of
      // these three entries ever matches (no merge-order reliance needed).
      {
        disabled: true,
        class: "cursor-not-allowed border-border-disabled bg-surface-disabled text-input-fg-disabled",
      },
    ],
    defaultVariants: { size: "md", error: false, disabled: false },
  },
);

/**
 * Written out by hand rather than derived from
 * `VariantProps<typeof inputWrapperVariants>`.
 *
 * Deriving it put `class-variance-authority/types` into the emitted `.d.ts`.
 * That subpath only resolves under `moduleResolution: "bundler"` / `"node16"`;
 * under classic `"node"` the import failed, `VariantProps` collapsed to `any`,
 * and `Pick<any, "size">` turned `size` into a **required** prop — consumers
 * saw "Property 'size' is missing in type '{ label: string }'" with no hint
 * that the real cause was an unresolvable third-party type.
 *
 * Keeping the public surface free of third-party types avoids that entirely.
 * The `satisfies Record<InputSize, string>` on the cva `size` variants above
 * fails the build if this union and the cva config ever drift apart.
 */
export type InputSize = "sm" | "md" | "lg";

// Scales with Size (18/16/14) — verified against the raw Figma nodes for
// Left icon at all three sizes, the same ramp as Button's (design-spec §4),
// correcting an earlier pass here that only sampled Large and assumed it
// stayed fixed. Reuses Button's own size-icon-lg/md/sm classes since it's
// the identical ramp, not a coincidence worth a second token set.
const ICON_CLASS = "inline-flex shrink-0 text-fg-muted [&>svg]:size-full";
const ICON_SIZE_CLASS: Record<InputSize, string> = {
  sm: "size-icon-sm",
  md: "size-icon-md",
  lg: "size-icon-lg",
};

// The clear (×) button's icon is its own, smaller ramp — 16/14/12, one step
// below ICON_SIZE_CLASS at every size — verified against the raw Figma
// nodes for the reused "Error" icon instance (11:8007/11:8011/11:8015).
const CLEAR_ICON_SIZE_CLASS: Record<InputSize, string> = {
  sm: "size-clear-icon-sm",
  md: "size-clear-icon-md",
  lg: "size-clear-icon-lg",
};

// Padding/gap moved off the wrapper (see inputWrapperVariants above) onto
// this inner row, which holds everything except Prefix/Suffix: icons, the
// <input> itself, the clear button, and the number stepper. gap is the
// internal spacing between those children (icon↔text, text↔clear) —
// verified as its own 8/8/4 ramp against the raw Figma nodes, distinct from
// the 12/12/8 outer padding ramp (both real, independently sampled values,
// not derived from one another). Uses the fixed-px gap-input-gap-* utilities
// (see --spacing-input-gap-* in index.css) rather than Tailwind's default
// gap-1/gap-2 — those are rem-relative, and this value is a literal Figma px.
const CORE_SIZE_CLASS: Record<InputSize, string> = {
  sm: "gap-input-gap-sm px-2 py-control-py-sm",
  md: "gap-input-gap-md px-3 py-control-py-md",
  lg: "gap-input-gap-lg px-3 py-2",
};

// Horizontal-only — the affix segment has no vertical padding of its own
// (its background stretches to the wrapper's full height via self-stretch
// instead). Reuses the same horizontal scale as CORE_SIZE_CLASS rather than
// the slightly asymmetric 11px/12px Figma samples (§5, standalone Prefix/
// Suffix nodes) — those differ from the field's own padding by exactly the
// 1px border inset, the same reasoning as --radius-control-inset, but
// that's a sub-pixel nicety not worth a second padding scale for.
const AFFIX_SIZE_CLASS: Record<InputSize, string> = {
  sm: "px-2",
  md: "px-3",
  lg: "px-3",
};

// design-spec §5 (standalone Prefix/Suffix, verified against raw Figma
// nodes 11:10955/11:11534 — see --color-input-affix-bg in index.css).
// self-stretch makes the background reach the wrapper's full height
// (matching the existing number-stepper column's use of the same trick)
// regardless of the wrapper's own items-center.
const AFFIX_CLASS = "flex shrink-0 items-center self-stretch bg-input-affix-bg text-fg-muted";

/**
 * `.stepUp()`/`.stepDown()` and the clear button both mutate `input.value`
 * through the DOM's own setter, which bypasses the setter React installs on
 * controlled inputs to track changes — so React never sees it. Dispatching a
 * real "input" event afterward is what makes React's onChange fire anyway;
 * the optional `value` re-applies it through that same native setter first,
 * for callers (clear) that need to force a specific value rather than rely
 * on the browser having already set one (stepUp/stepDown).
 */
function fireNativeChange(input: HTMLInputElement, value?: string) {
  if (value !== undefined) {
    const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setValue?.call(input, value);
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 10 6" width="10" height="6" fill="none" aria-hidden="true">
      <path
        d={direction === "up" ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  /** Control height: 24 / 36 / 40px. Optional — defaults to `"md"`. */
  size?: InputSize;
  /**
   * Renders a real `<label>` wired to the field via a generated id. Always
   * visually hidden (`sr-only`) — Figma's Input has no visible-label
   * anatomy in any variant, so there's no designed look for one to fall
   * back to. Still required: a real, always-present `<label>` is a
   * stronger accessible name than `aria-label` (click-to-focus, rich
   * content, better AT support), and a required prop catches a missing
   * name at compile time instead of a console warning someone has to notice.
   */
  label: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** Static text before the value, e.g. a currency symbol — design-spec §5. */
  prefix?: ReactNode;
  /** Static text after the value, e.g. a unit — design-spec §5. */
  suffix?: ReactNode;
  /** `true` shows only the error border; a string also renders that message below the field. */
  error?: boolean | string;
  /** Shows an inline clear (×) button while focused with content — design-spec §5. */
  clearable?: boolean;
  /**
   * Sets `data-testid` on the rendered `<input>`. A plain `data-testid`
   * prop doesn't type-check through a custom component (only intrinsic
   * elements get that leniency), so this is the typed escape hatch for
   * test selectors.
   */
  dataTestId?: string;
  /**
   * Applies to the visible field box (border/bg), not the outer
   * label+field+error wrapper and not the bare `<input>` — the closest
   * equivalent here to Button's single rendered element.
   */
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      label,
      startIcon,
      endIcon,
      prefix,
      suffix,
      error,
      clearable = false,
      dataTestId,
      disabled,
      id,
      onFocus,
      onBlur,
      onChange,
      defaultValue,
      value,
      type,
      "aria-describedby": ariaDescribedBy,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    forwardedRef,
  ) => {
    const innerRef = useRef<HTMLInputElement | null>(null);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorMessageId = `${inputId}-error`;
    const clearMaskId = `${inputId}-clear-mask`;

    const [isFocused, setIsFocused] = useState(false);
    // Only tracks the uncontrolled case. When `value` is provided, "has
    // content" is derived straight from it during render instead of synced
    // via an effect — an effect that mirrors a prop into state one render
    // later is the exact cascading-render pattern React's own lint rule
    // (and the docs) warn against, and it's unnecessary here: the value is
    // already available synchronously.
    const [uncontrolledHasValue, setUncontrolledHasValue] = useState(() => String(defaultValue ?? "").length > 0);
    const hasValue = value !== undefined ? String(value).length > 0 : uncontrolledHasValue;

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) (forwardedRef as MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [forwardedRef],
    );

    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;
    const describedBy =
      [ariaDescribedBy, errorMessage ? errorMessageId : undefined].filter(Boolean).join(" ") || undefined;

    const isNumber = type === "number";
    const showClear = clearable && !disabled && isFocused && hasValue;

    function handleStep(direction: 1 | -1) {
      const input = innerRef.current;
      if (!input) return;
      if (direction === 1) input.stepUp();
      else input.stepDown();
      fireNativeChange(input);
      input.focus();
    }

    function handleClear() {
      const input = innerRef.current;
      if (!input) return;
      // No manual setUncontrolledHasValue(false) needed — fireNativeChange
      // dispatches a real "input" event, which the onChange handler below
      // is already listening for and updates state from.
      fireNativeChange(input, "");
      input.focus();
    }

    return (
      <div className="flex flex-col items-start gap-input-stack-gap">
        {/* design-spec §5 / §7.5: no label exists in any Figma variant, so
            there's no designed visible treatment to fall back to — always
            sr-only. Still a real <label for>, not aria-label, so it stays
            the strongest accessible-name mechanism available (see InputProps). */}
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <div
          className={cn(inputWrapperVariants({ size, error: hasError, disabled: Boolean(disabled) }), className)}
        >
          {prefix && (
            // rounded-s (logical "start"), not rounded-l — physical left
            // doesn't flip under dir="rtl", and prefix needs to round
            // whichever edge is actually outermost once the row mirrors.
            <span className={cn(AFFIX_CLASS, AFFIX_SIZE_CLASS[size ?? "md"], "rounded-s-[var(--radius-control-inset)]")}>
              {prefix}
            </span>
          )}
          <div className={cn("flex min-w-0 flex-1 items-center", CORE_SIZE_CLASS[size ?? "md"])}>
            {startIcon && (
              <span className={cn(ICON_CLASS, ICON_SIZE_CLASS[size ?? "md"])} aria-hidden="true">
                {startIcon}
              </span>
            )}
            <input
              {...props}
              ref={setRefs}
              id={inputId}
              type={type}
              data-testid={dataTestId}
              disabled={disabled}
              value={value}
              defaultValue={defaultValue}
              aria-invalid={hasError || undefined}
              aria-describedby={describedBy}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              onFocus={(event) => {
                setIsFocused(true);
                onFocus?.(event);
              }}
              onBlur={(event) => {
                setIsFocused(false);
                onBlur?.(event);
              }}
              onChange={(event) => {
                setUncontrolledHasValue(event.target.value.length > 0);
                onChange?.(event);
              }}
              className={cn(
                "w-full min-w-0 border-0 bg-transparent p-0 text-inherit outline-none placeholder:text-fg-subtle",
                "[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                disabled && "placeholder:text-input-fg-disabled",
              )}
            />
            {showClear && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleClear}
                aria-label={`Clear ${label}`}
                className="shrink-0 cursor-pointer text-fg-subtle outline-none transition-colors hover:text-fg-muted active:text-fg"
              >
                {/* design-spec §5: Figma's icon is an instance of a shared
                    "Error" icon component (Theme=Fill) reused as the clear
                    glyph — a single-fill "Subtract" vector, i.e. a solid
                    filled circle with the × cut out of it, not a bare
                    stroked ×. A <mask> reproduces that as a true hole
                    rather than painting over it, so it stays correct
                    regardless of what's behind it. */}
                <svg
                  viewBox="0 0 16 16"
                  className={CLEAR_ICON_SIZE_CLASS[size ?? "md"]}
                  aria-hidden="true"
                >
                  <mask id={clearMaskId}>
                    <rect width="16" height="16" fill="white" />
                    <path
                      d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </mask>
                  <circle cx="8" cy="8" r="7.33" fill="currentColor" mask={`url(#${clearMaskId})`} />
                </svg>
              </button>
            )}
            {isNumber && !disabled && (
              // Native spinners are hidden above; design-spec §5 anatomy
              // calls for a custom stepper column instead. Not in the tab
              // order — the native input's own ArrowUp/ArrowDown already
              // provide full keyboard access, so these are mouse-only
              // shortcuts, the same relationship a native OS spinner has to
              // typing digits directly.
              <div className="flex shrink-0 flex-col justify-center gap-0.5 self-stretch text-fg-muted">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => handleStep(1)}
                  className="cursor-pointer hover:text-fg"
                >
                  <ChevronIcon direction="up" />
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => handleStep(-1)}
                  className="cursor-pointer hover:text-fg"
                >
                  <ChevronIcon direction="down" />
                </button>
              </div>
            )}
            {endIcon && (
              <span className={cn(ICON_CLASS, ICON_SIZE_CLASS[size ?? "md"])} aria-hidden="true">
                {endIcon}
              </span>
            )}
          </div>
          {suffix && (
            // rounded-e (logical "end") — same reasoning as prefix's rounded-s above.
            <span className={cn(AFFIX_CLASS, AFFIX_SIZE_CLASS[size ?? "md"], "rounded-e-[var(--radius-control-inset)]")}>
              {suffix}
            </span>
          )}
        </div>
        {errorMessage && (
          // design-spec §5: the error message is always 14px/22
          // (text-control-md), regardless of the Input's own `size` — a
          // verified finding in the spec, not a simplification.
          <p id={errorMessageId} className="text-control-md text-danger">
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
