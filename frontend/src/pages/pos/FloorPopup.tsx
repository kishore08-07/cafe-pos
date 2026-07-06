import { useState } from 'react';
import { X } from 'lucide-react';
import { useCatalogStore } from '../../store/catalogStore';
import { useCartStore } from '../../store/cartStore';
import { SectionLabel } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/authStore';

export function FloorPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { floors, tables, orders, claimTable, releaseTable, refreshTables } = useCatalogStore();
  const { setTable, loadOrder, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const [activeFloor, setActiveFloor] = useState(floors[0]?.id ?? '');

  if (!open) return null;

  const floorTables = tables.filter((t) => t.floorId === activeFloor);

  const select = async (id: string, label: string) => {
    const table = tables.find((item) => item.id === id);
    if (!table || table.status === 'reserved') return;
    if (table.occupiedById && table.occupiedById !== user?.id) {
      toast.error(`Table ${label} is being served by ${table.occupiedByName ?? 'another cashier'}.`);
      return;
    }
    const existingDraft = orders.find(
      (order) =>
        order.status === 'draft' &&
        order.tableId === id &&
        order.employeeId === user?.id
    );
    if (table.status === 'occupied' && !existingDraft) {
      toast.info(`Table ${label} is still in service. Mark it free before starting another order.`);
      return;
    }
    try {
      await claimTable(id);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to claim table.');
      await refreshTables();
      return;
    }
    setTable(id, label);
    if (existingDraft) {
      const cartItems = existingDraft.items.map((i) => ({
        id: i.productId ?? '',
        name: i.name,
        price: i.price,
        qty: i.qty,
        taxRate: i.taxRate ?? 0,
      }));
      loadOrder(
        cartItems,
        id,
        label,
        existingDraft.customer && existingDraft.customerId
          ? { id: existingDraft.customerId, name: existingDraft.customer }
          : null,
        existingDraft.id,
        existingDraft.orderNum
      );
      toast.info(`Resumed draft ${existingDraft.orderNum} for Table ${label}.`);
    } else {
      clearCart();
    }
    onClose();
  };

  const markFree = async (id: string, label: string) => {
    try {
      await releaseTable(id);
      toast.success(`Table ${label} is now available.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to free table.');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border p-6" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-light italic text-[28px] leading-none text-text">Select a <span className="text-gold">table</span></h3>
            <p className="mt-2 text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted">Floor plan</p>
          </div>
          <button onClick={onClose} className="text-text-faint hover:text-gold p-2 min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {floors.map((f) => (
            <button key={f.id} onClick={() => setActiveFloor(f.id)} className={`px-4 py-2 text-[15px] tracking-[0.18em] uppercase font-light whitespace-nowrap min-h-[40px] ${activeFloor === f.id ? 'text-gold border border-[rgba(0,117,74,0.4)] bg-[rgba(0,117,74,0.05)]' : 'text-text-muted border border-border'}`}>
              {f.name}
            </button>
          ))}
        </div>
        <SectionLabel>{floorTables.length} tables</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {floorTables.map((t) => {
            const occupied = t.status === 'occupied';
            const reserved = t.status === 'reserved';
            const ownedByCurrentUser = t.occupiedById === user?.id;
            const occupiedByOther = Boolean(t.occupiedById && !ownedByCurrentUser);
            const hasDraft = orders.some(
              (order) =>
                order.status === 'draft' &&
                order.tableId === t.id &&
                order.employeeId === user?.id
            );
            return (
              <div
                key={t.id}
                className="aspect-[4/3] flex flex-col items-center justify-center border p-4 transition-colors"
                style={{
                  background: occupied ? 'rgba(0,117,74,0.06)' : 'var(--surface-raised)',
                  borderColor: occupied ? 'rgba(0,117,74,0.35)' : 'var(--border)',
                }}
              >
                <button
                  onClick={() => void select(t.id, t.label)}
                  disabled={reserved || occupiedByOther}
                  className="flex w-full flex-1 flex-col items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="font-display text-[28px] text-text leading-none">{t.label}</span>
                  <span className="mt-2 text-[14px] tracking-[0.18em] uppercase font-extralight text-text-faint">{t.seats} seats</span>
                  {occupied && <span className="mt-2 w-1.5 h-1.5 bg-gold" />}
                  {hasDraft && <span className="mt-1 text-[12px] tracking-[0.12em] uppercase text-gold">Your draft</span>}
                  {occupiedByOther && (
                    <span className="mt-1 text-[12px] tracking-[0.12em] uppercase text-text-faint">
                      {t.occupiedByName}
                    </span>
                  )}
                  {reserved && <span className="mt-2 text-[14px] tracking-[0.18em] uppercase text-cancel">Reserved</span>}
                </button>
                {ownedByCurrentUser && !hasDraft && (
                  <button
                    onClick={() => void markFree(t.id, t.label)}
                    className="mt-2 border border-[rgba(0,117,74,0.4)] px-3 py-1.5 text-[13px] uppercase tracking-[0.12em] text-gold"
                  >
                    Mark free
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
