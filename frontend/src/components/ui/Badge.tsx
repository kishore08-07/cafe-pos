type BadgeVariant =
  | 'gold'
  | 'paid'
  | 'cancel'
  | 'card-pay'
  | 'stone';

const colorMap: Record<BadgeVariant, string> = {
  gold: '#00754A',
  paid: '#4A7C59',
  cancel: '#8B3A3A',
  'card-pay': '#3A6B8B',
  stone: '#6B6459',
};

export function Badge({
  variant = 'gold',
  color,
  children,
  className = '',
}: {
  variant?: BadgeVariant;
  color?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const badgeColor = color ?? colorMap[variant];
  return (
    <span
      className={`inline-flex items-center font-light text-[14px] tracking-[0.1em] uppercase px-3 py-1 border ${className}`}
      style={{
        color: badgeColor,
        borderColor: badgeColor,
        backgroundColor: 'transparent',
      }}
    >
      {children}
    </span>
  );
}

export function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2"
      style={{ background: color }}
    />
  );
}
