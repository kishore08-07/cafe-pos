import { useNavigate } from 'react-router-dom';
import { MoreVertical, Settings, Monitor } from 'lucide-react';
import { useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui';
import { toast } from '../../components/ui/Toast';

export function SessionLanding() {
  const navigate = useNavigate();
  const { isOpen, openedAt, openSession } = useSessionStore();
  const { orders } = useCatalogStore();
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const lastPaid = orders.find((o) => o.status === 'paid');
  const lastOpenDate = openedAt ? new Date(openedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No session yet';
  const lastSell = lastPaid ? `₹${lastPaid.total.toLocaleString('en-IN')}` : '₹0';

  const handleOpen = async () => {
    try {
      if (!isOpen) await openSession();
      toast.success('Session opened.');
      navigate('/pos');
    } catch {
      toast.error('Unable to open the POS session.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <header className="border-b border-border px-6 h-16 flex items-center justify-between">
        <div className="font-display font-light italic text-[22px] leading-none text-text">
          Café <span className="text-gold">Étoile</span>
        </div>
        <span className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted">
          {user?.name}
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-border p-8" style={{ background: 'var(--surface)' }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-2">
                Point of Sale
              </div>
              <div className="font-display font-light italic text-[28px] text-text leading-none">
                Café <span className="text-gold">Étoile</span>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Options"
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 border border-border py-1 z-10" style={{ background: 'var(--surface)' }}>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/admin/dashboard'); }}
                    className="w-full text-left px-4 py-3 text-[15px] font-light text-text hover:bg-[rgba(0,117,74,0.04)] flex items-center gap-3"
                  >
                    <Settings size={14} /> Setting
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/customer-display'); }}
                    className="w-full text-left px-4 py-3 text-[15px] font-light text-text hover:bg-[rgba(0,117,74,0.04)] flex items-center gap-3"
                  >
                    <Monitor size={14} /> Customer Display
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-border mb-6">
            <div className="p-4" style={{ background: 'var(--surface)' }}>
              <div className="text-[13px] tracking-[0.2em] uppercase font-extralight text-text-faint mb-1">
                Last open date
              </div>
              <div className="text-[16px] font-light text-text">{lastOpenDate}</div>
            </div>
            <div className="p-4" style={{ background: 'var(--surface)' }}>
              <div className="text-[13px] tracking-[0.2em] uppercase font-extralight text-text-faint mb-1">
                Last Sell amount
              </div>
              <div className="font-display text-[20px] text-gold">{lastSell}</div>
            </div>
          </div>

          <Button fullWidth size="lg" onClick={handleOpen}>
            Open Session
          </Button>
        </div>
      </main>
    </div>
  );
}
