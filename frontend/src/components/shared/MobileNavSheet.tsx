import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
}

export function MobileNavSheet({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] md:hidden">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <nav
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-surface border-l border-border flex flex-col"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <span className="text-[14px] tracking-[0.28em] uppercase font-extralight text-text-muted">
            Navigation
          </span>
          <button
            onClick={onClose}
            className="text-text-faint hover:text-gold p-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `block px-5 py-4 text-[16px] tracking-[0.18em] uppercase font-light border-b border-border transition-colors ${
                  isActive
                    ? 'text-gold bg-[rgba(0,117,74,0.06)]'
                    : 'text-text-muted hover:text-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
