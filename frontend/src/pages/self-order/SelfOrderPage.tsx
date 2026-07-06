import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, Check, ChefHat, Coffee, Minus, Plus, ShoppingCart, TicketPercent, X } from 'lucide-react';
import { Button, Input, SectionLabel } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { api } from '../../api/client';
import type { ProductDto } from '../../api/contracts';

interface CartLine {
  product: ProductDto;
  quantity: number;
}

interface CouponDiscount {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

interface ConfigResponse {
  enabled: boolean;
  mode: 'ONLINE_ORDERING' | 'QR_MENU';
  backgroundColor?: string;
  backgroundImageUrl?: string;
}

interface PlacedOrder {
  orderId: number;
  orderNumber: string;
  tableId: number;
  total: number;
  status: 'DRAFT' | 'PAID' | 'CANCELLED';
}

interface OrderStatus {
  orderId: number;
  orderNumber: string;
  status: 'DRAFT' | 'PAID' | 'CANCELLED';
  kitchenStage: 'TO_COOK' | 'PREPARING' | 'COMPLETED';
}

export function SelfOrderPage() {
  const { token = '' } = useParams<{ token: string }>();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ConfigResponse>({ enabled: false, mode: 'QR_MENU' });
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<CouponDiscount | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    void Promise.all([
      api<ProductDto[]>(`/api/self-order/menu/${encodeURIComponent(token)}`),
      api<ConfigResponse>('/api/self-order/config'),
    ])
      .then(([menu, nextConfig]) => {
        setProducts(menu);
        setConfig(nextConfig);
      })
      .catch((cause) =>
        toast.error(cause instanceof Error ? cause.message : 'Unable to load the menu.')
      )
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!placed) return;
    const update = () =>
      void api<OrderStatus>(`/api/self-order/order/${placed.orderId}/status`)
        .then(setStatus)
        .catch(() => undefined);
    update();
    const timer = window.setInterval(update, 4000);
    return () => window.clearInterval(timer);
  }, [placed]);

  const canOrder = config.enabled && config.mode === 'ONLINE_ORDERING';
  const categories = useMemo(
    () => [...new Map(products.map((product) => [product.categoryId, { name: product.categoryName, color: product.categoryColor }])).entries()],
    [products]
  );
  const visibleProducts = products.filter(
    (product) => activeCategory === 'all' || product.categoryId === activeCategory
  );
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
  const discount = coupon
    ? coupon.type === 'PERCENTAGE'
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(subtotal, coupon.value)
    : 0;
  const total = Math.max(0, subtotal - discount);

  const pageStyle = {
    backgroundColor: config.backgroundColor ?? 'var(--bg)',
    backgroundImage: config.backgroundImageUrl ? `linear-gradient(rgba(17, 24, 39, 0.18), rgba(17, 24, 39, 0.32)), url(${config.backgroundImageUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } as const;

  const changeQuantity = (product: ProductDto, delta: number) => {
    if (!canOrder) return;
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (!existing && delta > 0) return [...current, { product, quantity: 1 }];
      return current
        .map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + delta }
            : line
        )
        .filter((line) => line.quantity > 0);
    });
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error('Enter a coupon code.');
      return;
    }
    setApplyingCoupon(true);
    try {
      const result = await api<{ type: 'PERCENTAGE' | 'FIXED'; value: number }>(
        '/api/coupons/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code, orderTotal: subtotal }),
        }
      );
      setCoupon({ code, type: result.type, value: result.value });
      toast.success(`Coupon ${code} applied.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to apply coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const placeOrder = async () => {
    if (!cart.length) return;
    setPlacing(true);
    try {
      const order = await api<PlacedOrder>(
        `/api/self-order/order/${encodeURIComponent(token)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            couponCode: coupon?.code ?? null,
            lines: cart.map((line) => ({
              productId: line.product.id,
              quantity: line.quantity,
            })),
          }),
        }
      );
      setPlaced(order);
      setCart([]);
      setCartOpen(false);
      setCoupon(null);
      setCouponCode('');
      toast.success(`${order.orderNumber} was sent to the kitchen.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to place the order.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-white" style={pageStyle}>Loading menu…</div>;
  }

  if (placed) {
    const stage = status?.kitchenStage ?? 'TO_COOK';
    const progress = stage === 'COMPLETED' ? 3 : stage === 'PREPARING' ? 2 : 1;
    const stages = [
      { label: 'Order received', icon: Check },
      { label: 'Preparing', icon: ChefHat },
      { label: 'Ready for pickup', icon: Coffee },
    ];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white" style={pageStyle}>
        <div className="font-display font-light italic text-[28px] mb-10">
          Café <span className="text-gold">Étoile</span>
        </div>
        <div className="text-[14px] tracking-[0.24em] uppercase text-white/70">Your order</div>
        <div className="font-display text-[clamp(48px,12vw,80px)] text-gold my-4">{placed.orderNumber}</div>
        <div className="w-full max-w-md space-y-4 my-8 text-left bg-black/20 p-6 backdrop-blur-sm">
          {stages.map(({ label, icon: Icon }, index) => {
            const active = progress >= index + 1;
            return (
              <div key={label} className={`flex items-center gap-4 border-b border-white/10 py-3 ${active ? 'text-white' : 'text-white/50'}`}>
                <Icon size={22} className={active ? 'text-gold' : ''} />
                <span className="text-[18px] font-light">{label}</span>
              </div>
            );
          })}
        </div>
        <Button variant="ghost" onClick={() => { setPlaced(null); setStatus(null); }}>
          Order more <ArrowRight size={15} />
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 text-white" style={pageStyle}>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/25 p-4 backdrop-blur-md">
        <div className="font-display font-light italic text-[26px]">
          Café <span className="text-gold">Étoile</span>
        </div>
        {canOrder && (
          <button onClick={() => setCartOpen(true)} className="relative border border-white/15 bg-black/20 p-3 text-white">
            <ShoppingCart size={18} />
            {itemCount > 0 && <span className="absolute -right-2 -top-2 bg-gold px-1.5 text-[12px] text-white">{itemCount}</span>}
          </button>
        )}
      </header>
      <main className="p-4">
        <div className="flex gap-2 overflow-x-auto mb-4">
          <button onClick={() => setActiveCategory('all')} className={`border px-4 py-2 ${activeCategory === 'all' ? 'border-gold text-gold bg-black/20' : 'border-white/20 text-white/70 bg-black/10'}`}>All</button>
          {categories.map(([id, meta]) => (
            <button key={id} onClick={() => setActiveCategory(id)} className={`border px-4 py-2 whitespace-nowrap ${activeCategory === id ? 'text-white bg-black/30' : 'text-white/70 bg-black/10'}`} style={{ borderColor: activeCategory === id ? meta.color : 'rgba(255,255,255,0.2)' }}>{meta.name}</button>
          ))}
        </div>
        <SectionLabel>{visibleProducts.length} items</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {visibleProducts.map((product) => (
            <button key={product.id} onClick={() => changeQuantity(product, 1)} className="border bg-black/20 p-4 text-left hover:border-gold backdrop-blur-sm" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
              <span className="block w-10 h-1 mb-3" style={{ background: product.categoryColor }} />
              <div className="text-[17px] font-light text-white">{product.name}</div>
              <div className="mt-2 font-display text-[21px] text-gold">₹{Number(product.price).toLocaleString('en-IN')}</div>
              {product.description && <div className="mt-2 text-[14px] text-white/70">{product.description}</div>}
            </button>
          ))}
        </div>
      </main>
      {!canOrder && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 p-4 text-center text-white/80 backdrop-blur-md">
          View-only menu · Please order with your server
        </div>
      )}
      {canOrder && itemCount > 0 && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-0 left-0 right-0 flex justify-between bg-gold p-4 text-white">
          <span>Cart · {itemCount}</span><span>₹{total.toLocaleString('en-IN')}</span>
        </button>
      )}
      {cartOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 p-4 text-white backdrop-blur-md">
          <div className="mx-auto flex h-full max-w-2xl flex-col bg-[#10231d] p-4">
            <header className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="font-display text-[26px] text-white">Your order</div>
              <button onClick={() => setCartOpen(false)} className="p-2 text-white/70"><X size={20} /></button>
            </header>
            <div className="py-4 space-y-4 overflow-y-auto">
              {cart.map((line) => (
                <div key={line.product.id} className="flex items-center gap-3 border-b border-white/10 py-4">
                  <div className="flex-1 text-[18px] text-white">{line.product.name}</div>
                  <button onClick={() => changeQuantity(line.product, -1)} className="border border-white/15 p-2"><Minus size={14} /></button>
                  <span>{line.quantity}</span>
                  <button onClick={() => changeQuantity(line.product, 1)} className="border border-white/15 p-2"><Plus size={14} /></button>
                  <div className="w-20 text-right font-display text-gold">₹{Number(line.product.price) * line.quantity}</div>
                </div>
              ))}
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <Input label="Coupon code" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="WELCOME10" />
                <Button variant="ghost" disabled={applyingCoupon || !couponCode.trim()} onClick={() => void applyCoupon()}>
                  <TicketPercent size={14} /> {applyingCoupon ? 'Applying…' : 'Apply'}
                </Button>
              </div>
              {coupon && <div className="text-[15px] text-gold">Coupon {coupon.code} applied.</div>}
            </div>
            <div className="mt-auto border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between text-white/80"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              {discount > 0 && <div className="flex justify-between text-gold"><span>Discount</span><span>−₹{discount.toLocaleString('en-IN')}</span></div>}
              <div className="mb-4 flex justify-between text-[24px] text-white"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
              <Button fullWidth size="lg" disabled={placing || !cart.length} onClick={() => void placeOrder()}>
                {placing ? 'Placing order…' : 'Place order'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
