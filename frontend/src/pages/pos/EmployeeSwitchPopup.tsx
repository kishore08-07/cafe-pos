import { X, ArrowRight } from 'lucide-react';
import { useCatalogStore } from '../../store/catalogStore';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

export function EmployeeSwitchPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { employees } = useCatalogStore();
  const { clearSession, user } = useAuthStore();
  const navigate = useNavigate();

  if (!open) return null;

  const activeEmps = employees.filter((e) => e.active && !e.archived);

  const switchTo = (emp: typeof activeEmps[0]) => {
    if (user?.id === emp.id) return onClose();
    clearSession();
    toast.info(`Sign in as ${emp.name} to switch cashier.`);
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md border border-border" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-display font-light italic text-[24px] text-text leading-none">
              Switch <span className="text-gold">cashier</span>
            </h3>
            <p className="mt-1 text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted">
              Select active employee
            </p>
          </div>
          <button onClick={onClose} className="text-text-faint hover:text-gold p-2 min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {activeEmps.map((emp) => (
            <button
              key={emp.id}
              onClick={() => switchTo(emp)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-border hover:bg-[rgba(0,117,74,0.04)] transition-colors text-left"
            >
              <div>
                <div className="text-[18px] font-light text-text">{emp.name}</div>
                <div className="mt-1">
                  <Badge variant={emp.role === 'ADMIN' ? 'gold' : 'card-pay'}>{emp.role === 'ADMIN' ? 'User' : 'Employee'}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user?.id === emp.id && (
                  <span className="text-[13px] tracking-[0.18em] uppercase text-gold font-light">Current</span>
                )}
                <ArrowRight size={16} className="text-text-faint" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
