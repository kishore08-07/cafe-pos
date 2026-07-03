import { useState, useRef } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Button } from '../../components/ui';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useCatalogStore } from '../../store/catalogStore';
import { toast } from '../../components/ui/Toast';
import { CATEGORY_PALETTE, type Category } from '../../data/seed';

export function CategoriesPage() {
  const { categories, products, saveCategory, deleteCategory, reorderCategories } = useCatalogStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const count = (id: string) => products.filter((p) => p.categoryId === id).length;

  const addInline = () => {
    setCreating(true);
    setEditingId(null);
    setEditName('');
    setEditColor(CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length]);
  };

  const saveInline = async (id?: string) => {
    if (!editName.trim()) {
      toast.error('Category name is required.');
      return;
    }
    setSaving(true);
    try {
      await saveCategory({
        id: id ?? `c-${Date.now()}`,
        name: editName.trim(),
        color: editColor,
        sortOrder: id ? categories.findIndex((c) => c.id === id) : categories.length,
      });
      toast.success(id ? 'Category saved.' : 'Category created.');
      setEditingId(null);
      setCreating(false);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: Category) => {
    setCreating(false);
    setEditingId(c.id);
    setEditName(c.name);
    setEditColor(c.color);
  };

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverItem.current = idx;
  };
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...categories];
    const dragged = items.splice(dragItem.current, 1)[0];
    items.splice(dragOverItem.current, 0, dragged);
    reorderCategories(items.map((c, i) => ({ ...c, sortOrder: i })));
    dragItem.current = null;
    dragOverItem.current = null;
    toast.success('Order saved.');
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        accentWord="Categories"
        subtitle="Menu groupings"
        actions={<Button onClick={addInline} size="md"><Plus size={14} /> New category</Button>}
      />
      <SectionLabel>{categories.length} categories</SectionLabel>

      <div className="border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_100px_80px_60px] text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border px-4 py-3">
          <span></span>
          <span>Name</span>
          <span>Colour</span>
          <span>Products</span>
          <span></span>
        </div>

        {creating && (
          <div className="grid grid-cols-[40px_1fr_100px_80px_60px] items-center px-4 py-3 border-b border-border bg-[rgba(0,117,74,0.02)]">
            <div />
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveInline();
                  if (e.key === 'Escape') setCreating(false);
                }}
                autoFocus
                placeholder="Category name"
                className="bg-transparent border-b border-gold py-1 text-[17px] font-light text-text outline-none w-full max-w-[200px]"
              />
              <Button size="sm" onClick={() => void saveInline()} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>✕</Button>
            </div>
            <div className="flex items-center gap-1">
              {CATEGORY_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEditColor(color)}
                  className="w-6 h-6 rounded-full border-2 transition-transform"
                  style={{
                    background: color,
                    borderColor: editColor === color ? 'var(--text)' : 'transparent',
                    transform: editColor === color ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            <span className="text-[16px] font-light text-text-muted">0</span>
            <div />
          </div>
        )}

        {categories.map((c, idx) => (
          <div
            key={c.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            className="grid grid-cols-[40px_1fr_100px_80px_60px] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-[rgba(0,117,74,0.02)]"
          >
            {/* Drag handle */}
            <div className="cursor-grab text-text-faint hover:text-text">
              <GripVertical size={16} />
            </div>

            {/* Name */}
            <div>
              {editingId === c.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void saveInline(c.id); if (e.key === 'Escape') setEditingId(null); }}
                    autoFocus
                    placeholder="Category name"
                    className="bg-transparent border-b border-gold py-1 text-[17px] font-light text-text outline-none w-full max-w-[200px]"
                  />
                  <Button size="sm" onClick={() => void saveInline(c.id)} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>✕</Button>
                </div>
              ) : (
                <button onClick={() => startEdit(c)} className="text-[17px] font-light text-text hover:text-gold text-left">
                  {c.name || <span className="italic text-text-faint">Unnamed</span>}
                </button>
              )}
            </div>

            {/* Colour swatch */}
            <div>
              {editingId === c.id ? (
                <div className="flex items-center gap-1">
                  {CATEGORY_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className="w-6 h-6 rounded-full border-2 transition-transform"
                      style={{
                        background: color,
                        borderColor: editColor === color ? 'var(--text)' : 'transparent',
                        transform: editColor === color ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full" style={{ background: c.color }} />
              )}
            </div>

            {/* Product count */}
            <span className="text-[16px] font-light text-text-muted">{count(c.id)}</span>

            {/* Delete */}
            <button onClick={() => setConfirmId(c.id)} className="p-2 text-text-muted hover:text-cancel min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) {
            deleteCategory(confirmId);
            toast.info('Category removed.');
          }
        }}
        title="Delete category"
        message="Products in this category will become uncategorised."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
