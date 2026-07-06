import { useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Button, Input, Select } from '../../components/ui';
import { useCatalogStore } from '../../store/catalogStore';
import { toast } from '../../components/ui/Toast';
import { api, downloadApiFile } from '../../api/client';
import type { SessionDto } from '../../api/contracts';

type Period = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

interface DashboardSummary {
  totalOrders: number;
  revenue: number;
  averageOrderValue: number;
}

interface SalesTrendPoint {
  date: string;
  orderCount: number;
  revenue: number;
}

interface CategorySales {
  categoryId: number;
  categoryName: string;
  revenue: number;
}

interface ProductSales {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
}

interface OrderSummary {
  orderId: number;
  orderNumber: string;
  total: number;
  date: string;
  employeeName: string;
}

export function ReportsPage() {
  const { products, categories, employees } = useCatalogStore();
  const [period, setPeriod] = useState<Period>('TODAY');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterSession, setFilterSession] = useState('all');
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({ totalOrders: 0, revenue: 0, averageOrderValue: 0 });
  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [topCategories, setTopCategories] = useState<CategorySales[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [topOrders, setTopOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set('period', period);
    if (period === 'CUSTOM') {
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
    }
    const product = products.find((item) => item.id === filterProduct);
    const employee = employees.find((item) => item.id === filterUser);
    if (product) params.set('productId', product.id);
    if (employee) params.set('employeeId', employee.id);
    if (filterSession !== 'all') params.set('sessionId', filterSession);
    return params;
  };

  useEffect(() => {
    void api<SessionDto[]>('/api/sessions').then(setSessions).catch(() => undefined);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const params = buildParams().toString();
      try {
        const [nextSummary, nextTrend, nextCategories, nextProducts, nextOrders] = await Promise.all([
          api<DashboardSummary>(`/api/reports/summary?${params}`),
          api<SalesTrendPoint[]>(`/api/reports/sales-trend?${params}`),
          api<CategorySales[]>(`/api/reports/top-categories?${params}`),
          api<ProductSales[]>(`/api/reports/top-products?${params}`),
          api<{ content: OrderSummary[] }>(`/api/reports/top-orders?size=10&${params}`),
        ]);
        setSummary(nextSummary);
        setTrend(nextTrend);
        setTopCategories(nextCategories);
        setTopProducts(nextProducts);
        setTopOrders(nextOrders.content);
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : 'Unable to load reports.');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [period, dateFrom, dateTo, filterUser, filterProduct, filterSession]);

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (period !== 'TODAY') activeFilters.push({ label: `Period: ${period.split('_').join(' ')}`, clear: () => setPeriod('TODAY') });
  if (period === 'CUSTOM' && dateFrom) activeFilters.push({ label: `From: ${dateFrom}`, clear: () => setDateFrom('') });
  if (period === 'CUSTOM' && dateTo) activeFilters.push({ label: `To: ${dateTo}`, clear: () => setDateTo('') });
  if (filterUser !== 'all') activeFilters.push({ label: `User: ${employees.find((item) => item.id === filterUser)?.name ?? 'Unknown'}`, clear: () => setFilterUser('all') });
  if (filterProduct !== 'all') activeFilters.push({ label: `Product: ${products.find((item) => item.id === filterProduct)?.name ?? 'Unknown'}`, clear: () => setFilterProduct('all') });
  if (filterSession !== 'all') activeFilters.push({ label: `Session: ${filterSession}`, clear: () => setFilterSession('all') });

  const maxTrend = Math.max(...trend.map((point) => point.revenue), 1);
  const topCategoryRows = topCategories.map((entry) => ({
    ...entry,
    color: categories.find((category) => category.name === entry.categoryName)?.color ?? '#D4E9E2',
  }));
  const totalCategoryRevenue = topCategoryRows.reduce((sum, item) => sum + Number(item.revenue), 0) || 1;
  const maxProductRevenue = Math.max(...topProducts.map((item) => Number(item.revenue)), 1);

  const exportData = async (format: 'pdf' | 'xls') => {
    try {
      await downloadApiFile(
        `/api/reports/export/${format}?${buildParams().toString()}`,
        format === 'pdf' ? 'cafe-report.pdf' : 'cafe-report.xlsx'
      );
      toast.success(`${format.toUpperCase()} exported.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Report export failed.');
    }
  };

  const periodOptions = useMemo(
    () => [
      { value: 'TODAY', label: 'Today' },
      { value: 'THIS_WEEK', label: 'This Week' },
      { value: 'THIS_MONTH', label: 'This Month' },
      { value: 'CUSTOM', label: 'Custom' },
    ],
    []
  );

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <Select label="Period" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          {periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
        <Select label="User" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
          <option value="all">All users</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
        </Select>
        <Select label="Product" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
          <option value="all">All products</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <Select label="Session" value={filterSession} onChange={(e) => setFilterSession(e.target.value)}>
          <option value="all">All sessions</option>
          {sessions.map((session) => (
            <option key={session.id} value={String(session.id)}>
              {session.employeeName} · {new Date(session.openedAt).toLocaleDateString('en-IN')}
            </option>
          ))}
        </Select>
        <Input label="From" type="date" value={dateFrom} disabled={period !== 'CUSTOM'} onChange={(e) => setDateFrom(e.target.value)} />
        <Input label="To" type="date" value={dateTo} disabled={period !== 'CUSTOM'} onChange={(e) => setDateTo(e.target.value)} />
      </div>

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

      <SectionLabel>Metrics</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border mb-6">
        {[
          { label: 'Revenue', value: `₹${Number(summary.revenue).toLocaleString('en-IN')}`, accent: true },
          { label: 'Total orders', value: summary.totalOrders, accent: false },
          { label: 'Average Order', value: `₹${Number(summary.averageOrderValue).toLocaleString('en-IN')}`, accent: false },
        ].map((m) => (
          <div key={m.label} className="p-6" style={{ background: 'var(--surface)' }}>
            <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-3">{m.label}</div>
            <div className={`font-display font-light text-[clamp(32px,5vw,48px)] leading-none ${m.accent ? 'text-gold' : 'text-text'}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <SectionLabel>Sales Trend</SectionLabel>
      <div className="mb-6 p-5 border border-border overflow-x-auto" style={{ background: 'var(--surface)' }}>
        {loading ? (
          <p className="text-[17px] font-light text-text-faint">Loading report data…</p>
        ) : trend.length === 0 ? (
          <p className="text-[17px] font-light text-text-faint">No sales in range.</p>
        ) : (
          <div className="flex items-end gap-3 h-40 min-w-[420px]">
            {trend.map((point) => (
              <div key={point.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-[11px] text-text-faint">₹{Number(point.revenue).toLocaleString('en-IN')}</div>
                <div className="w-full bg-gold transition-all" style={{ height: `${(Number(point.revenue) / maxTrend) * 100}%`, minHeight: '4px' }} />
                <span className="text-[10px] text-text-faint">{new Date(point.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border mb-6">
        <div className="p-6" style={{ background: 'var(--surface)' }}>
          <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-5">Top Selling Categories</div>
          {topCategoryRows.length === 0 ? (
            <p className="text-[17px] font-light text-text-faint">No category sales in range.</p>
          ) : (
            <div className="space-y-3">
              {topCategoryRows.map((category) => (
                <div key={category.categoryId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[17px] font-light text-text flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: category.color }} />{category.categoryName}</span>
                    <span className="text-[16px] font-light text-text-muted">₹{Number(category.revenue).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-1 bg-border">
                    <div className="h-full" style={{ width: `${(Number(category.revenue) / totalCategoryRevenue) * 100}%`, background: category.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6" style={{ background: 'var(--surface)' }}>
          <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-5">Top products</div>
          <div className="space-y-3">
            {topProducts.length === 0 && <p className="text-[17px] font-light text-text-faint">No sales in range.</p>}
            {topProducts.slice(0, 5).map((product) => (
              <div key={product.productId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[17px] font-light text-text">{product.productName}</span>
                  <span className="text-[16px] font-light text-text-muted">₹{Number(product.revenue).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-1 bg-border">
                  <div className="h-full bg-gold" style={{ width: `${(Number(product.revenue) / maxProductRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionLabel>Top Orders</SectionLabel>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
              <th className="py-3 pr-4 font-extralight">Order</th>
              <th className="py-3 pr-4 font-extralight">Employee</th>
              <th className="py-3 pr-4 font-extralight">Date</th>
              <th className="py-3 pr-4 font-extralight text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {topOrders.map((order) => (
              <tr key={order.orderId} className="border-b border-border">
                <td className="py-4 pr-4 font-display text-[19px] text-text">{order.orderNumber}</td>
                <td className="py-4 pr-4 text-[16px] font-light text-text-muted">{order.employeeName}</td>
                <td className="py-4 pr-4 text-[16px] font-light text-text-muted">{new Date(order.date).toLocaleDateString('en-IN')}</td>
                <td className="py-4 pr-4 text-right font-display text-[19px] text-text">₹{Number(order.total).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            {topProducts.map((product) => (
              <tr key={product.productId} className="border-b border-border">
                <td className="py-4 pr-4 text-[17px] font-light text-text">{product.productName}</td>
                <td className="py-4 pr-4 text-[17px] font-light text-text-muted">{Number(product.quantity)}</td>
                <td className="py-4 pr-4 text-right font-display text-[17px] text-gold">₹{Number(product.revenue).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionLabel>Top Categories</SectionLabel>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
              <th className="py-3 pr-4 font-extralight">Category</th>
              <th className="py-3 pr-4 font-extralight">Revenue</th>
              <th className="py-3 pr-4 font-extralight text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {topCategoryRows.map((category) => (
              <tr key={category.categoryId} className="border-b border-border">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: category.color }} />
                    <span className="text-[17px] font-light text-text">{category.categoryName}</span>
                  </div>
                </td>
                <td className="py-4 pr-4 text-[17px] font-light text-text-muted">₹{Number(category.revenue).toLocaleString('en-IN')}</td>
                <td className="py-4 pr-4 text-right text-[17px] font-light text-text-muted">{Math.round((Number(category.revenue) / totalCategoryRevenue) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
