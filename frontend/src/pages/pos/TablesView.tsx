import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Badge, Button } from '../../components/ui';
import { FloorPopup } from './FloorPopup';
import { useCatalogStore } from '../../store/catalogStore';
import { useCartStore } from '../../store/cartStore';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/authStore';

const statusVariant = (s: string) =>
  s === 'occupied' ? 'paid' : s === 'reserved' ? 'cancel' : 'stone';

export function TablesView() {
  const { floors, tables, orders, claimTable, releaseTable, refreshTables, refreshOrders } = useCatalogStore();
  const { setTable, loadOrder, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [floorOpen, setFloorOpen] = useState(false);
  const [activeFloor, setActiveFloor] = useState(floors[0]?.id ?? '');

  const floorTables = tables.filter((t) => t.floorId === activeFloor);

  useEffect(() => {
    const refresh = () => {
      void Promise.all([refreshTables(), refreshOrders()]).catch(() => undefined);
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refreshOrders, refreshTables]);

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
    navigate('/pos');
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
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Floor"
        accentWord="Floor"
        subtitle="Select a table to begin"
        actions={<Button size="md" onClick={() => setFloorOpen(true)}>Open floor map</Button>}
      />
      <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
        {floors.map((f) => (
          <button key={f.id} onClick={() => setActiveFloor(f.id)} className={`px-4 py-2 text-[15px] tracking-[0.18em] uppercase font-light whitespace-nowrap min-h-[40px] ${activeFloor === f.id ? 'text-gold border border-[rgba(0,117,74,0.4)] bg-[rgba(0,117,74,0.05)]' : 'text-text-muted border border-border'}`}>{f.name}</button>
        ))}
      </div>
      <SectionLabel>{floorTables.length} tables</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {floorTables.map((t) => {
          const ownedByCurrentUser = t.occupiedById === user?.id;
          const occupiedByOther = Boolean(t.occupiedById && !ownedByCurrentUser);
          const ownDraft = orders.some(
            (order) => order.status === 'draft' && order.tableId === t.id && order.employeeId === user?.id
          );
          return (
          <div
            key={t.id}
            className="aspect-[4/3] flex flex-col items-center justify-center border p-4 transition-colors"
            style={{
              background: t.status === 'occupied' ? 'rgba(0,117,74,0.06)' : 'var(--surface-raised)',
              borderColor: t.status === 'occupied' ? 'rgba(0,117,74,0.35)' : 'var(--border)',
            }}
          >
            <button
              onClick={() => void select(t.id, t.label)}
              disabled={t.status === 'reserved' || occupiedByOther}
              className="flex w-full flex-1 flex-col items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-display text-[26px] text-text leading-none">{t.label}</span>
              <span className="mt-2 text-[14px] tracking-[0.18em] uppercase font-extralight text-text-faint">{t.seats} seats</span>
              <div className="mt-2"><Badge variant={statusVariant(t.status)}>{t.status}</Badge></div>
              {t.occupiedByName && (
                <span className="mt-2 text-[12px] uppercase tracking-[0.12em] text-text-faint">
                  {ownedByCurrentUser ? 'Your table' : `Serving: ${t.occupiedByName}`}
                </span>
              )}
            </button>
            {ownedByCurrentUser && !ownDraft && (
              <Button size="sm" variant="ghost" onClick={() => void markFree(t.id, t.label)}>
                Mark free
              </Button>
            )}
          </div>
          );
        })}
      </div>
      <FloorPopup open={floorOpen} onClose={() => setFloorOpen(false)} />
    </div>
  );
}
