import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
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
  "inline-flex w-full items-center gap-3 rounded-control border bg-surface outline-none transition-[color,background-color,border-color] duration-150 has-[input:focus-visible]:[outline:var(--focus-ring-width)_solid_var(--focus-ring-color)] has-[input:focus-visible]:outline-offset-[var(--focus-ring-offset)]",
  {
    variants: {
      size: {
        sm: "h-control-sm px-2 py-control-py-sm text-control-sm",
        md: "h-control-md px-3 py-control-py-md text-control-md",
        lg: "h-control-lg px-3 py-2 text-control-lg",
      },
      error: { true: "", false: "" },
      disabled: { true: "", false: "" },
    },
    compoundVariants: [
      {
        error: false,
        disabled: false,
        class: "border-border text-fg hover:border-accent-hover focus-within:border-border-focus",
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

export type InputSize = NonNullable<VariantProps<typeof inputWrapperVariants>["size"]>;

// Fixed 18x18 at every size — design-spec §5 samples the icon at Large only
// ("Left icon | ... 18×18 ...") with no Medium/Small value recorded. Unlike
// Button's icon ramp (§4, re-verified across all three sizes), there's
// nothing here to scale, so this stays constant rather than inventing a
// ramp. Reuses Button's --spacing-icon-lg token since it's the same
// verified 18px value.
const ICON_CLASS = "inline-flex shrink-0 size-icon-lg text-fg-muted [&>svg]:size-full";

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
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix">,
    Pick<VariantProps<typeof inputWrapperVariants>, "size"> {
  /** Renders a real `<label>` wired to the field via a generated id. */
  label?: string;
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

    const [isFocused, setIsFocused] = useState(false);
    // Only tracks the uncontrolled case. When `value` is provided, "has
    // content" is derived straight from it during render instead of synced
    // via an effect — an effect that mirrors a prop into state one render
    // later is the exact cascading-render pattern React's own lint rule
    // (and the docs) warn against, and it's unnecessary here: the value is
    // already available synchronously.
    const [uncontrolledHasValue, setUncontrolledHasValue] = useState(() => String(defaultValue ?? "").length > 0);
    const hasValue = value !== undefined ? String(value).length > 0 : uncontrolledHasValue;

    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && !label && !ariaLabel && !ariaLabelledBy) {
        console.error(
          "Input: pass a `label`, `aria-label`, or `aria-labelledby` — a field with no accessible name is invisible to screen reader users.",
        );
      }
      // Dev-only accessibility check, intentionally run once on mount rather
      // than tracked every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
      <div className="flex flex-col items-start gap-1">
        {label && (
          // Label typography/spacing is net-new (design-spec §5 / §7.5 — no
          // label exists in Figma). Reuses existing tokens only: sized down
          // from the field's own text so it reads as a label, not a second
          // copy of the value.
          <label htmlFor={inputId} className="text-control-sm font-normal text-fg">
            {label}
          </label>
        )}
        <div
          className={cn(inputWrapperVariants({ size, error: hasError, disabled: Boolean(disabled) }), className)}
        >
          {prefix && <span className="shrink-0 text-fg-muted">{prefix}</span>}
          {startIcon && (
            <span className={ICON_CLASS} aria-hidden="true">
              {startIcon}
            </span>
          )}
          <input
            {...props}
            ref={setRefs}
            id={inputId}
            type={type}
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
              aria-label={label ? `Clear ${label}` : "Clear input"}
              className="shrink-0 text-fg-subtle outline-none transition-colors hover:text-fg-muted active:text-fg"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {isNumber && !disabled && (
            // Native spinners are hidden above; design-spec §5 anatomy calls
            // for a custom stepper column instead. Not in the tab order —
            // the native input's own ArrowUp/ArrowDown already provide full
            // keyboard access, so these are mouse-only shortcuts, the same
            // relationship a native OS spinner has to typing digits directly.
            <div className="flex shrink-0 flex-col justify-center gap-0.5 self-stretch text-fg-muted">
              <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => handleStep(1)} className="hover:text-fg">
                <ChevronIcon direction="up" />
              </button>
              <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => handleStep(-1)} className="hover:text-fg">
                <ChevronIcon direction="down" />
              </button>
            </div>
          )}
          {endIcon && (
            <span className={ICON_CLASS} aria-hidden="true">
              {endIcon}
            </span>
          )}
          {suffix && <span className="shrink-0 text-fg-muted">{suffix}</span>}
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
