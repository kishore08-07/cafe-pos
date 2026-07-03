import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-surface border-l border-border flex flex-col"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          {title && (
            <h3 className="font-display font-light italic text-2xl leading-none text-text">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-text-faint hover:text-gold transition-colors p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 p-5 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
