export function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-[14px] tracking-[0.28em] uppercase font-extralight text-text-muted py-2.5 border-b border-border mb-0.5 ${className}`}
    >
      {children}
    </div>
  );
}
