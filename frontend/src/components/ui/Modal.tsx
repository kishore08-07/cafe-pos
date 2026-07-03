import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-border p-6"
        style={{ borderRadius: '12px', background: 'var(--surface)' }}
      >
        <div className="flex items-start justify-between mb-4">
          {title && (
            <h3 className="font-display font-light italic text-2xl leading-none text-text">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-text-faint hover:text-gold transition-colors p-1 -mt-1 -mr-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mb-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
