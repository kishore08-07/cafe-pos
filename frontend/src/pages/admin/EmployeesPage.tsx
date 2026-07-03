import { useState } from 'react';
import { Plus, Pencil, Trash2, Archive, KeyRound } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Button, Input, Select, Badge, Drawer, Modal } from '../../components/ui';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useCatalogStore } from '../../store/catalogStore';
import { toast } from '../../components/ui/Toast';
import type { Employee } from '../../data/seed';

const blank: Employee = { id: '', name: '', email: '', role: 'EMPLOYEE', pin: '', active: true, archived: false };

export function EmployeesPage() {
  const { employees, saveEmployee, deleteEmployee, deleteEmployees, archiveEmployee, archiveEmployees, changeEmployeePin } = useCatalogStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<Employee>(blank);
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'archive'>('delete');
  const [pinModal, setPinModal] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');

  const visibleEmps = employees.filter((e) => !e.archived);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === visibleEmps.length) setSelected(new Set());
    else setSelected(new Set(visibleEmps.map((e) => e.id)));
  };

  const openNew = () => {
    setDraft({ ...blank, id: `e-${Date.now()}`, pin: '' });
    setEditing(false);
    setDrawerOpen(true);
  };
  const openEdit = (e: Employee) => {
    setDraft(e);
    setEditing(true);
    setDrawerOpen(true);
  };
  const save = async () => {
    if (!draft.name.trim() || !draft.email.includes('@') || (!editing && draft.pin.length < 8)) {
      toast.error('Name, valid email, and an 8+ character password are required.');
      return;
    }
    try {
      await saveEmployee(draft);
      toast.success(editing ? 'Employee updated.' : 'Employee added.');
      setDrawerOpen(false);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to save employee.');
    }
  };

  const handleChangePin = async () => {
    if (newPin.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (pinModal) {
      try {
        await changeEmployeePin(pinModal, newPin);
        toast.success('Password changed.');
        setPinModal(null);
        setNewPin('');
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : 'Unable to change password.');
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        accentWord="Employees"
        subtitle="Staff & access"
        actions={<Button onClick={openNew} size="md"><Plus size={14} /> New employee</Button>}
      />

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-3 border border-[rgba(0,117,74,0.3)] bg-[rgba(0,117,74,0.05)]">
          <span className="text-[15px] font-light text-text">{selected.size} selected</span>
          <Button variant="danger" size="sm" onClick={() => { setBulkAction('delete'); setConfirmBulk(true); }}>
            <Trash2 size={13} /> Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setBulkAction('archive'); setConfirmBulk(true); }}>
            <Archive size={13} /> Archive
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <SectionLabel>{visibleEmps.length} staff</SectionLabel>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
              <th className="py-3 pr-2 font-extralight w-10">
                <input type="checkbox" checked={selected.size === visibleEmps.length && visibleEmps.length > 0} onChange={toggleAll} className="accent-[#00754A]" />
              </th>
              <th className="py-3 pr-4 font-extralight">Name</th>
              <th className="py-3 pr-4 font-extralight">Type</th>
              <th className="py-3 pr-4 font-extralight">Status</th>
              <th className="py-3 pr-4 font-extralight text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleEmps.map((e) => (
              <tr key={e.id} className="border-b border-border">
                <td className="py-4 pr-2">
                  <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} className="accent-[#00754A]" />
                </td>
                <td className="py-4 pr-4">
                  <div className="text-[18px] font-light text-text">{e.name}</div>
                  <div className="text-[15px] font-light text-text-faint">{e.email}</div>
                </td>
                <td className="py-4 pr-4">
                  <Badge variant={e.role === 'ADMIN' ? 'gold' : 'card-pay'}>{e.role === 'ADMIN' ? 'User' : 'Employee'}</Badge>
                </td>
                <td className="py-4 pr-4">
                  <Badge variant={e.active ? 'paid' : 'cancel'}>{e.active ? 'Active' : 'Disable'}</Badge>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(e)} className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Edit"><Pencil size={14} /></button>
                    <button onClick={() => { setPinModal(e.id); setNewPin(''); }} className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Change password" title="Change password"><KeyRound size={14} /></button>
                    <button onClick={() => archiveEmployee(e.id)} className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Archive" title="Archive"><Archive size={14} /></button>
                    <button onClick={() => setConfirmId(e.id)} className="p-2 text-text-muted hover:text-cancel min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col">
        {visibleEmps.map((e) => (
          <div key={e.id} className="border-b border-border py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} className="accent-[#00754A] mt-1" />
                <div>
                  <div className="text-[17px] font-light text-text">{e.name}</div>
                  <div className="text-[16px] font-light text-text-muted mt-0.5">{e.email}</div>
                  <div className="mt-2 flex gap-2">
                    <Badge variant={e.role === 'ADMIN' ? 'gold' : 'card-pay'}>{e.role === 'ADMIN' ? 'User' : 'Employee'}</Badge>
                    <Badge variant={e.active ? 'paid' : 'cancel'}>{e.active ? 'Active' : 'Disable'}</Badge>
                  </div>
                </div>
              </div>
              <button onClick={() => openEdit(e)} className="p-2 text-text-muted hover:text-gold" aria-label="Edit"><Pencil size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit employee' : 'New employee'}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void save()}>{editing ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Full name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Léa Moreau" />
          <Input label="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@cafeetoile.test" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Employee['role'] })}>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </Select>
            {!editing && <Input label="Password" type="password" value={draft.pin} onChange={(e) => setDraft({ ...draft, pin: e.target.value })} placeholder="Minimum 8 characters" />}
          </div>
          <label className="flex items-center gap-3 text-[17px] font-light text-text">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="accent-[#00754A]" />
            Active
          </label>
        </div>
      </Drawer>

      {/* Change Password Modal */}
      <Modal
        open={pinModal !== null}
        onClose={() => setPinModal(null)}
        title="Change password"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPinModal(null)}>Cancel</Button>
            <Button size="sm" onClick={() => void handleChangePin()}>Update password</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[16px] font-light text-text-muted">
            Enter a new PIN/password for {employees.find((e) => e.id === pinModal)?.name ?? 'this employee'}.
          </p>
          <Input label="New password" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Minimum 8 characters" />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) {
            deleteEmployee(confirmId);
            toast.info('Employee removed.');
          }
        }}
        title="Delete employee"
        message="This will revoke access for this staff member."
        confirmLabel="Delete"
        danger
      />

      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={() => {
          const ids = Array.from(selected);
          if (bulkAction === 'delete') {
            deleteEmployees(ids);
            toast.info(`${ids.length} employees removed.`);
          } else {
            archiveEmployees(ids);
            toast.info(`${ids.length} employees archived.`);
          }
          setSelected(new Set());
        }}
        title={bulkAction === 'delete' ? 'Delete selected' : 'Archive selected'}
        message={`This will ${bulkAction} ${selected.size} employee(s).`}
        confirmLabel={bulkAction === 'delete' ? 'Delete all' : 'Archive all'}
        danger={bulkAction === 'delete'}
      />
    </div>
  );
}
