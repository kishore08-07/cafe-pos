import { useMemo, useState } from 'react';
import { Search, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Input, Button, Badge, Modal } from '../../components/ui';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useCatalogStore } from '../../store/catalogStore';
import { useCartStore } from '../../store/cartStore';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from '../../components/ui/Toast';
import type { Customer } from '../../data/seed';

export function CustomerPage() {
  const { customers, saveCustomer, deleteCustomer } = useCatalogStore();
  const { setCustomer, customer } = useCartStore();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(debounced.toLowerCase()) ||
          c.phone.includes(debounced) ||
          (c.email ?? '').toLowerCase().includes(debounced.toLowerCase())
      ),
    [customers, debounced]
  );

  const select = (id: string, name: string) => {
    setCustomer({ id, name });
    toast.success(`${name} attached to order.`);
  };

  const addNew = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone are required.');
      return;
    }
    try {
      await saveCustomer({
        id: `cu-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        visits: 0,
        totalSpend: 0,
      });
      toast.success('Customer created. Select a customer to attach them to the order.');
      setName('');
      setPhone('');
      setEmail('');
      setAdding(false);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to create customer.');
    }
  };

  const openEdit = (c: Customer) => {
    setEditTarget(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditEmail(c.email ?? '');
  };

  const saveEdit = () => {
    if (!editTarget || !editName.trim() || !editPhone.trim()) {
      toast.error('Name and phone are required.');
      return;
    }
    saveCustomer({
      ...editTarget,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim() || undefined,
    });
    toast.success('Customer updated.');
    setEditTarget(null);
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Customers" accentWord="Customers" subtitle="Find or attach a guest" />
      <div className="grid lg:grid-cols-2 gap-px bg-border">
        <div className="p-5" style={{ background: 'var(--surface)' }}>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Input label="Search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, phone or email" />
              <Search size={14} className="absolute right-0 bottom-3 text-text-faint" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAdding((v) => !v)} className="self-end"><UserPlus size={13} /> New</Button>
          </div>
          <SectionLabel>{filtered.length} results</SectionLabel>
          {customer && (
            <div className="mb-4 p-3 border border-[rgba(0,117,74,0.4)] bg-[rgba(0,117,74,0.05)]">
              <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-gold mb-1">Attached to order</div>
              <div className="text-[18px] font-light text-text">{customer.name}</div>
            </div>
          )}
          <div className="flex flex-col">
            {filtered.map((c) => (
              <div key={c.id} className="border-b border-border py-3 flex items-center justify-between gap-2">
                <button onClick={() => select(c.id, c.name)} className="flex-1 text-left hover:bg-[rgba(0,117,74,0.04)] transition-colors">
                  <div className="text-[18px] font-light text-text">{c.name}</div>
                  <div className="text-[16px] font-extralight text-text-faint">
                    {c.phone}
                    {c.email && ` · ${c.email}`}
                    {` · ${c.visits} visits`}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="stone">₹{c.totalSpend.toLocaleString('en-IN')}</Badge>
                  {/* Kebab menu → Edit / Delete */}
                  <button onClick={() => openEdit(c)} className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Edit" title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(c.id)} className="p-2 text-text-muted hover:text-cancel min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Delete" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5" style={{ background: 'var(--surface)' }}>
          {adding ? (
            <div>
              <SectionLabel>New customer</SectionLabel>
              <div className="space-y-5">
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Nair" />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@example.com" />
                <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." />
                <div className="flex gap-2">
                  <Button size="md" onClick={() => void addNew()}>Create customer</Button>
                  <Button variant="ghost" size="md" onClick={() => setAdding(false)}>Discard</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="font-display font-light italic text-[26px] text-text mb-2">No customer selected</div>
              <p className="text-[16px] font-light text-text-muted mb-6">Attach a customer to the current order, or create a new one.</p>
              <Button variant="ghost" size="md" onClick={() => setAdding(true)}><UserPlus size={14} /> New customer</Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit customer"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditTarget(null)}>Discard</Button>
            <Button size="sm" onClick={saveEdit}>Save</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input label="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="customer@example.com" />
          <Input label="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            deleteCustomer(confirmDeleteId);
            toast.info('Customer deleted.');
          }
        }}
        title="Delete customer"
        message="This will permanently remove this customer record."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
