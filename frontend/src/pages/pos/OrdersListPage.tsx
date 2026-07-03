import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Input, Badge, Drawer, Button } from '../../components/ui';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useCatalogStore } from '../../store/catalogStore';
import { useCartStore } from '../../store/cartStore';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from '../../components/ui/Toast';
import type { Order } from '../../data/seed';

const statusVariant = (s: Order['status']) =>
  s === 'paid' ? 'paid' : s === 'cancelled' ? 'cancel' : 'stone';

export function OrdersListPage() {
  const navigate = useNavigate();
  const { orders, deleteOrder } = useCatalogStore();
  const { loadOrder } = useCartStore();
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const debounced = useDebounce(query);
  const [selected, setSelected] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) => {
          const matchText =
            o.orderNum.toLowerCase().includes(debounced.toLowerCase()) ||
            (o.tableLabel ?? '').toLowerCase().includes(debounced.toLowerCase()) ||
            (o.customer ?? '').toLowerCase().includes(debounced.toLowerCase());
          const matchDate = !dateFilter || o.createdAt.slice(0, 10) === dateFilter;
          return matchText && matchDate;
        }
      ),
    [orders, debounced, dateFilter]
  );

  const handleEditOrder = (order: Order) => {
    if (order.status !== 'draft') return;
    // Load order items into cart and navigate to POS
    const cartItems = order.items.map((i) => ({
      id: i.productId ?? '',
      name: i.name,
      price: i.price,
      qty: i.qty,
    }));
    loadOrder(
      cartItems,
      order.tableId ?? null,
      order.tableLabel,
      order.customer && order.customerId
        ? { id: order.customerId, name: order.customer }
        : null,
      order.id,
      order.orderNum
    );
    toast.info(`Editing ${order.orderNum} — items loaded into cart.`);
    navigate('/pos');
  };

  const handleDelete = (id: string) => {
    deleteOrder(id);
    toast.info('Draft order deleted.');
    setSelected(null);
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Order" accentWord="history" subtitle="Past & open tickets" />
      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <div className="flex-1 max-w-sm">
          <Input label="Search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Customer name, Order # or table" />
        </div>
        <div className="sm:w-48">
          <Input label="Date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>
      <SectionLabel>{filtered.length} orders</SectionLabel>

      {filtered.length === 0 ? (
        <EmptyState title="No orders found" description="Open tickets will appear here." />
      ) : (
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
                <th className="py-3 pr-4 font-extralight">Order</th>
                <th className="py-3 pr-4 font-extralight">Table</th>
                <th className="py-3 pr-4 font-extralight">Customer</th>
                <th className="py-3 pr-4 font-extralight">Status</th>
                <th className="py-3 pr-4 font-extralight">Payment</th>
                <th className="py-3 pr-4 font-extralight">Date</th>
                <th className="py-3 pr-4 font-extralight text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} onClick={() => setSelected(o)} className="border-b border-border cursor-pointer hover:bg-[rgba(0,117,74,0.04)]">
                  <td className="py-4 pr-4 font-display text-[19px] text-text">{o.orderNum}</td>
                  <td className="py-4 pr-4 text-[17px] font-light text-text-muted">{o.tableLabel ?? '—'}</td>
                  <td className="py-4 pr-4 text-[17px] font-light text-text-muted">{o.customer ?? '—'}</td>
                  <td className="py-4 pr-4"><Badge variant={statusVariant(o.status)}>{o.status}</Badge></td>
                  <td className="py-4 pr-4 text-[17px] font-light text-text-muted uppercase">{o.paymentMethod ?? '—'}</td>
                  <td className="py-4 pr-4 text-[16px] font-light text-text-faint">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="py-4 pr-4 text-right font-display text-[19px] text-text">₹{o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="sm:hidden flex flex-col">
        {filtered.map((o) => (
          <button key={o.id} onClick={() => setSelected(o)} className="border-b border-border py-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-[18px] text-text">{o.orderNum}</div>
                <div className="text-[16px] font-light text-text-muted mt-0.5">
                  Table {o.tableLabel ?? '—'} · {o.customer ?? 'No customer'} · {o.items.length} items
                </div>
                <div className="mt-2"><Badge variant={statusVariant(o.status)}>{o.status}</Badge></div>
              </div>
              <div className="font-display text-[20px] text-text">₹{o.total}</div>
            </div>
          </button>
        ))}
      </div>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.orderNum}` : ''}
        footer={
          selected && (
            <div className="flex items-center justify-between w-full">
              <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
              {selected.status === 'draft' && (
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" onClick={() => setConfirmDelete(selected.id)}>
                    <Trash2 size={13} /> Delete
                  </Button>
                  <Button size="sm" onClick={() => handleEditOrder(selected)}>
                    <Pencil size={13} /> Edit Order
                  </Button>
                </div>
              )}
            </div>
          )
        }
      >
        {selected && (
          <div>
            <div className="flex justify-between text-[16px] font-light text-text-muted mb-4 pb-3 border-b border-border">
              <span>Table {selected.tableLabel ?? '—'}</span>
              <span>{new Date(selected.createdAt).toLocaleString()}</span>
            </div>
            {selected.customer && (
              <div className="mb-3 text-[16px] font-light text-text-muted">
                Customer: <span className="text-text">{selected.customer}</span>
              </div>
            )}
            {selected.items.map((i, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-border">
                <span className="text-[18px] font-light text-text">{i.name} <span className="text-text-faint">×{i.qty}</span></span>
                <span className="font-display text-[18px] text-text-muted">₹{i.price * i.qty}</span>
              </div>
            ))}
            <div className="flex justify-between pt-4 mt-2">
              <span className="text-[15px] tracking-[0.22em] uppercase font-extralight text-gold">Total</span>
              <span className="font-display text-[28px] text-text">₹{selected.total}</span>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) handleDelete(confirmDelete);
          setConfirmDelete(null);
        }}
        title="Delete draft order"
        message="This will permanently remove this draft order."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
