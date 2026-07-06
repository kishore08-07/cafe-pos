import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  taxRate?: number;
  categoryColor?: string;
  notes?: string;
  discount?: number;
  discountType?: 'percent' | 'flat';
  discountValue?: number;
}

interface CartState {
  orderId: string | null;
  orderNumber: string | null;
  tableId: string | null;
  tableLabel: string | null;
  customer: { id: string; name: string } | null;
  coupon: { code: string; type: 'percent' | 'flat'; value: number } | null;
  items: CartItem[];
  setOrder: (id: string, orderNumber: string) => void;
  setTable: (id: string, label: string) => void;
  setCustomer: (c: { id: string; name: string } | null) => void;
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  applyCoupon: (c: CartState['coupon']) => void;
  applyItemDiscount: (id: string, type: 'percent' | 'flat', value: number) => void;
  clearCart: () => void;
  loadOrder: (
    items: CartItem[],
    tableId: string | null,
    tableLabel: string | null,
    customer: { id: string; name: string } | null,
    orderId?: string,
    orderNumber?: string
  ) => void;
}

export const useCartStore = create<CartState>((set) => ({
  orderId: null,
  orderNumber: null,
  tableId: null,
  tableLabel: null,
  customer: null,
  coupon: null,
  items: [],
  setOrder: (orderId, orderNumber) => set({ orderId, orderNumber }),
  setTable: (tableId, tableLabel) => set({ tableId, tableLabel }),
  setCustomer: (customer) => set({ customer }),
  addItem: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { items: [...s.items, { ...item, qty: 1 }] };
    }),
  updateQty: (id, qty) =>
    set((s) => ({
      items:
        qty <= 0
          ? s.items.filter((i) => i.id !== id)
          : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
    })),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  applyCoupon: (coupon) => set({ coupon }),
  applyItemDiscount: (id, type, value) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.id !== id) return i;
        const disc =
          type === 'percent'
            ? Math.round((i.price * i.qty * value) / 100)
            : Math.min(value, i.price * i.qty);
        return { ...i, discount: disc, discountType: type, discountValue: value };
      }),
    })),
  clearCart: () =>
    set({ orderId: null, orderNumber: null, items: [], customer: null, coupon: null }),
  loadOrder: (items, tableId, tableLabel, customer, orderId = undefined, orderNumber = undefined) =>
    set({
      items,
      tableId,
      tableLabel,
      customer,
      coupon: null,
      orderId: orderId ?? null,
      orderNumber: orderNumber ?? null,
    }),
}));

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function cartItemDiscounts(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + (i.discount ?? 0), 0);
}

function lineTax(line: CartItem): number {
  const lineTotal = line.price * line.qty;
  const taxable = Math.max(0, lineTotal - (line.discount ?? 0));
  return Math.round((taxable * (line.taxRate ?? 0)) / 100);
}

export function cartTotals(items: CartItem[], coupon: CartState['coupon']) {
  const subtotal = cartSubtotal(items);
  const itemDiscounts = cartItemDiscounts(items);
  const afterItemDisc = Math.max(0, subtotal - itemDiscounts);
  const grossTax = items.reduce((sum, item) => sum + lineTax(item), 0);
  let orderDiscount = 0;
  if (coupon) {
    orderDiscount =
      coupon.type === 'percent'
        ? Math.round((afterItemDisc * coupon.value) / 100)
        : Math.min(coupon.value, afterItemDisc);
  }
  const netSubtotal = Math.max(0, afterItemDisc - orderDiscount);
  const gst = afterItemDisc > 0 ? Math.round((grossTax * netSubtotal) / afterItemDisc) : 0;
  const total = netSubtotal + gst;
  return { subtotal, itemDiscounts, gst, orderDiscount, total };
}
