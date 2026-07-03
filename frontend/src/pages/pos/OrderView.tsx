import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, X, ShoppingCart, Send, UserPlus, Tag, Percent } from 'lucide-react';
import { SectionLabel, Button, Badge, Input, Select } from '../../components/ui';
import { FloorPopup } from './FloorPopup';
import { useCatalogStore, categoryColor } from '../../store/catalogStore';
import { useCartStore, cartTotals } from '../../store/cartStore';
import { toast } from '../../components/ui/Toast';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { api } from '../../api/client';
import type { OrderDto } from '../../api/contracts';
import { useSessionStore } from '../../store/sessionStore';

export function OrderView() {
  const navigate = useNavigate();
  const { products, categories, coupons } = useCatalogStore();
  const { orderId, items, tableId, tableLabel, customer, coupon, addItem, updateQty, removeItem, setTable, setOrder, applyCoupon, applyItemDiscount, clearCart } = useCartStore();
  const refreshOrders = useCatalogStore((s) => s.refreshOrders);
  const sessionId = useSessionStore((s) => s.sessionId);

  const isMobile = useMediaQuery('(max-width: 899px)');
  const [floorOpen, setFloorOpen] = useState(!tableId);
  const [activeCat, setActiveCat] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discItemId, setDiscItemId] = useState('');
  const [discType, setDiscType] = useState<'percent' | 'flat'>('percent');
  const [discValue, setDiscValue] = useState('');

  useEffect(() => {
    if (!tableId) setFloorOpen(true);
  }, [tableId]);

  // Auto-surface automated promotions
  useEffect(() => {
    const autoPromos = coupons.filter((c) => c.active && c.promoType !== 'manual');
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    for (const promo of autoPromos) {
      if (promo.promoType === 'auto_order' && promo.orderThreshold && subtotal >= promo.orderThreshold && !coupon) {
        applyCoupon({ code: promo.code, type: promo.type, value: promo.value });
        toast.success(`Auto promotion "${promo.code}" applied!`);
        break;
      }
      if (promo.promoType === 'auto_product' && promo.productId && promo.minQty) {
        const cartItem = items.find((i) => i.id === promo.productId);
        if (cartItem && cartItem.qty >= promo.minQty && !coupon) {
          applyCoupon({ code: promo.code, type: promo.type, value: promo.value });
          toast.success(`Auto promotion "${promo.code}" applied!`);
          break;
        }
      }
    }
  }, [items, coupons, coupon, applyCoupon]);

  const filtered = useMemo(
    () => products.filter((p) => p.available && (activeCat === 'all' || p.categoryId === activeCat)),
    [products, activeCat]
  );
  const availableCoupons = useMemo(
    () => coupons.filter((item) => item.active && item.promoType === 'manual'),
    [coupons]
  );
  const totals = useMemo(() => cartTotals(items, coupon), [items, coupon]);

  const saveDraft = async () => {
    if (!sessionId) throw new Error('Open a POS session first.');
    const order = await api<OrderDto>(
      `/api/orders?sessionId=${sessionId}${tableId ? `&tableId=${tableId}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderId ? Number(orderId) : null,
          customerId: customer ? Number(customer.id) : null,
          lines: items.map((item) => ({ productId: Number(item.id), quantity: item.qty })),
        }),
      }
    );
    setOrder(String(order.id), order.orderNumber);
    return order;
  };

  const sendToKitchen = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty.');
      return;
    }
    try {
      const draft = await saveDraft();
      await api(`/api/orders/${draft.id}/send-kitchen`, { method: 'POST' });
      await refreshOrders();
      toast.success(`${draft.orderNumber} sent to kitchen.`);
      setCartOpen(false);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to send order.');
    }
  };

  const applyCouponCode = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error('Enter a coupon code.');
      return;
    }
    try {
      const validation = await api<{ type: 'PERCENTAGE' | 'FIXED'; value: number }>(
        '/api/coupons/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code, orderTotal: totals.subtotal }),
        }
      );
      applyCoupon({
        code,
        type: validation.type === 'PERCENTAGE' ? 'percent' : 'flat',
        value: Number(validation.value),
      });
      toast.success(`Coupon ${code} applied.`);
      setCouponOpen(false);
      setCouponCode('');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Invalid coupon.');
    }
  };

  const applyDiscount = () => {
    if (!discItemId || !discValue) return;
    applyItemDiscount(discItemId, discType, Number(discValue));
    toast.success('Product discount applied.');
    setDiscountOpen(false);
    setDiscItemId('');
    setDiscValue('');
  };

  const CartContents = () => (
    <>
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <span className="text-[14px] tracking-[0.22em] uppercase font-extralight text-text-muted">
          {tableLabel ? `Order · Table ${tableLabel}` : 'Order · Takeaway'}
        </span>
        {customer && <Badge variant="gold">{customer.name}</Badge>}
      </div>
      {items.length === 0 ? (
        <p className="text-[17px] font-light text-text-faint py-8 text-center">No items yet. Tap a product to add it.</p>
      ) : (
        <div className="flex flex-col">
          {items.map((i) => (
            <div key={i.id} className="py-3 border-b border-border">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-x-2 gap-y-3">
                <div className="min-w-0">
                  <div className="text-[17px] font-light leading-snug text-text break-words">{i.name}</div>
                  <div className="mt-1 text-[15px] font-extralight text-text-faint">₹{i.price} each</div>
                </div>
                <div className="min-w-[4rem] pt-0.5 text-right font-display text-[18px] text-text">
                  ₹{i.price * i.qty}
                </div>
                <button onClick={() => removeItem(i.id)} className="w-9 h-9 flex items-center justify-center text-text-faint hover:text-cancel" aria-label={`Remove ${i.name}`}><Trash2 size={13} /></button>
                <div className="col-span-3 flex items-center justify-end gap-1.5">
                  <button onClick={() => updateQty(i.id, i.qty - 1)} className="w-9 h-9 flex items-center justify-center border border-border text-text-muted hover:border-gold hover:text-gold transition-colors" aria-label="Decrease"><Minus size={13} /></button>
                  <span className="w-7 text-center text-[17px] font-light text-text">{i.qty}</span>
                  <button onClick={() => updateQty(i.id, i.qty + 1)} className="w-9 h-9 flex items-center justify-center border border-border text-text-muted hover:border-gold hover:text-gold transition-colors" aria-label="Increase"><Plus size={13} /></button>
                </div>
              </div>
              {/* Product-level discount display */}
              {i.discount && i.discount > 0 && (
                <div className="mt-1 text-[14px] font-light text-cancel pl-1">
                  Discount: −₹{i.discount} ({i.discountType === 'percent' ? `${i.discountValue}%` : `₹${i.discountValue}`})
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="mt-auto pt-4 border-t border-[rgba(0,117,74,0.2)]">
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-[14px] tracking-[0.12em] uppercase font-extralight text-text-muted">Subtotal</span><span className="font-display text-[17px] text-text-muted">₹{totals.subtotal}</span></div>
            {totals.itemDiscounts > 0 && (
              <div className="flex justify-between"><span className="text-[14px] tracking-[0.12em] uppercase font-extralight text-text-muted">Item discounts</span><span className="font-display text-[17px] text-cancel">−₹{totals.itemDiscounts}</span></div>
            )}
            <div className="flex justify-between"><span className="text-[14px] tracking-[0.12em] uppercase font-extralight text-text-muted">GST 5%</span><span className="font-display text-[17px] text-text-muted">₹{totals.gst}</span></div>
            {totals.orderDiscount > 0 && (
              <div className="flex justify-between"><span className="text-[14px] tracking-[0.12em] uppercase font-extralight text-text-muted">Discount ({coupon?.code})</span><span className="font-display text-[17px] text-cancel">−₹{totals.orderDiscount}</span></div>
            )}
          </div>
          <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-border">
            <span className="text-[14px] tracking-[0.22em] uppercase font-extralight text-gold">Total</span>
            <span className="font-display text-[28px] text-text">₹{totals.total}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/pos/customers')}><UserPlus size={13} /> {customer ? 'Change' : 'Customer'}</Button>
            <Button variant="ghost" size="sm" onClick={() => setDiscountOpen(!discountOpen)}><Percent size={13} /> Discount</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const opening = !couponOpen;
                setCouponOpen(opening);
                if (opening) {
                  const appliedCouponAvailable = availableCoupons.some(
                    (item) => item.code === coupon?.code
                  );
                  setCouponCode(appliedCouponAvailable ? coupon?.code ?? '' : '');
                }
              }}
            >
              <Tag size={13} /> {coupon ? coupon.code : 'Coupon'}
            </Button>
          </div>
          {/* Discount popup */}
          {discountOpen && (
            <div className="mt-3 p-3 border border-border space-y-3">
              <div className="text-[14px] tracking-[0.18em] uppercase font-extralight text-text-muted">Product-level discount</div>
              <Select label="Item" value={discItemId} onChange={(e) => setDiscItemId(e.target.value)}>
                <option value="">Select item</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Select label="Type" value={discType} onChange={(e) => setDiscType(e.target.value as 'percent' | 'flat')}>
                  <option value="percent">%</option>
                  <option value="flat">₹</option>
                </Select>
                <Input label="Value" type="number" value={discValue} onChange={(e) => setDiscValue(e.target.value)} placeholder="10" />
              </div>
              <Button size="sm" onClick={applyDiscount}>Apply</Button>
            </div>
          )}
          {couponOpen && (
            availableCoupons.length > 0 ? (
              <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                <Select
                  label="Available coupons"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                >
                  <option value="">Select a coupon</option>
                  {availableCoupons.map((item) => (
                    <option key={item.id} value={item.code}>
                      {item.code} — {item.type === 'percent' ? `${item.value}% off` : `₹${item.value} off`}
                      {item.minOrder > 0 ? ` (min ₹${item.minOrder})` : ''}
                    </option>
                  ))}
                </Select>
                <Button className="shrink-0" size="sm" disabled={!couponCode} onClick={applyCouponCode}>Apply</Button>
              </div>
            ) : (
              <p className="mt-3 text-[15px] font-light text-text-faint">No coupons are currently available.</p>
            )
          )}
          <Button fullWidth size="lg" className="mt-4" variant="ghost" onClick={sendToKitchen}><Send size={14} /> Send to kitchen</Button>
          <Button fullWidth size="lg" className="mt-2" onClick={() => navigate('/pos/payment')}>Charge ₹{totals.total}</Button>
        </div>
      )}
    </>
  );

  const CartPanel = ({ className = '' }: { className?: string }) => (
    <div className={`flex min-w-0 flex-col h-full overflow-y-auto p-5 ${className}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <CartContents />
    </div>
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
      <FloorPopup open={floorOpen} onClose={() => setFloorOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveCat('all')} className={`px-3.5 py-2 text-[15px] font-semibold whitespace-nowrap min-h-[40px] border bg-transparent ${activeCat === 'all' ? 'text-text border-text' : 'text-text-muted border-border'}`}>All</button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className="px-3.5 py-2 text-[15px] font-semibold whitespace-nowrap min-h-[40px] border bg-transparent flex items-center gap-2"
                style={{
                  color: activeCat === c.id ? 'var(--text)' : 'var(--text-muted)',
                  borderColor: c.color,
                  borderWidth: activeCat === c.id ? 2 : 1,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setTable('', ''); clearCart(); setFloorOpen(true); }} disabled={!tableId}>
            <ShoppingCart size={13} /> {tableLabel ? `Table ${tableLabel}` : 'Select table'}
          </Button>
        </div>
        <SectionLabel>{filtered.length} products</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 overflow-y-auto pb-24 lg:pb-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addItem({ id: p.id, name: p.name, price: p.price, categoryColor: categoryColor(categories, p.categoryId) })}
              className="border border-border p-3.5 text-left transition-colors hover:border-[rgba(0,117,74,0.35)]"
              style={{ background: 'var(--surface-raised)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="block w-5 h-0.5 opacity-60" style={{ background: categoryColor(categories, p.categoryId) }} />
                {/* Availability dot indicator */}
                <span className={`w-2.5 h-2.5 rounded-full ${p.available ? 'bg-paid' : 'bg-cancel'}`} title={p.available ? 'In stock' : 'Out of stock'} />
              </div>
              <span className="block text-[16px] font-light text-text leading-snug mb-1.5">{p.name}</span>
              <span className="block font-display text-[19px] text-text">₹{p.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop cart */}
      {!isMobile && (
        <div className="min-w-0 w-[380px] shrink-0 p-4 sm:p-6 pl-0">
          <CartPanel className="h-full" />
        </div>
      )}

      {/* Mobile sticky bar */}
      {isMobile && items.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 border-t border-[rgba(0,117,74,0.3)] text-[#1E3932]"
          style={{ background: '#00754A' }}
        >
          <span className="flex items-center gap-2 text-[16px] tracking-[0.18em] uppercase font-medium"><ShoppingCart size={16} /> View cart · {items.length}</span>
          <span className="font-display text-[18px]">₹{totals.total}</span>
        </button>
      )}

      {/* Mobile cart overlay */}
      {isMobile && cartOpen && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] flex flex-col border-t border-border" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-display font-light italic text-[22px] text-text">Cart</span>
              <button onClick={() => setCartOpen(false)} className="text-text-faint hover:text-gold p-2 min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col">
              <CartContents />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
