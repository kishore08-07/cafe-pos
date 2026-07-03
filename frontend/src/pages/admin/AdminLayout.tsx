import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Printer, RefreshCw, User } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { MobileNavSheet } from '../../components/shared/MobileNavSheet';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../components/ui/Toast';

const navItems = [
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Category' },
  { to: '/admin/payment', label: 'Payment method' },
  { to: '/admin/coupons', label: 'Coupon & Promotion' },
  { to: '/admin/tables', label: 'Booking' },
  { to: '/admin/employees', label: 'User/Employee' },
  { to: '/kds', label: 'KDS' },
  { to: '/admin/reports', label: 'Reports' },
];

const mobileNavItems = [
  ...navItems,
  { to: '/login', label: 'Log-Out' },
];

export function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();

  const handleLogout = () => {
    clearSession();
    toast.info('Signed out.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <header className="print-hide border-b border-border sticky top-0 z-50" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="font-display font-light italic text-[22px] leading-none text-text">
              Café <span className="text-gold">Étoile</span>
            </div>
            <span className="hidden sm:inline text-[14px] tracking-[0.28em] uppercase font-extralight text-text-faint border-l border-border pl-3">
              Admin
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-[13px] tracking-[0.14em] uppercase font-light transition-colors whitespace-nowrap ${
                    isActive ? 'text-gold' : 'text-text-muted hover:text-text'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] items-center justify-center"
              aria-label="Print current page"
              title="Print current page"
            >
              <Printer size={16} />
            </button>
            <button onClick={() => toast.info('Synced.')} className="hidden sm:flex p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] items-center justify-center" aria-label="Sync">
              <RefreshCw size={16} />
            </button>
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-3 ml-2 pl-3 border-l border-border">
              <button className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="User">
                <User size={16} />
              </button>
              <div className="text-right">
                <div className="text-[16px] font-light text-text leading-tight">{user?.name}</div>
                <div className="text-[14px] tracking-[0.2em] uppercase text-text-faint">{user?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-text-muted hover:text-cancel transition-colors p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
            <button
              onClick={() => setNavOpen(true)}
              className="lg:hidden text-text-muted hover:text-gold p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <MobileNavSheet open={navOpen} onClose={() => setNavOpen(false)} items={mobileNavItems} />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-[1400px] w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
