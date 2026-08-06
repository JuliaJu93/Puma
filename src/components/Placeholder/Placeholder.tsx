export interface PlaceholderProps {
  label: string;
}

export function Placeholder({ label }: PlaceholderProps) {
  return <div className="text-blue-500">{label}</div>;
}
