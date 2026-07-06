import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';

interface DisplayLine {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface DisplayState {
  orderId: number | null;
  orderNumber: string | null;
  status: 'DRAFT' | 'PAID' | 'CANCELLED' | null;
  lines: DisplayLine[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  paymentMethod: string | null;
  upiQrCode: string | null;
  message: string;
  updatedAt: string;
}

const emptyState: DisplayState = {
  orderId: null,
  orderNumber: null,
  status: null,
  lines: [],
  subtotal: 0,
  taxTotal: 0,
  discountTotal: 0,
  total: 0,
  paymentMethod: null,
  upiQrCode: null,
  message: 'Waiting for order',
  updatedAt: new Date().toISOString(),
};

export function CustomerDisplayPage() {
  const [state, setState] = useState<DisplayState>(emptyState);

  useEffect(() => {
    void api<DisplayState>('/api/customer-display/state').then(setState).catch(() => undefined);
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
    const stream = new EventSource(`${baseUrl}/api/customer-display/stream`);
    stream.addEventListener('state', (event) => {
      setState(JSON.parse((event as MessageEvent<string>).data) as DisplayState);
    });
    return () => stream.close();
  }, []);

  const isPaid = state.status === 'PAID';
  const hasPaymentPreview = Boolean(state.paymentMethod);
  const orderedCount = useMemo(
    () => state.lines.reduce((sum, line) => sum + Number(line.quantity), 0),
    [state.lines]
  );

  if (!state.orderId) {
    return (
      <div className="min-h-screen flex flex-col p-8" style={{ background: '#1E3932', color: '#FFFFFF' }}>
        <header className="font-display font-light italic text-[clamp(22px,3vw,32px)] text-[#F7F2EB]">
          Café <span className="text-gold">Étoile</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="font-display font-light italic text-[clamp(48px,10vw,96px)] text-gold leading-tight mb-6">
            Welcome
          </div>
          <p className="text-[clamp(12px,2vw,18px)] font-light text-[#B5ADA3] max-w-md mx-auto mb-8">
            {state.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-8" style={{ background: '#1E3932', color: '#FFFFFF' }}>
      <header className="flex items-center justify-between">
        <div className="font-display font-light italic text-[clamp(22px,3vw,32px)] text-[#F7F2EB]">
          Café <span className="text-gold">Étoile</span>
        </div>
        <div className="text-[14px] tracking-[0.22em] uppercase text-[#B5ADA3]">
          {state.orderNumber}
        </div>
      </header>

      {isPaid ? (
        <main className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-[14px] tracking-[0.28em] uppercase font-light text-[#B5ADA3] mb-4">Payment complete</div>
          <div className="font-display font-light italic text-[clamp(72px,16vw,144px)] text-gold leading-none mb-6">
            Thank You
          </div>
          <div className="text-[20px] font-light text-[#F7F2EB] mb-2">{state.orderNumber}</div>
          <div className="text-[16px] text-[#B5ADA3]">Your order has been confirmed.</div>
          <div className="mt-8 text-[28px] font-display text-white">₹{Number(state.total).toLocaleString('en-IN')}</div>
        </main>
      ) : (
        <main className="flex-1 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start py-8">
          <section className="border border-[rgba(255,255,255,0.08)] p-6 bg-[rgba(255,255,255,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[14px] tracking-[0.28em] uppercase font-light text-[#B5ADA3] mb-1">{state.message}</div>
                <div className="text-[16px] text-[#B5ADA3]">{orderedCount} item{orderedCount === 1 ? '' : 's'}</div>
              </div>
              <div className="text-right">
                <div className="text-[14px] tracking-[0.24em] uppercase text-[#6B6459]">Status</div>
                <div className="text-[18px] text-[#F7F2EB]">{state.status}</div>
              </div>
            </div>
            <div className="space-y-3">
              {state.lines.map((line) => (
                <div key={line.id} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[rgba(255,255,255,0.08)] pb-3">
                  <div>
                    <div className="text-[20px] font-light text-[#F7F2EB]">{line.productName}</div>
                    <div className="text-[14px] text-[#B5ADA3]">₹{Number(line.unitPrice).toLocaleString('en-IN')} each</div>
                  </div>
                  <div className="text-[18px] text-[#D4E9E2]">×{Number(line.quantity)}</div>
                  <div className="text-[20px] font-display text-white">₹{Number(line.lineTotal).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </section>

          <aside className="border border-[rgba(255,255,255,0.08)] p-6 bg-[rgba(0,0,0,0.14)]">
            <div className="text-[14px] tracking-[0.28em] uppercase text-[#B5ADA3] mb-4">
              {hasPaymentPreview ? 'Payment' : 'Order total'}
            </div>
            <div className="space-y-3 text-[18px]">
              <div className="flex justify-between text-[#B5ADA3]"><span>Subtotal</span><span>₹{Number(state.subtotal).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-[#B5ADA3]"><span>Tax</span><span>₹{Number(state.taxTotal).toLocaleString('en-IN')}</span></div>
              {Number(state.discountTotal) > 0 && <div className="flex justify-between text-[#D97706]"><span>Discount</span><span>−₹{Number(state.discountTotal).toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between items-baseline pt-3 border-t border-[rgba(255,255,255,0.08)]">
                <span className="text-[14px] tracking-[0.24em] uppercase text-gold">Total</span>
                <span className="font-display text-[46px] text-white">₹{Number(state.total).toLocaleString('en-IN')}</span>
              </div>
            </div>
            {hasPaymentPreview && (
              <div className="mt-8 text-center">
                <div className="text-[14px] tracking-[0.24em] uppercase text-[#B5ADA3] mb-3">Method</div>
                <div className="text-[24px] font-light text-[#F7F2EB] mb-4">{state.paymentMethod}</div>
                {state.upiQrCode && (
                  <img src={state.upiQrCode} alt="UPI QR code" className="mx-auto w-56 h-56 bg-white p-3" />
                )}
              </div>
            )}
          </aside>
        </main>
      )}

      <footer className="text-[14px] tracking-[0.28em] uppercase text-[#6B6459] text-center">
        Thank you for visiting
      </footer>
    </div>
  );
}
