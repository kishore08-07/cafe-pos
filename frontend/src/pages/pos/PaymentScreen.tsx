import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Mail, Printer } from 'lucide-react';
import { Button, Input, SectionLabel } from '../../components/ui';
import { useCartStore, cartTotals } from '../../store/cartStore';
import { useCatalogStore } from '../../store/catalogStore';
import { ReceiptEmailModal } from './ReceiptEmailModal';
import { toast } from '../../components/ui/Toast';
import { api, downloadApiFile } from '../../api/client';
import type { OrderDto } from '../../api/contracts';
import { useSessionStore } from '../../store/sessionStore';

type Method = 'cash' | 'upi' | 'card';

export function PaymentScreen() {
  const navigate = useNavigate();
  const { orderId, items, tableId, tableLabel, coupon, customer, clearCart, setOrder } = useCartStore();
  const { paymentMethods, customers, refreshOrders, refreshTables } = useCatalogStore();
  const sessionId = useSessionStore((s) => s.sessionId);
  const totals = useMemo(() => cartTotals(items, coupon), [items, coupon]);
  const enabledMethods = useMemo(
    () => paymentMethods.filter((item) => item.enabled),
    [paymentMethods]
  );
  const [method, setMethod] = useState<Method>('cash');
  const [cash, setCash] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [done, setDone] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);
  const [paidTotal, setPaidTotal] = useState(0);
  const [paidCustomerEmail, setPaidCustomerEmail] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(orderId);
  const [upiQr, setUpiQr] = useState<string | null>(null);
  const [preparingDraft, setPreparingDraft] = useState(false);

  const availableTabs = useMemo(
    () =>
      enabledMethods
        .map((item) => ({
          id: item.type as Method,
          label: item.type === 'upi' ? 'UPI QR' : item.name,
        }))
        .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index),
    [enabledMethods]
  );
  const upiMethod = enabledMethods.find((item) => item.type === 'upi');

  useEffect(() => {
    if (availableTabs.length === 0) return;
    if (!availableTabs.some((item) => item.id === method)) {
      setMethod(availableTabs[0].id);
    }
  }, [availableTabs, method]);

  const ensureDraft = async () => {
    if (!sessionId) throw new Error('Open a POS session before accepting payment.');
    if (draftId) {
      return api<OrderDto>(`/api/orders/${draftId}`);
    }
    const draft = await api<OrderDto>(
      `/api/orders?sessionId=${sessionId}${tableId ? `&tableId=${tableId}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify({
          customerId: customer ? Number(customer.id) : null,
          lines: items.map((item) => ({ productId: Number(item.id), quantity: item.qty })),
        }),
      }
    );
    setDraftId(String(draft.id));
    setOrder(String(draft.id), draft.orderNumber);
    return draft;
  };

  useEffect(() => {
    if (items.length === 0 || done) return;
    setPreparingDraft(true);
    void ensureDraft().catch(() => undefined).finally(() => setPreparingDraft(false));
  }, []);

  useEffect(() => {
    if (!draftId) return;
    const paymentMethod = enabledMethods.find((item) => item.type === method);
    if (!paymentMethod) return;
    void api('/api/customer-display/preview-payment', {
      method: 'POST',
      body: JSON.stringify({ orderId: Number(draftId), paymentMethodId: Number(paymentMethod.id) }),
    }).catch(() => undefined);
  }, [draftId, method, enabledMethods]);

  useEffect(() => {
    if (method !== 'upi' || !upiMethod?.upiId) {
      setUpiQr(null);
      return;
    }
    const params = new URLSearchParams({
      upiId: upiMethod.upiId,
      amount: String(totals.total),
    });
    void api<string>(`/api/payment-methods/upi/qr?${params.toString()}`)
      .then(setUpiQr)
      .catch(() => setUpiQr(null));
  }, [method, totals.total, upiMethod?.upiId]);

  if (items.length === 0 && !done) {
    return (
      <div className="p-6">
        <SectionLabel>No active order</SectionLabel>
        <p className="py-12 text-center text-[17px] font-light text-text-muted">Add items to the cart first.</p>
        <Button variant="ghost" size="md" onClick={() => navigate('/pos')}><ArrowLeft size={14} /> Back to order</Button>
      </div>
    );
  }

  const change = cash ? Number(cash) - totals.total : 0;

  const finalize = async (pm: Method) => {
    const paymentMethod = enabledMethods.find((item) => item.type === pm);
    if (!paymentMethod) {
      toast.error(`${pm.toUpperCase()} is not enabled in payment methods.`);
      return;
    }
    setPaying(true);
    try {
      let draft = await ensureDraft();
      if (coupon) {
        draft = await api<OrderDto>(`/api/orders/${draft.id}/discount`, {
          method: 'PUT',
          body: JSON.stringify({ couponCode: coupon.code }),
        });
      }
      const paid = await api<OrderDto>(`/api/orders/${draft.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethodId: Number(paymentMethod.id),
          amount: Number(draft.totalAmount),
          referenceNumber: pm === 'card' ? cardRef || null : null,
        }),
      });
      setPaidOrderId(String(paid.id));
      setOrderNum(paid.orderNumber);
      setPaidTotal(Number(paid.totalAmount));
      setPaidCustomerEmail(customer ? customers.find((item) => item.id === customer.id)?.email ?? '' : '');
      await Promise.all([refreshOrders(), refreshTables()]);
      toast.success(`${paid.orderNumber} paid via ${pm}.`);
      clearCart();
      setDone(true);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Payment could not be completed.');
    } finally {
      setPaying(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-14 h-14 flex items-center justify-center text-paid mb-6"><Check size={56} strokeWidth={1.2} /></div>
        <div className="text-[14px] tracking-[0.28em] uppercase font-extralight text-text-muted mb-2">Payment complete</div>
        <div className="font-display font-light italic text-[clamp(48px,12vw,96px)] text-gold leading-none mb-6">{orderNum}</div>
        <div className="text-[17px] font-light text-text-muted mb-8">Thank you. The payment was recorded successfully.</div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
          <Button fullWidth size="md" onClick={() => navigate('/pos')}>New order</Button>
          <Button fullWidth variant="ghost" size="md" onClick={() => setEmailOpen(true)}>
            <Mail size={14} /> Send receipt
          </Button>
          <Button
            fullWidth
            variant="ghost"
            size="md"
            onClick={() => paidOrderId && void downloadApiFile(`/api/orders/${paidOrderId}/receipt/print`, `receipt-${orderNum}.pdf`)}
          >
            <Printer size={14} /> Print receipt
          </Button>
          <Button fullWidth variant="ghost" size="md" onClick={() => navigate('/pos/history')}>View history</Button>
        </div>
        <ReceiptEmailModal
          open={emailOpen}
          onClose={() => setEmailOpen(false)}
          orderNum={orderNum}
          total={paidTotal}
          orderId={paidOrderId}
          initialEmail={paidCustomerEmail}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/pos')}><ArrowLeft size={14} /> Back</Button>
        <span className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted">Table {tableLabel ?? '—'}</span>
      </div>
      <div className="text-center mb-8">
        <div className="text-[14px] tracking-[0.28em] uppercase font-extralight text-text-muted mb-2">Amount due</div>
        <div className="font-display font-light text-[clamp(56px,14vw,96px)] text-text leading-none">₹{totals.total}</div>
        {preparingDraft && <div className="mt-3 text-[14px] text-text-faint">Preparing payment preview…</div>}
      </div>
      <SectionLabel>Method</SectionLabel>
      {availableTabs.length === 0 ? (
        <div className="border border-border p-5 text-[16px] font-light text-text-muted">
          No payment methods are enabled. Enable at least one payment method from admin settings before checkout.
        </div>
      ) : (
        <div className={`grid gap-2 mb-6 ${availableTabs.length === 1 ? 'grid-cols-1' : availableTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethod(tab.id)}
              className={`py-3 text-[15px] tracking-[0.18em] uppercase font-light min-h-[44px] transition-colors ${method === tab.id ? 'text-gold border border-[rgba(0,117,74,0.4)] bg-[rgba(0,117,74,0.05)]' : 'text-text-muted border border-border'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {availableTabs.length > 0 && method === 'cash' && (
        <div>
          <Input label="Cash received (₹)" type="number" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0" />
          {cash && change >= 0 && (
            <div className="mt-6 text-center">
              <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted mb-1">Change due</div>
              <div className="font-display text-[44px] text-paid leading-none">₹{change}</div>
            </div>
          )}
          <Button fullWidth size="lg" className="mt-8" disabled={paying || !cash || Number(cash) < totals.total} onClick={() => void finalize('cash')}>
            {paying ? 'Processing...' : 'Confirm payment'}
          </Button>
        </div>
      )}

      {availableTabs.length > 0 && method === 'upi' && (
        <div className="flex flex-col items-center">
          {upiQr ? (
            <img src={upiQr} alt="UPI payment QR code" className="w-56 h-56 border border-border object-contain p-3 mb-4 bg-white" />
          ) : (
            <div className="w-56 h-56 border border-border flex items-center justify-center text-text-faint mb-4">UPI QR unavailable</div>
          )}
          <div className="text-[15px] tracking-[0.18em] uppercase font-extralight text-text-muted mb-2">Scan to pay ₹{totals.total}</div>
          {upiMethod?.upiId && <div className="text-[15px] font-light text-text-faint mb-6">{upiMethod.upiId}</div>}
          <Button fullWidth size="lg" disabled={paying} onClick={() => void finalize('upi')}>{paying ? 'Processing...' : 'Confirm payment received'}</Button>
        </div>
      )}

      {availableTabs.length > 0 && method === 'card' && (
        <div>
          <Input label="Reference number" value={cardRef} onChange={(e) => setCardRef(e.target.value)} placeholder="Optional" />
          <Button fullWidth size="lg" className="mt-8" disabled={paying} onClick={() => void finalize('card')}>{paying ? 'Processing...' : 'Confirm payment'}</Button>
        </div>
      )}
    </div>
  );
}
