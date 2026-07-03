import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-[40px] text-[15px] px-5 py-2',
  md: 'min-h-[48px] text-[16px] px-7 py-3',
  lg: 'min-h-[52px] text-[17px] px-9 py-4',
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gold text-white border border-gold font-semibold hover:bg-gold-deep',
  ghost:
    'bg-transparent text-gold font-semibold border border-gold hover:bg-[rgba(0,117,74,0.08)]',
  danger:
    'bg-cancel text-white border border-cancel font-semibold hover:opacity-90',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', fullWidth, className = '', ...rest },
    ref
  ) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-full disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${
        fullWidth ? 'w-full block' : ''
      } ${className}`}
      {...rest}
    />
  )
);
Button.displayName = 'Button';
