import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionLabel, Badge } from '../../components/ui';
import { useCatalogStore } from '../../store/catalogStore';

export function DashboardPage() {
  const { orders, products, customers } = useCatalogStore();
  const today = new Date().toISOString().slice(0, 10);
  const todays = orders.filter((o) => o.createdAt.slice(0, 10) === today);
  const revenue = todays
    .filter((o) => o.status === 'paid')
    .reduce((s, o) => s + o.total, 0);
  const tickets = todays.length;
  const avg = tickets ? Math.round(revenue / tickets) : 0;

  const metrics = [
    { label: "Today's Revenue", value: `₹${revenue.toLocaleString('en-IN')}`, accent: true },
    { label: 'Tickets Today', value: tickets, accent: false },
    { label: 'Avg. Ticket', value: `₹${avg.toLocaleString('en-IN')}`, accent: false },
    { label: 'Active Products', value: products.filter((p) => p.available).length, accent: false },
    { label: 'Customers', value: customers.length, accent: false },
    { label: 'Open Drafts', value: orders.filter((o) => o.status === 'draft').length, accent: false },
  ];

  const quickLinks = [
    { to: '/admin/products', label: 'Manage products' },
    { to: '/admin/tables', label: 'Edit floor plan' },
    { to: '/admin/employees', label: 'Staff & roles' },
    { to: '/admin/reports', label: 'View reports' },
  ];

  return (
    <div>
      <PageHeader
        title="Good day"
        accentWord="today"
        subtitle="Operations at a glance"
      />
      <SectionLabel>Snapshot</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-border mb-6">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="p-6"
            style={{ background: 'var(--surface)' }}
          >
            <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-3">
              {m.label}
            </div>
            <div
              className={`font-display font-light text-[clamp(32px,5vw,48px)] leading-none ${
                m.accent ? 'text-gold' : 'text-text'
              }`}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Recent orders</SectionLabel>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="text-[14px] tracking-[0.2em] uppercase font-extralight text-text-muted border-b border-border">
              <th className="py-3 pr-4 font-extralight">Order</th>
              <th className="py-3 pr-4 font-extralight">Table</th>
              <th className="py-3 pr-4 font-extralight">Status</th>
              <th className="py-3 pr-4 font-extralight">Items</th>
              <th className="py-3 pr-4 font-extralight text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map((o) => (
              <tr key={o.id} className="border-b border-border">
                <td className="py-4 pr-4 font-display text-[18px] text-text">{o.orderNum}</td>
                <td className="py-4 pr-4 text-[17px] font-light text-text-muted">{o.tableLabel ?? '—'}</td>
                <td className="py-4 pr-4">
                  <Badge
                    variant={o.status === 'paid' ? 'paid' : o.status === 'cancelled' ? 'cancel' : 'stone'}
                  >
                    {o.status}
                  </Badge>
                </td>
                <td className="py-4 pr-4 text-[17px] font-light text-text-muted">
                  {o.items.reduce((s, i) => s + i.qty, 0)}
                </td>
                <td className="py-4 pr-4 text-right font-display text-[18px] text-gold">
                  ₹{o.total.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionLabel>Quick actions</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
        {quickLinks.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="block p-6 hover:bg-[rgba(0,117,74,0.04)] transition-colors"
            style={{ background: 'var(--surface)' }}
          >
            <span className="text-[16px] tracking-[0.18em] uppercase font-light text-text">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
