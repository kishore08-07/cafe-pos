import { useEffect, useState } from 'react';
import { X, Mail, Send } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { api } from '../../api/client';

interface ReceiptEmailModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  orderNum: string;
  total: number;
  initialEmail?: string;
}

export function ReceiptEmailModal({
  open,
  onClose,
  orderId,
  orderNum,
  total,
  initialEmail = '',
}: ReceiptEmailModalProps) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(initialEmail);
      setSent(false);
    }
  }, [open, initialEmail]);

  if (!open) return null;

  const handleSend = async () => {
    const recipient = email.trim().toLowerCase();
    if (!recipient || !recipient.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!orderId) {
      toast.error('The paid order could not be identified.');
      return;
    }
    setSending(true);
    try {
      await api(`/api/orders/${orderId}/receipt/email`, {
        method: 'POST',
        body: JSON.stringify({ email: recipient }),
      });
      setSent(true);
      toast.success(`Receipt sent to ${recipient}.`);
      window.setTimeout(() => {
        setSent(false);
        setEmail('');
        onClose();
      }, 1500);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to email receipt.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm border border-border p-6" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gold" />
            <h3 className="font-display font-light italic text-[22px] text-text leading-none">
              Send <span className="text-gold">receipt</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-text-faint hover:text-gold p-2 min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mb-4 p-3 border border-border">
          <div className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted">Order {orderNum}</div>
          <div className="font-display text-[24px] text-gold mt-1">₹{total.toLocaleString('en-IN')}</div>
        </div>
        <Input
          label="Customer email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
          autoComplete="email"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !sending && !sent) void handleSend();
          }}
        />
        <Button
          fullWidth
          size="lg"
          className="mt-5"
          onClick={handleSend}
          disabled={sending || sent}
        >
          {sent ? '✓ Sent' : sending ? 'Sending...' : <><Send size={14} /> Send receipt</>}
        </Button>
      </div>
    </div>
  );
}
