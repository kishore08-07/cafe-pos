import { useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Button, Input, Select } from '../../components/ui';
import { useCatalogStore } from '../../store/catalogStore';
import { toast } from '../../components/ui/Toast';
import { downloadApiFile } from '../../api/client';

export function ReportsPage() {
  const { orders, products, categories, employees } = useCatalogStore();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === 'cancelled') return false;
      const d = new Date(o.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
      if (filterUser !== 'all' && o.employeeName !== filterUser) return false;
      if (filterProduct !== 'all' && !o.items.some((i) => i.name === filterProduct)) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo, filterUser, filterProduct]);

  // Previous period for delta calc
  const prevFiltered = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    const fromD = new Date(dateFrom);
    const toD = new Date(dateTo);
    const rangeDays = Math.max(1, (toD.getTime() - fromD.getTime()) / (1000 * 60 * 60 * 24));
    const prevTo = new Date(fromD);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - rangeDays);
    return orders.filter((o) => {
      if (o.status === 'cancelled') return false;
      const d = new Date(o.createdAt);
      return d >= prevFrom && d <= prevTo;
    });
  }, [orders, dateFrom, dateTo]);

  const revenue = filtered.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total, 0);
  const tickets = filtered.length;
  const avg = tickets ? Math.round(revenue / tickets) : 0;

  const prevRevenue = prevFiltered.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total, 0);
  const prevTickets = prevFiltered.length;
  const prevAvg = prevTickets ? Math.round(prevRevenue / prevTickets) : 0;

  const delta = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '—';
    const pct = Math.round(((curr - prev) / prev) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (dateFrom) activeFilters.push({ label: `From: ${dateFrom}`, clear: () => setDateFrom('') });
  if (dateTo) activeFilters.push({ label: `To: ${dateTo}`, clear: () => setDateTo('') });
  if (filterUser !== 'all') activeFilters.push({ label: `User: ${filterUser}`, clear: () => setFilterUser('all') });
  if (filterProduct !== 'all') activeFilters.push({ label: `Product: ${filterProduct}`, clear: () => setFilterProduct('all') });

  const productAgg = products
    .map((p) => ({
      name: p.name,
      qty: filtered.reduce(
        (s, o) => s + o.items.filter((i) => i.name === p.name).reduce((q, i) => q + i.qty, 0),
        0
      ),
      revenue: filtered.reduce(
        (s, o) => s + o.items.filter((i) => i.name === p.name).reduce((q, i) => q + i.price * i.qty, 0),
        0
      ),
    }))
    .filter((x) => x.qty > 0)
    .sort((a, b) => b.qty - a.qty);

  const catAgg = categories
    .map((c) => ({
      name: c.name,
      color: c.color,
      qty: filtered
        .flatMap((o) => o.items)
        .filter((i) => products.find((p) => p.name === i.name)?.categoryId === c.id)
        .reduce((s, i) => s + i.qty, 0),
    }))
    .filter((x) => x.qty > 0);

  const totalCat = catAgg.reduce((s, c) => s + c.qty, 0) || 1;
  const maxProd = productAgg[0]?.qty || 1;

  // Top orders sorted by highest total
  const topOrders = [...filtered].sort((a, b) => b.total - a.total).slice(0, 10);

  // Sales by time of day (hourly)
  const hourlyRevenue = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    revenue: filtered
      .filter((o) => new Date(o.createdAt).getHours() === h && o.status === 'paid')
      .reduce((s, o) => s + o.total, 0),
  }));
  const maxHourly = Math.max(...hourlyRevenue.map((h) => h.revenue), 1);

  const exportData = async (format: 'pdf' | 'xls') => {
    const params = new URLSearchParams();
    if (dateFrom && dateTo) {
      params.set('period', 'CUSTOM');
      params.set('from', dateFrom);
      params.set('to', dateTo);
    }
    const product = products.find((item) => item.name === filterProduct);
    const employee = employees.find((item) => item.name === filterUser);
    if (product) params.set('productId', product.id);
    if (employee) params.set('employeeId', employee.id);
    try {
      await downloadApiFile(
        `/api/reports/export/${format}?${params.toString()}`,
        format === 'pdf' ? 'cafe-report.pdf' : 'cafe-report.xlsx'
      );
      toast.success(`${format.toUpperCase()} exported.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Report export failed.');
    }
  };

  const uniqueEmployees = [...new Set(orders.map((o) => o.employeeName).filter(Boolean))];
  const uniqueProducts = [...new Set(orders.flatMap((o) => o.items.map((i) => i.name)))];

  return (
    <div>
      <PageHeader
        title="Reports"
        accentWord="Reports"
        subtitle="Sales & performance"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="md" onClick={() => void exportData('pdf')}><Download size={14} /> PDF</Button>
            <Button variant="ghost" size="md" onClick={() => void exportData('xls')}><Download size={14} /> XLS</Button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Select label="User" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
          <option value="all">All users</option>
          {uniqueEmployees.map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
        <Select label="Product" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
          <option value="all">All products</option>
          {uniqueProducts.map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
      </div>

      {/* Filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((f) => (
            <button
              key={f.label}
              onClick={f.clear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-light text-text border border-border hover:border-cancel transition-colors"
            >
              {f.label} <X size={12} />
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <SectionLabel>Metrics</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border mb-6">
        {[
          { label: 'Total order', value: `₹${revenue.toLocaleString('en-IN')}`, accent: true, d: delta(revenue, prevRevenue) },
          { label: 'Revenue', value: tickets, accent: false, d: delta(tickets, prevTickets) },
          { label: 'Average Order', value: `₹${avg.toLocaleString('en-IN')}`, accent: false, d: delta(avg, prevAvg) },
        ].map((m) => (
          <div key={m.label} className="p-6" style={{ background: 'var(--surface)' }}>
            <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-3">{m.label}</div>
            <div className={`font-display font-light text-[clamp(32px,5vw,48px)] leading-none ${m.accent ? 'text-gold' : 'text-text'}`}>{m.value}</div>
            {dateFrom && dateTo && (
              <div className={`mt-2 text-[15px] font-light ${m.d.startsWith('+') ? 'text-paid' : m.d.startsWith('-') ? 'text-cancel' : 'text-text-faint'}`}>
                {m.d} vs last period
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sales chart (revenue by time of day) */}
      <SectionLabel>Sales by time of day</SectionLabel>
      <div className="mb-6 p-5 border border-border overflow-x-auto" style={{ background: 'var(--surface)' }}>
        <div className="flex items-end gap-1 h-32 min-w-[500px]">
          {hourlyRevenue.filter((h) => h.hour >= 6 && h.hour <= 22).map((h) => (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-gold transition-all"
                style={{ height: `${(h.revenue / maxHourly) * 100}%`, minHeight: h.revenue > 0 ? '4px' : '1px', opacity: h.revenue > 0 ? 1 : 0.2 }}
              />
              <span className="text-[10px] text-text-faint">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category donut + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border mb-6">
        <div className="p-6" style={{ background: 'var(--surface)' }}>
          <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-5">Top Selling Category</div>
          {catAgg.length === 0 ? (
            <p className="text-[17px] font-light text-text-faint">No sales in range.</p>
          ) : (
            <>
              {/* Simple donut visualization */}
              <div className="flex items-center gap-6 mb-4">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {catAgg.reduce((acc, c) => {
                      const pct = (c.qty / totalCat) * 100;
                      const offset = acc.offset;
                      acc.elements.push(
                        <circle
                          key={c.name}
                          cx="18" cy="18" r="15.9155"
                          fill="none"
                          stroke={c.color}
                          strokeWidth="3"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={`-${offset}`}
                        />
                      );
                      acc.offset += pct;
                      return acc;
                    }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                  </svg>
                </div>
                <div className="space-y-2">
                  {catAgg.map((c) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                      <span className="text-[15px] font-light text-text">{c.name}</span>
                      <span className="text-[14px] text-text-faint ml-auto">{Math.round((c.qty / totalCat) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="p-6" style={{ background: 'var(--surface)' }}>
          <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-5">Top products</div>
          <div className="space-y-3">
            {productAgg.length === 0 && <p className="text-[17px] font-light text-text-faint">No sales in range.</p>}
            {productAgg.slice(0, 5).map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[17px] font-light text-text">{p.name}</span>
                  <span className="text-[16px] font-light text-text-muted">{p.qty}</span>
                </div>
                <div className="h-1 bg-border">
                  <div className="h-full bg-gold" style={{ width: `${(p.qty / maxProd) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Orders table */}
      <SectionLabel>Top Orders</SectionLabel>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
              <th className="py-3 pr-4 font-extralight">Order</th>
              <th className="py-3 pr-4 font-extralight">Revenue</th>
              <th className="py-3 pr-4 font-extralight">Point of Sale</th>
              <th className="py-3 pr-4 font-extralight">Date</th>
              <th className="py-3 pr-4 font-extralight">Customer</th>
              <th className="py-3 pr-4 font-extralight">Employee</th>
              <th className="py-3 pr-4 font-extralight text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {topOrders.map((o) => (
              <tr key={o.id} className="border-b border-border">
                <td className="py-4 pr-4 font-display text-[19px] text-text">{o.orderNum}</td>
                <td className="py-4 pr-4 font-display text-[17px] text-gold">₹{o.total.toLocaleString('en-IN')}</td>
                <td className="py-4 pr-4 text-[16px] font-light text-text-muted">Café Étoile</td>
                <td className="py-4 pr-4 text-[16px] font-light text-text-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="py-4 pr-4 text-[16px] font-light text-text-muted">{o.customer ?? '—'}</td>
                <td className="py-4 pr-4 text-[16px] font-light text-text-muted">{o.employeeName ?? '—'}</td>
                <td className="py-4 pr-4 text-right font-display text-[19px] text-text">₹{o.total.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Products table */}
      <SectionLabel>Top Products</SectionLabel>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
              <th className="py-3 pr-4 font-extralight">Product</th>
              <th className="py-3 pr-4 font-extralight">Qty sold</th>
              <th className="py-3 pr-4 font-extralight text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {productAgg.slice(0, 10).map((p) => (
              <tr key={p.name} className="border-b border-border">
                <td className="py-4 pr-4 text-[17px] font-light text-text">{p.name}</td>
                <td className="py-4 pr-4 text-[17px] font-light text-text-muted">{p.qty}</td>
                <td className="py-4 pr-4 text-right font-display text-[17px] text-gold">₹{p.revenue.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Categories table */}
      <SectionLabel>Top Categories</SectionLabel>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
              <th className="py-3 pr-4 font-extralight">Category</th>
              <th className="py-3 pr-4 font-extralight">Items sold</th>
              <th className="py-3 pr-4 font-extralight text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {catAgg.map((c) => (
              <tr key={c.name} className="border-b border-border">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                    <span className="text-[17px] font-light text-text">{c.name}</span>
                  </div>
                </td>
                <td className="py-4 pr-4 text-[17px] font-light text-text-muted">{c.qty}</td>
                <td className="py-4 pr-4 text-right text-[17px] font-light text-text-muted">{Math.round((c.qty / totalCat) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
