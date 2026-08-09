import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../utils/cn";

/**
 * design-spec.md §6. Radix supplies focus trap, portal, scroll lock, and
 * ARIA wiring; this file only adds styling plus the layout glue (size,
 * divider) needed to let the 4 Figma variants fall out of composition
 * (design-spec §6 table) instead of a `variant` enum — the consumer picks
 * the footer's Button and, for Warning, supplies the icon in the body.
 */

export type DialogSize = "sm" | "md" | "lg";

const DIALOG_WIDTH_CLASS: Record<DialogSize, string> = {
  lg: "w-dialog-lg",
  md: "w-dialog-md",
  sm: "w-dialog-sm",
};

/**
 * Whether the "with divider" hairlines (design-spec §6) are on, threaded
 * from Content down to Header/Footer without a `divided` prop on each of
 * them — Header/Footer are plain layout primitives otherwise, so this stays
 * a single source of truth set once at Content.
 */
const DialogStyleContext = createContext(false);

export const DialogRoot = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export type DialogProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
export type DialogTriggerProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;

export interface DialogContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize;
  /** Renders the "with divider" variant's hairlines between header/body/footer — design-spec §6. */
  divided?: boolean;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, size = "md", divided = false, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Fixed widths per size (design-spec §3), but a 900px Large would
          // overflow every phone and Figma specifies no responsive
          // behaviour — granted exception (Step 4, Task 5): clamp to the
          // viewport with a 16px gutter on each side rather than inventing
          // per-breakpoint widths the spec doesn't have.
          "fixed top-1/2 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-control bg-surface p-dialog-padding shadow-dialog outline-none",
          DIALOG_WIDTH_CLASS[size],
          className,
        )}
        {...props}
      >
        <DialogStyleContext.Provider value={divided}>{children}</DialogStyleContext.Provider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
DialogContent.displayName = "DialogContent";

export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(({ className, ...props }, ref) => {
  const divided = useContext(DialogStyleContext);
  return (
    <div
      ref={ref}
      className={cn(
        // Verified against the raw Figma nodes (Content frame itemSpacing):
        // 16px title-to-body gap, 8px title-to-close gap — both hold at
        // every size, not a judgment call.
        "flex items-start justify-between gap-dialog-title-close-gap pb-dialog-header-gap",
        // The With-divider variant's line spans the card's full width, not
        // just this padded content area (verified: the divider node's own
        // width equals the Modal's, not Content's) — -mx-[…]/px-dialog-padding
        // cancel and reapply Content's own padding so the border sits flush
        // with the card edge while the title/close stay inset the same as
        // always. The negative margin uses the arbitrary-value form rather
        // than a plain utility because Tailwind doesn't auto-generate a
        // negative variant for a named (non-numeric) spacing key.
        divided && "-mx-[var(--spacing-dialog-padding)] border-b border-border-divider px-dialog-padding",
        className,
      )}
      {...props}
    />
  );
});
DialogHeader.displayName = "DialogHeader";

export const DialogTitle = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn("text-title font-medium text-fg-heading", className)} {...props} />
  ),
);
DialogTitle.displayName = "DialogTitle";

export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Applies `overflow-y-auto` for the "Scrollable" variant (design-spec
   * §6). No height is applied here — the spec's own 400px sample for that
   * variant is explicitly content-driven, not a token (§3), so cap height
   * via `className` (e.g. `max-h-[60vh]`) for whatever content it holds.
   */
  scrollable?: boolean;
}

export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, scrollable = false, ...props }, ref) => (
    // asChild onto a <div>, not Radix's default <p> — Body needs to hold
    // arbitrary block content (the Warning icon, a scrollable list), which
    // a <p> can't legally contain. asChild keeps Radix's aria-describedby
    // wiring on Content while letting us pick the tag.
    <DialogPrimitive.Description asChild>
      <div
        ref={ref}
        className={cn("text-control-md text-fg", scrollable && "overflow-y-auto", className)}
        {...props}
      />
    </DialogPrimitive.Description>
  ),
);
DialogBody.displayName = "DialogBody";

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(({ className, ...props }, ref) => {
  const divided = useContext(DialogStyleContext);
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-end gap-dialog-footer-gap",
        // 32px content-to-footer gap (design-spec §3) — but verified against
        // the raw Figma nodes, that's only true without a divider line; the
        // With-divider variant's own gap either side of its lines is 16px,
        // not 32 (the line itself already provides visual separation). Same
        // -mx-[…]/px-dialog-padding full-bleed trick as DialogHeader.
        divided
          ? "-mx-[var(--spacing-dialog-padding)] border-t border-border-divider px-dialog-padding pt-dialog-divided-footer-gap"
          : "pt-dialog-content-footer-gap",
        className,
      )}
      {...props}
    />
  );
});
DialogFooter.displayName = "DialogFooter";

export type DialogCloseProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, children, "aria-label": ariaLabel, ...props }, ref) => (
    <DialogPrimitive.Close
      ref={ref}
      // Only the icon-only default gets Dialog's own styling + fallback
      // aria-label. When `children` is supplied (asChild-wrapping a Button
      // for Cancel/Confirm/etc.), pass className/aria-label through
      // untouched — Radix's Slot merges them onto that Button, and forcing
      // our classes or "Close" as the name would fight the Button's own
      // variant styling and hide its visible label from screen readers.
      aria-label={children ? ariaLabel : (ariaLabel ?? "Close")}
      className={
        children
          ? className
          : cn(
              "shrink-0 cursor-pointer text-fg-muted outline-none transition-colors hover:text-fg focus-visible:[outline:var(--focus-ring-width)_solid_var(--focus-ring-color)] focus-visible:outline-offset-[var(--focus-ring-offset)]",
              className,
            )
      }
      {...props}
    >
      {children ?? (
        // design-spec §6: Figma's close icon is a single-fill "Union"
        // vector with no stroke — a bold filled × (two crossing bars
        // merged into one shape), not a thin stroked line ×. Verified: 14×14
        // at every dialog size (unlike Input's icons, this one doesn't scale).
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M6.4 19 5 17.6 10.6 12 5 6.4 6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4Z" />
        </svg>
      )}
    </DialogPrimitive.Close>
  ),
);
DialogClose.displayName = "DialogClose";

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: DialogClose,
};
