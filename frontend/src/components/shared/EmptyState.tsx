import { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="text-text-faint mb-4 opacity-60">{icon}</div>
      )}
      <h3 className="font-display font-light italic text-2xl text-text mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[17px] font-light text-text-muted max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-5 h-5 border border-text-faint border-t-gold animate-spin" />
      {label && (
        <span className="text-[15px] tracking-[0.2em] uppercase font-light text-text-muted">
          {label}
        </span>
      )}
    </div>
  );
}
