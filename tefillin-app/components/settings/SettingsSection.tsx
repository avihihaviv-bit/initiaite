import { Card } from "@/components/ui/Card";

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-bold text-sm text-[var(--color-text-muted)] px-1 mb-2">{title}</h2>
      <Card className="divide-y divide-[var(--color-border)] overflow-hidden">{children}</Card>
    </div>
  );
}

export function SettingsRow({
  label,
  sublabel,
  control,
}: {
  label: React.ReactNode;
  sublabel?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {sublabel && (
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{sublabel}</div>
        )}
      </div>
      {control}
    </div>
  );
}
