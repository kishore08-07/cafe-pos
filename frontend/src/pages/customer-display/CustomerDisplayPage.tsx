import { useEffect, useState } from 'react';
import { QrCode as QrIcon } from 'lucide-react';
import { api } from '../../api/client';

interface DisplayState {
  orderId: number | null;
  orderNumber: string | null;
  status: 'DRAFT' | 'PAID' | 'CANCELLED' | null;
  total: number;
  message: string;
  updatedAt: string;
}

const emptyState: DisplayState = {
  orderId: null,
  orderNumber: null,
  status: null,
  total: 0,
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
          <div className="w-32 h-32 border flex items-center justify-center text-gold" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <QrIcon size={80} strokeWidth={1} />
          </div>
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
      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-[14px] tracking-[0.28em] uppercase font-light text-[#B5ADA3] mb-4">
          {state.message}
        </div>
        <div className="font-display font-light text-[clamp(72px,16vw,144px)] text-gold leading-none">
          ₹{Number(state.total).toLocaleString('en-IN')}
        </div>
        <div className="mt-8 text-[15px] tracking-[0.24em] uppercase text-[#B5ADA3]">
          {state.status}
        </div>
      </main>
      <footer className="text-[14px] tracking-[0.28em] uppercase text-[#6B6459] text-center">
        Thank you for visiting
      </footer>
    </div>
  );
}
