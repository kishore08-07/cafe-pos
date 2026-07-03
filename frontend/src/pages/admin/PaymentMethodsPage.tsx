import { useState } from 'react';
import { Plus, Pencil, Trash2, Banknote, CreditCard, QrCode } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Button, Input, Select, Badge, Drawer } from '../../components/ui';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useCatalogStore } from '../../store/catalogStore';
import { toast } from '../../components/ui/Toast';
import type { PaymentMethod } from '../../data/seed';

const blank: PaymentMethod = { id: '', name: '', type: 'cash', enabled: true };

const icons: Record<PaymentMethod['type'], React.ReactNode> = {
  cash: <Banknote size={18} />,
  card: <CreditCard size={18} />,
  upi: <QrCode size={18} />,
};

export function PaymentMethodsPage() {
  const { paymentMethods, savePaymentMethod, deletePaymentMethod, togglePaymentMethod } = useCatalogStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<PaymentMethod>(blank);
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const openNew = () => {
    setDraft({ ...blank, id: `pm-${Date.now()}` });
    setEditing(false);
    setDrawerOpen(true);
  };
  const openEdit = (pm: PaymentMethod) => {
    setDraft(pm);
    setEditing(true);
    setDrawerOpen(true);
  };
  const save = () => {
    if (!draft.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (draft.type === 'upi' && !draft.upiId?.trim()) {
      toast.error('UPI ID is required for UPI payment method.');
      return;
    }
    savePaymentMethod(draft);
    toast.success(editing ? 'Payment method updated.' : 'Payment method created.');
    setDrawerOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Payment"
        accentWord="Payment"
        subtitle="Accepted methods"
        actions={<Button onClick={openNew} size="md"><Plus size={14} /> New method</Button>}
      />
      <SectionLabel>{paymentMethods.length} methods</SectionLabel>

      {/* List table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
              <th className="py-3 pr-4 font-extralight">Name</th>
              <th className="py-3 pr-4 font-extralight">Type</th>
              <th className="py-3 pr-4 font-extralight">ID</th>
              <th className="py-3 pr-4 font-extralight">Activate</th>
              <th className="py-3 pr-4 font-extralight text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.map((m) => (
              <tr key={m.id} className="border-b border-border">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="text-gold">{icons[m.type]}</span>
                    <span className="text-[18px] font-light text-text">{m.name}</span>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <Badge variant="stone">{m.type.toUpperCase()}</Badge>
                </td>
                <td className="py-4 pr-4 text-[16px] font-light text-text-muted">
                  {m.type === 'upi' ? m.upiId : m.id}
                </td>
                <td className="py-4 pr-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={() => {
                        togglePaymentMethod(m.id);
                        toast.info(`${m.name} ${m.enabled ? 'disabled' : 'enabled'}.`);
                      }}
                      className="accent-[#00754A]"
                    />
                    <span className={`text-[14px] tracking-[0.18em] uppercase font-extralight ${m.enabled ? 'text-paid' : 'text-text-faint'}`}>
                      {m.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </label>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(m)} className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmId(m.id)} className="p-2 text-text-muted hover:text-cancel min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col mb-6">
        {paymentMethods.map((m) => (
          <div key={m.id} className="border-b border-border py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gold">{icons[m.type]}</span>
                <div>
                  <div className="text-[17px] font-light text-text">{m.name}</div>
                  <div className="text-[14px] font-light text-text-faint mt-0.5">{m.type.toUpperCase()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.enabled ? 'paid' : 'stone'}>{m.enabled ? 'Active' : 'Off'}</Badge>
                <button onClick={() => openEdit(m)} className="p-2 text-text-muted hover:text-gold" aria-label="Edit"><Pencil size={14} /></button>
                <button onClick={() => setConfirmId(m.id)} className="p-2 text-text-muted hover:text-cancel" aria-label="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit payment method' : 'New payment method'}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save}>{editing ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. UPI QR" />
          <Select label="Type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as PaymentMethod['type'], upiId: e.target.value === 'upi' ? draft.upiId : undefined })}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
          </Select>

          {/* Conditional UPI fields */}
          {draft.type === 'upi' && (
            <div className="space-y-4 p-4 border border-[rgba(0,117,74,0.3)] bg-[rgba(0,117,74,0.03)]">
              <Input label="UPI ID" value={draft.upiId ?? ''} onChange={(e) => setDraft({ ...draft, upiId: e.target.value })} placeholder="yourstore@upi" />
              <div>
                <label className="block mb-2 text-[14px] font-semibold text-text-muted">QR Preview</label>
                <div className="w-32 h-32 border border-border flex items-center justify-center text-gold bg-white">
                  <QrCode size={80} strokeWidth={1} />
                </div>
                {draft.upiId && (
                  <p className="mt-2 text-[14px] font-light text-text-faint">QR encodes: upi://pay?pa={draft.upiId}</p>
                )}
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 text-[17px] font-light text-text">
            <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} className="accent-[#00754A]" />
            Active
          </label>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) {
            deletePaymentMethod(confirmId);
            toast.info('Payment method removed.');
          }
        }}
        title="Delete payment method"
        message="This will remove the payment method. It will no longer appear in the POS."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
