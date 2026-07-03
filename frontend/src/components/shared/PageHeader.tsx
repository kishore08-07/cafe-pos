import { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  accentWord,
  actions,
}: {
  title: string;
  subtitle?: string;
  accentWord?: string;
  actions?: ReactNode;
}) {
  const parts = accentWord
    ? title.split(accentWord)
    : [title];
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 pb-4 border-b border-border">
      <div>
        <h1 className="font-display font-light text-[clamp(28px,5vw,44px)] leading-none text-text">
          {accentWord ? (
            <>
              {parts[0]}
              <span className="text-gold">{accentWord}</span>
              {parts[1] ?? ''}
            </>
          ) : (
            title
          )}
        </h1>
        {subtitle && (
          <p className="mt-2 text-[15px] tracking-[0.22em] uppercase font-extralight text-text-muted">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
