import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button, Input, Select, Badge, Drawer } from '../../components/ui';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useCatalogStore } from '../../store/catalogStore';
import { toast } from '../../components/ui/Toast';
import type { Coupon } from '../../data/seed';

const blank: Coupon = { id: '', code: '', type: 'percent', value: 0, active: true, minOrder: 0, promoType: 'manual' };

export function CouponsPage() {
  const { coupons, products, saveCoupon, deleteCoupon } = useCatalogStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<Coupon>(blank);
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setDraft({ ...blank, id: `cp-${Date.now()}` });
    setEditing(false);
    setDrawerOpen(true);
  };
  const openEdit = (c: Coupon) => {
    setDraft(c);
    setEditing(true);
    setDrawerOpen(true);
  };
  const save = async () => {
    if (draft.value <= 0) {
      toast.error('Discount value is required.');
      return;
    }
    if (draft.type === 'percent' && draft.value > 100) {
      toast.error('Percentage discount cannot exceed 100%.');
      return;
    }
    if (draft.promoType === 'manual' && !draft.code.trim()) {
      toast.error('Coupon code is required.');
      return;
    }
    if (draft.promoType === 'auto_product' && !draft.productId) {
      toast.error('Select a product for product-based promotion.');
      return;
    }
    if (draft.promoType === 'auto_order' && (!draft.orderThreshold || draft.orderThreshold <= 0)) {
      toast.error('Order threshold is required for order-based promotion.');
      return;
    }
    setSaving(true);
    try {
      await saveCoupon(draft);
      toast.success(editing ? 'Updated.' : 'Created.');
      setDrawerOpen(false);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await saveCoupon({ ...coupon, active: !coupon.active });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to update coupon.');
    }
  };

  const activePrograms = coupons.filter((c) => c.active);
  const promoTypeLabel = (c: Coupon) => {
    if (c.promoType === 'manual') return 'Coupon';
    if (c.promoType === 'auto_product') return 'Auto · Product';
    return 'Auto · Order';
  };

  const Row = ({ c }: { c: Coupon }) => (
    <tr className="border-b border-border">
      <td className="py-4 pr-4 font-display text-[18px] text-text">{c.code || '—'}</td>
      <td className="py-4 pr-4">
        <Badge variant={c.promoType === 'manual' ? 'gold' : 'card-pay'}>{promoTypeLabel(c)}</Badge>
      </td>
      <td className="py-4 pr-4 text-[16px] font-light text-text-muted">
        {c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}
        {c.minOrder > 0 && ` · min ₹${c.minOrder}`}
        {c.orderThreshold && ` · threshold ₹${c.orderThreshold}`}
      </td>
      <td className="py-4 pr-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={c.active}
            onChange={() => void toggleActive(c)}
            className="accent-[#00754A]"
          />
          <span className={`text-[14px] tracking-[0.18em] uppercase font-extralight ${c.active ? 'text-paid' : 'text-text-faint'}`}>
            {c.active ? 'Active' : 'Off'}
          </span>
        </label>
      </td>
      <td className="py-4 pr-4">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(c)} className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Edit"><Pencil size={14} /></button>
          <button onClick={() => setConfirmId(c.id)} className="p-2 text-text-muted hover:text-cancel min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Delete"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      <PageHeader
        title="Coupons"
        accentWord="Coupons"
        subtitle="Promotions & discounts"
        actions={<Button onClick={openNew} size="md"><Plus size={14} /> New coupon</Button>}
      />

      <div className="mb-3 p-3 border border-border" style={{ background: 'var(--surface)' }}>
        <span className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted">
          Active programs: <span className="text-gold font-display text-[18px]">{activePrograms.length}</span>
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
              <th className="py-3 pr-4 font-extralight">Name / Code</th>
              <th className="py-3 pr-4 font-extralight">Type</th>
              <th className="py-3 pr-4 font-extralight">Discount</th>
              <th className="py-3 pr-4 font-extralight">Activate</th>
              <th className="py-3 pr-4 font-extralight text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => <Row key={c.id} c={c} />)}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col mb-6">
        {coupons.map((c) => (
          <div key={c.id} className="border-b border-border py-4 flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-[18px] text-text">{c.code || 'Auto promotion'}</div>
              <div className="mt-1"><Badge variant={c.promoType === 'manual' ? 'gold' : 'card-pay'}>{promoTypeLabel(c)}</Badge></div>
              <div className="text-[16px] font-light text-text-muted mt-1">
                {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(c)} className="p-2 text-text-muted hover:text-gold" aria-label="Edit"><Pencil size={14} /></button>
              <button onClick={() => setConfirmId(c.id)} className="p-2 text-text-muted hover:text-cancel" aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit coupon / promotion' : 'New coupon / promotion'}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Select label="Promotion Type" value={draft.promoType} onChange={(e) => setDraft({ ...draft, promoType: e.target.value as Coupon['promoType'] })}>
            <option value="manual">Manual Coupon</option>
            <option value="auto_product">Automated — Product based</option>
            <option value="auto_order">Automated — Order based</option>
          </Select>

          {draft.promoType === 'manual' && (
            <Input label="Coupon Code" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
          )}

          {draft.promoType === 'auto_product' && (
            <>
              <Select label="Apply to" value={draft.applyTo ?? 'product'} onChange={(e) => setDraft({ ...draft, applyTo: e.target.value as 'product' | 'order' })}>
                <option value="product">Product</option>
                <option value="order">Order</option>
              </Select>
              <Select label="Product" value={draft.productId ?? ''} onChange={(e) => setDraft({ ...draft, productId: e.target.value })}>
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
              <Input label="Min Qty" type="number" value={draft.minQty ?? 1} onChange={(e) => setDraft({ ...draft, minQty: Number(e.target.value) })} />
            </>
          )}

          {draft.promoType === 'auto_order' && (
            <>
              <Select label="Apply to" value="order" onChange={() => {}}>
                <option value="order">Order</option>
              </Select>
              <Input label="Order amount threshold (₹)" type="number" value={draft.orderThreshold ?? 0} onChange={(e) => setDraft({ ...draft, orderThreshold: Number(e.target.value) })} />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select label="Discount type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Coupon['type'] })}>
              <option value="percent">% Percent</option>
              <option value="flat">₹ Flat amount</option>
            </Select>
            <Input label={draft.type === 'percent' ? 'Percent (%)' : 'Amount (₹)'} type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })} />
          </div>

          {draft.promoType === 'manual' && (
            <Input label="Minimum order (₹)" type="number" value={draft.minOrder} onChange={(e) => setDraft({ ...draft, minOrder: Number(e.target.value) })} />
          )}

          {draft.promoType !== 'manual' && (
            <Input label="Auto-generated code" value={draft.code || `AUTO_${draft.promoType.toUpperCase()}`} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="Auto-generated" />
          )}

          <label className="flex items-center gap-3 text-[17px] font-light text-text">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="accent-[#00754A]" />
            Active
          </label>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) {
            deleteCoupon(confirmId);
            toast.info('Coupon removed.');
          }
        }}
        title="Delete coupon"
        message="This will permanently remove the coupon."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
