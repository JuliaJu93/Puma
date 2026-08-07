import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Dialog, type DialogSize } from "./Dialog";

/**
 * Storybook-only icon (design-spec §6: the Warning variant's icon is
 * consumer-supplied — Dialog itself never renders it, same "cosmetic slot"
 * rationale as Button's startIcon/endIcon). Uses --color-warning, the one
 * semantic alias that exists purely for this single-use primitive.
 */
const WarningIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-warning">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

type DialogVariant = "basic" | "warning" | "scrollable";

interface DialogPlaygroundProps {
  /** Content group */
  title: string;
  /** Styling group */
  size: DialogSize;
  variant: DialogVariant;
  divided: boolean;
}

function DialogPlayground({ title, size, variant, divided }: DialogPlaygroundProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Open dialog</Button>
      </Dialog.Trigger>
      <Dialog.Content size={size} divided={divided}>
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        <Dialog.Body
          scrollable={variant === "scrollable"}
          className={variant === "scrollable" ? "flex max-h-64 flex-col gap-3" : variant === "warning" ? "flex items-start gap-2" : undefined}
        >
          {variant === "warning" && WarningIcon}
          {variant === "scrollable" ? (
            Array.from({ length: 10 }, (_, i) => <p key={i}>Section {i + 1}. Scroll to read the rest of this content.</p>)
          ) : (
            <span>This action cannot be undone. This will permanently affect your data.</span>
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="ghost">Cancel</Button>
          </Dialog.Close>
          {variant === "warning" ? (
            <Button variant="outline" intent="danger">
              Delete
            </Button>
          ) : (
            <Button>Confirm</Button>
          )}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}

const meta: Meta<typeof DialogPlayground> = {
  title: "Dialog",
  component: DialogPlayground,
  args: {
    title: "Delete project",
    size: "md",
    variant: "basic",
    divided: false,
  },
  argTypes: {
    title: {
      control: "text",
      description: "Sets the text label of the component",
      table: { category: "Content" },
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Sets a predetermined size of the component",
      table: { category: "Styling", defaultValue: { summary: "md" } },
    },
    variant: {
      control: "radio",
      options: ["basic", "warning", "scrollable"],
      description: "Which design-spec §6 layout variant this demonstrates — falls out of composition, not a component prop",
      table: { category: "Styling", defaultValue: { summary: "basic" } },
    },
    divided: {
      control: "boolean",
      description: "Renders the \"with divider\" hairlines between header/body/footer",
      table: { category: "Styling", defaultValue: { summary: "false" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Main: Story = {};

function DialogVariations() {
  return (
    <div style={{ display: "flex", gap: 12, fontFamily: "sans-serif" }}>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button variant="outline">Basic</Button>
        </Dialog.Trigger>
        <Dialog.Content size="md">
          <Dialog.Header>
            <Dialog.Title>Delete project</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body>
            This action cannot be undone. This will permanently delete the project and remove your data from our
            servers.
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button>Confirm</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button variant="outline">Warning</Button>
        </Dialog.Trigger>
        <Dialog.Content size="md">
          <Dialog.Header>
            <Dialog.Title>Delete file</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body className="flex items-start gap-2">
            {WarningIcon}
            <span>Deleting this file removes it everywhere, including shared folders. This can&apos;t be undone.</span>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button variant="outline" intent="danger">
              Delete
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button variant="outline">Scrollable</Button>
        </Dialog.Trigger>
        <Dialog.Content size="md">
          <Dialog.Header>
            <Dialog.Title>Terms of service</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body scrollable className="flex max-h-64 flex-col gap-3">
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i}>Section {i + 1}. Scroll to read the rest of this content.</p>
            ))}
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="ghost">Disagree</Button>
            </Dialog.Close>
            <Button>Agree</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button variant="outline">With divider</Button>
        </Dialog.Trigger>
        <Dialog.Content size="md" divided>
          <Dialog.Header>
            <Dialog.Title>Save changes</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body>Your changes will be saved and applied immediately.</Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button>Save</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}

export const Variations: Story = {
  render: () => <DialogVariations />,
  // Each dialog is its own trigger + modal, not a static grid of states —
  // controls/actions/etc. would apply to none of them, same reasoning as
  // Button/Input's Variations stories.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    interactions: { disable: true },
    a11y: { disable: true },
  },
};
