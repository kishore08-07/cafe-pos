import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, Check, ChefHat, Coffee, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { Button, SectionLabel } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { api } from '../../api/client';
import type { ProductDto } from '../../api/contracts';

interface CartLine {
  product: ProductDto;
  quantity: number;
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
  const [canOrder, setCanOrder] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    void Promise.all([
      api<ProductDto[]>(`/api/self-order/menu/${encodeURIComponent(token)}`),
      api<{ enabled: boolean; mode: 'ONLINE_ORDERING' | 'QR_MENU' }>('/api/self-order/config'),
    ])
      .then(([menu, config]) => {
        setProducts(menu);
        setCanOrder(config.enabled && config.mode === 'ONLINE_ORDERING');
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

  const categories = useMemo(
    () =>
      [...new Map(products.map((product) => [product.categoryId, product.categoryName])).entries()],
    [products]
  );
  const visibleProducts = products.filter(
    (product) => activeCategory === 'all' || product.categoryId === activeCategory
  );
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce(
    (sum, line) => sum + Number(line.product.price) * line.quantity,
    0
  );

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

  const placeOrder = async () => {
    if (!cart.length) return;
    setPlacing(true);
    try {
      const order = await api<PlacedOrder>(
        `/api/self-order/order/${encodeURIComponent(token)}`,
        {
          method: 'POST',
          body: JSON.stringify({
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
      toast.success(`${order.orderNumber} was sent to the kitchen.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to place the order.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-bg text-text-muted">Loading menu…</div>;
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-6 text-center">
        <div className="font-display font-light italic text-[28px] text-text mb-10">
          Café <span className="text-gold">Étoile</span>
        </div>
        <div className="text-[14px] tracking-[0.24em] uppercase text-text-muted">Your order</div>
        <div className="font-display text-[clamp(48px,12vw,80px)] text-gold my-4">{placed.orderNumber}</div>
        <div className="w-full max-w-md space-y-4 my-8 text-left">
          {stages.map(({ label, icon: Icon }, index) => {
            const active = progress >= index + 1;
            return (
              <div key={label} className={`flex items-center gap-4 border-b border-border py-3 ${active ? 'text-text' : 'text-text-faint'}`}>
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
    <div className="min-h-screen bg-bg pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg p-4">
        <div className="font-display font-light italic text-[26px] text-text">
          Café <span className="text-gold">Étoile</span>
        </div>
        {canOrder && (
          <button onClick={() => setCartOpen(true)} className="relative border border-border p-3 text-text">
            <ShoppingCart size={18} />
            {itemCount > 0 && <span className="absolute -right-2 -top-2 bg-gold px-1.5 text-[12px] text-white">{itemCount}</span>}
          </button>
        )}
      </header>
      <main className="p-4">
        <div className="flex gap-2 overflow-x-auto mb-4">
          <button onClick={() => setActiveCategory('all')} className={`border px-4 py-2 ${activeCategory === 'all' ? 'border-gold text-gold' : 'border-border text-text-muted'}`}>All</button>
          {categories.map(([id, name]) => (
            <button key={id} onClick={() => setActiveCategory(id)} className={`border px-4 py-2 whitespace-nowrap ${activeCategory === id ? 'border-gold text-gold' : 'border-border text-text-muted'}`}>{name}</button>
          ))}
        </div>
        <SectionLabel>{visibleProducts.length} items</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {visibleProducts.map((product) => (
            <button key={product.id} onClick={() => changeQuantity(product, 1)} className="border border-border bg-surface p-4 text-left hover:border-gold">
              <div className="text-[17px] font-light text-text">{product.name}</div>
              <div className="mt-2 font-display text-[21px] text-gold">₹{Number(product.price).toLocaleString('en-IN')}</div>
              {product.description && <div className="mt-2 text-[14px] text-text-muted">{product.description}</div>}
            </button>
          ))}
        </div>
      </main>
      {!canOrder && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface p-4 text-center text-text-muted">
          View-only menu · Please order with your server
        </div>
      )}
      {canOrder && itemCount > 0 && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-0 left-0 right-0 flex justify-between bg-gold p-4 text-white">
          <span>Cart · {itemCount}</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
        </button>
      )}
      {cartOpen && (
        <div className="fixed inset-0 z-40 bg-bg p-4">
          <header className="flex items-center justify-between border-b border-border pb-4">
            <div className="font-display text-[26px] text-text">Your order</div>
            <button onClick={() => setCartOpen(false)} className="p-2 text-text-muted"><X size={20} /></button>
          </header>
          <div className="py-4">
            {cart.map((line) => (
              <div key={line.product.id} className="flex items-center gap-3 border-b border-border py-4">
                <div className="flex-1 text-[18px] text-text">{line.product.name}</div>
                <button onClick={() => changeQuantity(line.product, -1)} className="border border-border p-2"><Minus size={14} /></button>
                <span>{line.quantity}</span>
                <button onClick={() => changeQuantity(line.product, 1)} className="border border-border p-2"><Plus size={14} /></button>
                <div className="w-20 text-right font-display text-gold">₹{Number(line.product.price) * line.quantity}</div>
              </div>
            ))}
          </div>
          <div className="mt-auto border-t border-border pt-4">
            <div className="mb-4 flex justify-between text-[24px] text-text"><span>Total</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <Button fullWidth size="lg" disabled={placing || !cart.length} onClick={() => void placeOrder()}>
              {placing ? 'Placing order…' : 'Place order'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
