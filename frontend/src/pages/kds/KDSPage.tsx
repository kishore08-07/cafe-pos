import { useEffect, useMemo, useState } from 'react';
import { Check, Filter, Play, X } from 'lucide-react';
import { useKDSStore, type KDSStage } from '../../store/kdsStore';
import { useCatalogStore } from '../../store/catalogStore';
import { toast } from '../../components/ui/Toast';

const stages: { id: KDSStage | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: '#AAA69E' },
  { id: 'to_cook', label: 'To cook', color: '#D4E9E2' },
  { id: 'preparing', label: 'Preparing', color: '#00A862' },
  { id: 'completed', label: 'Completed', color: '#00754A' },
];

export function KDSPage() {
  const { tickets, advanceStage, markItemDone, hydrate } = useKDSStore();
  const { products, categories } = useCatalogStore();
  const [activeTab, setActiveTab] = useState<KDSStage | 'all'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterProducts, setFilterProducts] = useState<Set<string>>(new Set());
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [updatingTickets, setUpdatingTickets] = useState<Set<string>>(new Set());

  useEffect(() => {
    void hydrate().catch((cause) =>
      toast.error(cause instanceof Error ? cause.message : 'Unable to load kitchen tickets.')
    );
    const timer = window.setInterval(() => void hydrate().catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [hydrate]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (activeTab !== 'all' && t.stage !== activeTab) return false;
      if (filterProducts.size > 0 && !t.items.some((i) => filterProducts.has(i.name))) return false;
      if (filterCategories.size > 0) {
        const hasMatch = t.items.some((i) => {
          const prod = products.find((p) => p.name === i.name);
          return prod && filterCategories.has(prod.categoryId);
        });
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [tickets, activeTab, filterProducts, filterCategories, products]);

  const toggleFilter = (set: Set<string>, item: string): Set<string> => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    return next;
  };

  const clearFilters = () => {
    setFilterProducts(new Set());
    setFilterCategories(new Set());
  };

  const uniqueItems = [...new Set(tickets.flatMap((t) => t.items.map((i) => i.name)))];

  const changeTicketStage = async (ticketId: string) => {
    if (updatingTickets.has(ticketId)) return;
    setUpdatingTickets((current) => new Set(current).add(ticketId));
    try {
      await advanceStage(ticketId);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to update ticket.');
    } finally {
      setUpdatingTickets((current) => {
        const next = new Set(current);
        next.delete(ticketId);
        return next;
      });
    }
  };

  const renderColumn = (stage: KDSStage) => {
    const col = filtered.filter((t) => t.stage === stage);
    const stg = stages.find((s) => s.id === stage)!;
    return (
      <div key={stage} className="min-h-[200px]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-2.5 h-2.5" style={{ background: stg.color }} />
          <span className="text-[15px] sm:text-[17px] tracking-[0.16em] uppercase font-normal" style={{ color: stg.color }}>{stg.label}</span>
          <span className="text-[15px] font-normal text-[#AAA69E] ml-auto">{col.length}</span>
        </div>
        <div className="space-y-3">
          {col.length === 0 && <p className="text-[17px] font-normal text-[#AAA69E] py-5">No tickets.</p>}
          {col.map((t) => {
            const allDone = t.items.every((i) => i.done);
            const updating = updatingTickets.has(t.id);
            return (
              <div
                key={t.id}
                className="p-5 sm:p-6 border-l-4"
                style={{
                  background: 'rgba(255,255,255,0.055)',
                  borderColor: stg.color,
                  opacity: allDone && stage === 'completed' ? 0.5 : 1,
                }}
              >
                <div className="mb-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-[26px] sm:text-[30px]" style={{ color: stg.color }}>{t.orderNum}</span>
                    <span className="text-[14px] sm:text-[16px] tracking-[0.12em] uppercase font-normal text-[#AAA69E]">Table {t.tableLabel}</span>
                  </div>
                  <div className="mt-1 text-[13px] tracking-[0.16em] uppercase text-[#AAA69E]">
                    {stage === 'to_cook' ? 'Waiting to be started' : stage === 'preparing' ? 'Currently being prepared' : 'Order finished'}
                  </div>
                </div>
                {t.items.map((i) => {
                  const canCompleteItem = stage === 'preparing' && !i.done;
                  return (
                    <button
                      key={i.id}
                      disabled={!canCompleteItem}
                      onClick={() =>
                        void markItemDone(t.id, i.id).catch((cause) =>
                          toast.error(cause instanceof Error ? cause.message : 'Unable to update item.')
                        )
                      }
                      className="w-full flex items-center justify-between py-3 border-b last:border-0 disabled:cursor-default"
                      style={{ borderColor: 'rgba(255,255,255,0.09)' }}
                    >
                    <span
                      className="text-[17px] sm:text-[19px] font-normal"
                      style={{
                        color: i.done ? 'rgba(245,247,250,0.5)' : 'rgba(245,247,250,0.92)',
                        textDecoration: i.done ? 'line-through' : 'none',
                      }}
                    >
                      {i.name}
                    </span>
                    <span className="flex items-center gap-2">
                      {i.done && <Check size={16} className="text-[#00A862]" />}
                      <span className="font-body font-semibold text-[20px] sm:text-[22px]" style={{ color: i.done ? 'rgba(255,255,255,0.45)' : '#D4E9E2' }}>×{i.qty}</span>
                    </span>
                    </button>
                  );
                })}
                {stage !== 'completed' && (
                  <button
                    disabled={updating}
                    onClick={() => void changeTicketStage(t.id)}
                    className="mt-5 w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 text-[15px] font-semibold uppercase tracking-[0.12em] disabled:opacity-50"
                    style={{
                      color: stage === 'to_cook' ? '#1E3932' : '#FFFFFF',
                      background: stage === 'to_cook' ? '#D4E9E2' : '#00754A',
                    }}
                  >
                    {stage === 'to_cook' ? <Play size={16} /> : <Check size={16} />}
                    {updating
                      ? 'Updating...'
                      : stage === 'to_cook'
                        ? 'Start preparing'
                        : 'Mark order completed'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#1E3932', color: '#FFFFFF' }}>
      {/* Filter sidebar */}
      {filterOpen && (
        <aside className="w-64 shrink-0 border-r p-5 overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.15)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[14px] tracking-[0.22em] uppercase font-normal text-[#AAA69E]">Filters</span>
            <button onClick={() => setFilterOpen(false)} className="text-[#AAA69E] hover:text-white p-1"><X size={16} /></button>
          </div>

          {(filterProducts.size > 0 || filterCategories.size > 0) && (
            <button onClick={clearFilters} className="text-[14px] text-[#D4E9E2] hover:text-white mb-4 underline">
              Clear Filter
            </button>
          )}

          <div className="mb-5">
            <div className="text-[13px] tracking-[0.22em] uppercase font-normal text-[#AAA69E] mb-2">Product</div>
            {uniqueItems.map((name) => (
              <label key={name} className="flex items-center gap-2 py-1.5 text-[15px] font-normal text-[#D4E9E2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterProducts.has(name)}
                  onChange={() => setFilterProducts(toggleFilter(filterProducts, name))}
                  className="accent-[#00754A]"
                />
                {name}
              </label>
            ))}
          </div>

          <div>
            <div className="text-[13px] tracking-[0.22em] uppercase font-normal text-[#AAA69E] mb-2">Category</div>
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 py-1.5 text-[15px] font-normal text-[#D4E9E2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterCategories.has(c.id)}
                  onChange={() => setFilterCategories(toggleFilter(filterCategories, c.id))}
                  className="accent-[#00754A]"
                />
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                {c.name}
              </label>
            ))}
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 p-5 sm:p-8">
        <header className="flex items-center justify-between mb-6 pb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <div className="font-body font-semibold text-[32px] sm:text-[38px] text-white">
            Kitchen <span className="text-gold">Display</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-2 text-[14px] tracking-[0.18em] uppercase font-normal border transition-colors"
              style={{
                color: filterOpen ? '#D4E9E2' : '#AAA69E',
                borderColor: filterOpen ? '#00754A' : 'rgba(255,255,255,0.12)',
                background: filterOpen ? 'rgba(0,117,74,0.1)' : 'transparent',
              }}
            >
              <Filter size={14} /> Filter
              {(filterProducts.size > 0 || filterCategories.size > 0) && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center text-[11px] bg-[#00754A] text-white">
                  {filterProducts.size + filterCategories.size}
                </span>
              )}
            </button>
            <span className="text-[14px] sm:text-[16px] tracking-[0.18em] uppercase font-normal text-[#AAA69E]">
              {filtered.length} tickets
            </span>
          </div>
        </header>

        {/* Status tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {stages.map((s) => {
            const count = s.id === 'all' ? filtered.length : filtered.filter((t) => t.stage === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className="px-4 py-2 text-[14px] tracking-[0.16em] uppercase font-normal whitespace-nowrap transition-colors"
                style={{
                  color: activeTab === s.id ? s.color : '#AAA69E',
                  borderBottom: activeTab === s.id ? `2px solid ${s.color}` : '2px solid transparent',
                }}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {activeTab === 'all' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['to_cook', 'preparing', 'completed'] as KDSStage[]).map(renderColumn)}
          </div>
        ) : (
          <div className="max-w-2xl">
            {renderColumn(activeTab)}
          </div>
        )}
      </div>
    </div>
  );
}
