import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Button, Input, Select, Badge, Drawer } from '../../components/ui';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useCatalogStore, categoryColor, categoryName } from '../../store/catalogStore';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from '../../components/ui/Toast';
import { CATEGORY_PALETTE, TAX_RATES, type Product } from '../../data/seed';

const blank: Product = {
  id: '',
  name: '',
  price: 0,
  categoryId: '',
  taxRate: 5,
  uom: 'pc',
  available: true,
  description: '',
};

export function ProductsPage() {
  const { products, categories, saveProduct, deleteProduct, deleteProducts, saveCategory } = useCatalogStore();
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const debounced = useDebounce(query);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<Product>(blank);
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (filterCat === 'all' || p.categoryId === filterCat) &&
          p.name.toLowerCase().includes(debounced.toLowerCase())
      ),
    [products, debounced, filterCat]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const openNew = () => {
    setDraft({ ...blank, id: `p-${Date.now()}`, categoryId: categories[0]?.id ?? '' });
    setEditing(false);
    setDrawerOpen(true);
  };
  const openEdit = (p: Product) => {
    setDraft(p);
    setEditing(true);
    setDrawerOpen(true);
  };
  const save = async () => {
    if (!draft.name.trim() || draft.price <= 0) {
      toast.error('Name and price are required.');
      return;
    }
    if (!categories.some((category) => category.id === draft.categoryId)) {
      toast.error('Please select a category.');
      return;
    }
    setSaving(true);
    try {
      await saveProduct(draft);
      toast.success(editing ? 'Product updated.' : 'Product created.');
      setDrawerOpen(false);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: `c-${Date.now()}`,
      name: newCatName.trim(),
      color: CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length],
      sortOrder: categories.length,
    };
    try {
      const savedCategory = await saveCategory(newCat);
      setDraft((current) => ({ ...current, categoryId: savedCategory.id }));
      setNewCatName('');
      setShowNewCat(false);
      toast.success(`Category "${savedCategory.name}" created and assigned.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to create category.');
    }
  };

  // Check if typed category doesn't exist
  const catOptions = categories.map((c) => c.id);
  const selectedCatExists = catOptions.includes(draft.categoryId);

  return (
    <div>
      <PageHeader
        title="Products"
        accentWord="Products"
        subtitle="Menu catalogue"
        actions={
          <Button onClick={openNew} size="md">
            <Plus size={14} /> New product
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <div className="flex-1">
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
          />
        </div>
        <div className="sm:w-56">
          <Select label="Category" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-3 border border-[rgba(0,117,74,0.3)] bg-[rgba(0,117,74,0.05)]">
          <span className="text-[15px] font-light text-text">{selected.size} selected</span>
          <Button variant="danger" size="sm" onClick={() => setConfirmBulk(true)}>
            <Trash2 size={13} /> Delete selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <SectionLabel>{filtered.length} items</SectionLabel>

      {filtered.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Adjust filters or add a new product to the menu."
          action={<Button onClick={openNew} size="md"><Plus size={14} /> New product</Button>}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
                  <th className="py-3 pr-2 font-extralight w-10">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-[#00754A]" />
                  </th>
                  <th className="py-3 pr-4 font-extralight">Name</th>
                  <th className="py-3 pr-4 font-extralight">Category</th>
                  <th className="py-3 pr-4 font-extralight">Price</th>
                  <th className="py-3 pr-4 font-extralight">Tax</th>
                  <th className="py-3 pr-4 font-extralight text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border">
                    <td className="py-4 pr-2">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-[#00754A]" />
                    </td>
                    <td className="py-4 pr-4 text-[18px] font-light text-text">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.available ? 'bg-paid' : 'bg-cancel'}`} />
                        {p.name}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge color={categoryColor(categories, p.categoryId)}>
                        {categoryName(categories, p.categoryId)}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 font-display text-[19px] text-text">₹{p.price}</td>
                    <td className="py-4 pr-4 text-[17px] font-light text-text-muted">{p.taxRate}%</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setConfirmId(p.id)} className="p-2 text-text-muted hover:text-cancel min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col">
            {filtered.map((p) => (
              <div key={p.id} className="border-b border-border py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-[#00754A] mt-1" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.available ? 'bg-paid' : 'bg-cancel'}`} />
                        <span className="text-[17px] font-light text-text">{p.name}</span>
                      </div>
                      <div className="mt-1">
                        <Badge color={categoryColor(categories, p.categoryId)}>
                          {categoryName(categories, p.categoryId)}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[16px] font-light text-text-faint">{p.taxRate}% tax · {p.uom}</div>
                    </div>
                  </div>
                  <div className="font-display text-[20px] text-text">₹{p.price}</div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil size={13} /> Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmId(p.id)}><Trash2 size={13} /> Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit product' : 'New product'}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Flat White" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
            <Select label="Tax %" value={draft.taxRate} onChange={(e) => setDraft({ ...draft, taxRate: Number(e.target.value) })}>
              {TAX_RATES.map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </Select>
          </div>
          <div>
            <Select label="Category" value={selectedCatExists ? draft.categoryId : ''} onChange={(e) => {
              if (e.target.value === '__create__') {
                setShowNewCat(true);
              } else {
                setDraft({ ...draft, categoryId: e.target.value });
              }
            }}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__create__">+ Create & Edit new category</option>
            </Select>
            {showNewCat && (
              <div className="mt-3 p-3 border border-border space-y-3">
                <Input label="New category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Smoothies" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateCategory}>Create</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewCat(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
          <Input label="Description" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Short description of the product" />
          <label className="flex items-center gap-3 text-[17px] font-light text-text">
            <input type="checkbox" checked={draft.available} onChange={(e) => setDraft({ ...draft, available: e.target.checked })} className="accent-[#00754A]" />
            Available for sale
          </label>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) {
            deleteProduct(confirmId);
            toast.info('Product removed.');
          }
        }}
        title="Delete product"
        message="This will remove the product from the menu. This action cannot be undone."
        confirmLabel="Delete"
        danger
      />

      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={() => {
          deleteProducts(Array.from(selected));
          toast.info(`${selected.size} products removed.`);
          setSelected(new Set());
        }}
        title="Delete selected products"
        message={`This will remove ${selected.size} product(s) from the menu.`}
        confirmLabel="Delete all"
        danger
      />
    </div>
  );
}
