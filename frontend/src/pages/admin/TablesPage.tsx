import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Button, Input, Modal, Badge } from '../../components/ui';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useCatalogStore } from '../../store/catalogStore';
import { toast } from '../../components/ui/Toast';
import type { FloorTable } from '../../data/seed';

export function TablesPage() {
  const { floors, tables, saveTable, deleteTable, addFloor, deleteFloor } = useCatalogStore();
  const [activeFloor, setActiveFloor] = useState(floors[0]?.id ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [draft, setDraft] = useState<FloorTable>({ id: '', label: '', floorId: '', seats: 2, status: 'available' });
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmFloorId, setConfirmFloorId] = useState<string | null>(null);
  const [floorName, setFloorName] = useState('');
  const [savingTable, setSavingTable] = useState(false);
  const [savingFloor, setSavingFloor] = useState(false);

  const floorTables = tables.filter((t) => t.floorId === activeFloor);

  useEffect(() => {
    if (!floors.length) {
      setActiveFloor('');
      return;
    }
    if (!floors.some((floor) => floor.id === activeFloor)) {
      setActiveFloor(floors[0].id);
    }
  }, [floors, activeFloor]);

  const openNew = () => {
    if (!activeFloor) {
      toast.error('Create a floor before adding a table.');
      return;
    }
    setDraft({ id: `t-${Date.now()}`, label: '', floorId: activeFloor, seats: 2, status: 'available' });
    setEditing(false);
    setModalOpen(true);
  };
  const openEdit = (t: FloorTable) => {
    setDraft(t);
    setEditing(true);
    setModalOpen(true);
  };
  const save = async () => {
    if (!draft.label.trim()) {
      toast.error('Table label is required.');
      return;
    }
    if (!draft.floorId) {
      toast.error('Select a floor before creating a table.');
      return;
    }
    setSavingTable(true);
    try {
      await saveTable({ ...draft, label: draft.label.trim() });
      toast.success(editing ? 'Table updated.' : 'Table created.');
      setModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save table.');
    } finally {
      setSavingTable(false);
    }
  };
  const createFloor = async () => {
    if (!floorName.trim()) return;
    setSavingFloor(true);
    try {
      const floor = await addFloor(floorName.trim());
      setActiveFloor(floor.id);
      toast.success('Floor added.');
      setFloorName('');
      setFloorModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to add floor.');
    } finally {
      setSavingFloor(false);
    }
  };
  const removeFloor = async () => {
    if (!confirmFloorId) return;
    try {
      await deleteFloor(confirmFloorId);
      toast.info('Floor removed.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete floor.');
    }
  };

  const statusVariant = (s: FloorTable['status']) =>
    s === 'occupied' ? 'paid' : s === 'reserved' ? 'card-pay' : 'stone';

  return (
    <div>
      <PageHeader
        title="Tables"
        accentWord="Tables"
        subtitle="Floors & seating"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="md" onClick={() => setFloorModalOpen(true)}><LayoutGrid size={14} /> Add floor</Button>
            <Button size="md" onClick={openNew}><Plus size={14} /> New table</Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
        {floors.map((f) => (
          <div
            key={f.id}
            className={`flex items-stretch whitespace-nowrap transition-colors border ${
              activeFloor === f.id
                ? 'text-gold border-[rgba(0,117,74,0.4)] bg-[rgba(0,117,74,0.05)]'
                : 'text-text-muted border-border'
            }`}
          >
            <button
              onClick={() => setActiveFloor(f.id)}
              className="px-4 py-2 text-[15px] tracking-[0.18em] uppercase font-light min-h-[40px]"
            >
              {f.name}
            </button>
            <button
              onClick={() => setConfirmFloorId(f.id)}
              className="px-3 min-h-[40px] border-l border-inherit hover:text-cancel flex items-center justify-center"
              aria-label={`Delete ${f.name}`}
              title="Delete floor"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <SectionLabel>{floorTables.length} tables</SectionLabel>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {floorTables.map((t) => (
          <div key={t.id} className="border border-border p-5" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-[26px] text-text leading-none">{t.label}</span>
              <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
            </div>
            <div className="mt-3 text-[15px] tracking-[0.18em] uppercase font-extralight text-text-faint">{t.seats} seats</div>
            <div className="flex items-center gap-1 mt-4">
              <button onClick={() => openEdit(t)} className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Edit"><Pencil size={14} /></button>
              <button onClick={() => setConfirmId(t.id)} className="p-2 text-text-muted hover:text-cancel min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit table' : 'New table'}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void save()} disabled={savingTable}>
              {savingTable ? 'Saving…' : editing ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. 07" />
          <Input label="Seats" type="number" value={draft.seats} onChange={(e) => setDraft({ ...draft, seats: Number(e.target.value) })} />
        </div>
      </Modal>

      <Modal
        open={floorModalOpen}
        onClose={() => setFloorModalOpen(false)}
        title="Add floor"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setFloorModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void createFloor()} disabled={savingFloor}>
              {savingFloor ? 'Creating…' : 'Create floor'}
            </Button>
          </>
        }
      >
        <Input label="Floor name" value={floorName} onChange={(e) => setFloorName(e.target.value)} placeholder="e.g. Patio" />
      </Modal>

      <ConfirmDialog
        open={confirmFloorId !== null}
        onClose={() => setConfirmFloorId(null)}
        onConfirm={() => void removeFloor()}
        title="Delete floor"
        message={
          confirmFloorId && tables.some((table) => table.floorId === confirmFloorId)
            ? 'This floor contains tables. Delete its tables first, then delete the floor.'
            : 'This will permanently remove the floor.'
        }
        confirmLabel="Delete floor"
        danger
      />

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) {
            deleteTable(confirmId);
            toast.info('Table removed.');
          }
        }}
        title="Delete table"
        message="This will remove the table from the floor plan."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
