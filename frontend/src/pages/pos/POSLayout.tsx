import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { BellRing, Menu, LogOut, Users, X } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Button, Modal } from '../../components/ui';
import { MobileNavSheet } from '../../components/shared/MobileNavSheet';
import { EmployeeSwitchPopup } from './EmployeeSwitchPopup';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useSessionStore } from '../../store/sessionStore';
import { toast } from '../../components/ui/Toast';
import { api } from '../../api/client';
import type { KdsTicketDto } from '../../api/contracts';
import { subscribeToTopic } from '../../api/stomp';

const navItems = [
  { to: '/pos', label: 'POS Order' },
  { to: '/pos/history', label: 'Orders' },
  { to: '/pos/customers', label: 'Customers' },
  { to: '/pos/tables', label: 'Tables' },
];

const hamburgerItems = [
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Category' },
  { to: '/admin/payment', label: 'Payment method' },
  { to: '/admin/coupons', label: 'Coupon & Promotion' },
  { to: '/admin/tables', label: 'Booking' },
  { to: '/admin/employees', label: 'User/Employee' },
  { to: '/kds', label: 'KDS' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/login', label: 'Log-Out' },
];

export function POSLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();
  const tableLabel = useCartStore((s) => s.tableLabel);
  const { isOpen, closeSession, lastClosedSummary, clearLastClosedSummary } = useSessionStore();
  const knownKitchenStages = useRef<Map<number, KdsTicketDto['stage']> | null>(null);
  const skipNextNotificationSave = useRef(false);
  const [pickupNotifications, setPickupNotifications] = useState<KdsTicketDto[]>([]);
  const [popupOrderIds, setPopupOrderIds] = useState<Set<number>>(new Set());
  const [unreadOrderIds, setUnreadOrderIds] = useState<Set<number>>(new Set());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingSession, setClosingSession] = useState(false);

  useEffect(() => {
    if (!user) return;
    skipNextNotificationSave.current = true;
    const saved = window.localStorage.getItem(`pos-pickup-notifications-${user.id}`);
    try {
      setPickupNotifications(saved ? JSON.parse(saved) as KdsTicketDto[] : []);
    } catch {
      setPickupNotifications([]);
    }
    setPopupOrderIds(new Set());
    setUnreadOrderIds(new Set());
    setNotificationsOpen(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (skipNextNotificationSave.current) {
      skipNextNotificationSave.current = false;
      return;
    }
    window.localStorage.setItem(
      `pos-pickup-notifications-${user.id}`,
      JSON.stringify(pickupNotifications.slice(-30))
    );
  }, [pickupNotifications, user]);

  useEffect(() => {
    if (!user) return;

    const handleTicket = (ticket: KdsTicketDto) => {
      const previousStage = knownKitchenStages.current?.get(ticket.orderId);
      if (
        String(ticket.employeeId) === user.id &&
        ticket.stage === 'COMPLETED' &&
        previousStage !== 'COMPLETED'
      ) {
        setPickupNotifications((current) => {
          const existing = new Set(current.map((item) => item.orderId));
          return existing.has(ticket.orderId) ? current : [...current, ticket];
        });
        setPopupOrderIds((current) => new Set(current).add(ticket.orderId));
        setUnreadOrderIds((current) => new Set(current).add(ticket.orderId));
      }
      if (!knownKitchenStages.current) {
        knownKitchenStages.current = new Map();
      }
      knownKitchenStages.current.set(ticket.orderId, ticket.stage);
    };

    knownKitchenStages.current = new Map();
    void api<KdsTicketDto[]>('/api/kds/tickets')
      .then((tickets) => {
        knownKitchenStages.current = new Map(tickets.map((ticket) => [ticket.orderId, ticket.stage]));
      })
      .catch(() => undefined);

    return subscribeToTopic({
      destination: '/topic/kds',
      onMessage: (body) => {
        try {
          handleTicket(JSON.parse(body) as KdsTicketDto);
        } catch {
          // Ignore malformed frames and keep POS usable.
        }
      },
    });
  }, [user]);

  const handleLogout = () => {
    clearSession();
    toast.info('Signed out.');
    navigate('/login');
  };

  const handleCloseSession = async () => {
    setClosingSession(true);
    try {
      const summary = await closeSession();
      useCartStore.setState({
        orderId: null,
        orderNumber: null,
        tableId: null,
        tableLabel: null,
        customer: null,
        coupon: null,
        items: [],
      });
      setCloseDialogOpen(false);
      if (summary) {
        toast.success(`Session closed with ₹${Number(summary.expectedCash).toLocaleString('en-IN')} expected cash.`);
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to close the session.');
    } finally {
      setClosingSession(false);
    }
  };

  if (!isOpen && !lastClosedSummary) {
    return <Navigate to="/pos/session" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <header className="border-b border-border sticky top-0 z-50" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="font-display font-light italic text-[22px] leading-none text-text">
            Café <span className="text-gold">Étoile</span>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/pos'}
                className={({ isActive }) =>
                  `text-[15px] tracking-[0.18em] uppercase font-light transition-colors ${
                    isActive ? 'text-gold' : 'text-text-muted hover:text-text'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {tableLabel && (
              <span className="text-[15px] tracking-[0.12em] uppercase font-light text-gold border border-[rgba(0,117,74,0.4)] px-3.5 py-1.5">
                Table {tableLabel}
              </span>
            )}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setUnreadOrderIds(new Set());
                }}
                className="relative p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Pickup notifications"
                title="Pickup notifications"
              >
                <BellRing size={18} />
                {unreadOrderIds.size > 0 && (
                  <span className="absolute right-0 top-0 flex min-w-5 h-5 items-center justify-center rounded-full bg-cancel px-1 text-[11px] font-semibold text-white">
                    {unreadOrderIds.size > 9 ? '9+' : unreadOrderIds.size}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-[190] w-[min(24rem,calc(100vw-2rem))] border border-border bg-surface shadow-xl">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="text-[14px] font-semibold uppercase tracking-[0.18em] text-text">
                      Pickup notifications
                    </span>
                    {pickupNotifications.length > 0 && (
                      <button
                        onClick={() => {
                          setPickupNotifications([]);
                          setPopupOrderIds(new Set());
                        }}
                        className="text-[13px] uppercase tracking-[0.12em] text-text-faint hover:text-cancel"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {pickupNotifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-[16px] text-text-faint">
                        No completed orders yet.
                      </p>
                    ) : (
                      [...pickupNotifications].reverse().map((ticket) => (
                        <div key={ticket.orderId} className="border-b border-border px-4 py-3 last:border-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-display text-[20px] text-text">{ticket.orderNumber}</span>
                            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-paid">
                              Ready
                            </span>
                          </div>
                          <div className="mt-1 text-[15px] text-text-muted">
                            {ticket.tableNumber ? `Table ${ticket.tableNumber}` : 'Takeaway'} · Ready for pickup
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSwitchOpen(true)}
              className="p-2 text-text-muted hover:text-gold min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Switch employee"
              title="Switch cashier"
            >
              <Users size={18} />
            </button>
            <ThemeToggle />
            <div className="hidden lg:block">
              <Button variant="ghost" size="sm" onClick={() => setCloseDialogOpen(true)} disabled={!isOpen || closingSession}>
                Close session
              </Button>
            </div>
            <div className="hidden sm:flex items-center gap-3 ml-1 pl-3 border-l border-border">
              <button onClick={handleLogout} className="text-text-muted hover:text-cancel p-2 min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Sign out">
                <LogOut size={18} />
              </button>
            </div>
            <button onClick={() => setNavOpen(true)} className="md:hidden text-text-muted hover:text-gold p-2 min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
        <div className="hidden sm:block px-6 pb-2 text-[14px] tracking-[0.22em] uppercase font-extralight text-text-faint">
          {user?.name} · Session active
        </div>
      </header>
      <MobileNavSheet open={navOpen} onClose={() => setNavOpen(false)} items={hamburgerItems} />
      <EmployeeSwitchPopup open={switchOpen} onClose={() => setSwitchOpen(false)} />
      {popupOrderIds.size > 0 && (
        <div className="fixed right-4 top-20 z-[180] flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-3">
          {pickupNotifications.filter((ticket) => popupOrderIds.has(ticket.orderId)).map((ticket) => (
            <div
              key={ticket.orderId}
              className="border border-[rgba(0,117,74,0.45)] bg-surface p-4 shadow-lg"
            >
              <div className="flex items-start gap-3">
                <BellRing size={22} className="mt-0.5 shrink-0 text-gold" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold uppercase tracking-[0.18em] text-gold">
                    Order completed
                  </div>
                  <div className="mt-1 font-display text-[24px] text-text">{ticket.orderNumber}</div>
                  <div className="mt-1 text-[16px] text-text-muted">
                    {ticket.tableNumber ? `Table ${ticket.tableNumber}` : 'Takeaway'} is ready for pickup.
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPopupOrderIds((current) => {
                      const next = new Set(current);
                      next.delete(ticket.orderId);
                      return next;
                    })
                  }
                  className="shrink-0 p-2 text-text-faint hover:text-gold"
                  aria-label={`Dismiss ${ticket.orderNumber} notification`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <main className="flex-1">
        {isOpen ? <Outlet /> : <div className="p-6 text-center text-[17px] font-light text-text-muted">Session closed.</div>}
      </main>
      <Modal
        open={closeDialogOpen}
        onClose={() => !closingSession && setCloseDialogOpen(false)}
        title="Close session"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCloseDialogOpen(false)} disabled={closingSession}>Keep open</Button>
            <Button variant="danger" size="sm" onClick={() => void handleCloseSession()} disabled={closingSession}>
              {closingSession ? 'Closing...' : 'Close session'}
            </Button>
          </>
        }
      >
        <p className="text-[16px] font-light text-text-muted">
          This will close the active POS session and show the closing summary. Any remaining draft orders must be cleared first.
        </p>
      </Modal>
      <Modal
        open={lastClosedSummary !== null}
        onClose={() => {
          clearLastClosedSummary();
          navigate('/pos/session');
        }}
        title="Session summary"
        footer={
          <Button
            size="sm"
            onClick={() => {
              clearLastClosedSummary();
              navigate('/pos/session');
            }}
          >
            Back to session screen
          </Button>
        }
      >
        {lastClosedSummary && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border p-3">
                <div className="text-[13px] uppercase tracking-[0.16em] text-text-faint">Orders paid</div>
                <div className="mt-1 font-display text-[28px] text-text">{lastClosedSummary.totalOrders}</div>
              </div>
              <div className="border border-border p-3">
                <div className="text-[13px] uppercase tracking-[0.16em] text-text-faint">Revenue</div>
                <div className="mt-1 font-display text-[28px] text-text">₹{Number(lastClosedSummary.revenue).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="border border-border p-4">
              <div className="text-[13px] uppercase tracking-[0.16em] text-text-faint">Expected cash</div>
              <div className="mt-1 font-display text-[34px] text-gold">₹{Number(lastClosedSummary.expectedCash).toLocaleString('en-IN')}</div>
              <div className="mt-2 text-[15px] font-light text-text-muted">
                Closed at {new Date(lastClosedSummary.session.closedAt ?? lastClosedSummary.session.openedAt).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
