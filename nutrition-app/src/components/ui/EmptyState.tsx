import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl2 bg-white/60 px-6 py-12 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-muted">{icon}</div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
