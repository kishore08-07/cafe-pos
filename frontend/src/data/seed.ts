export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  taxRate: number;
  uom: 'pc' | 'g' | 'ml';
  available: boolean;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  sortOrder?: number;
}

export interface FloorTable {
  id: string;
  label: string;
  floorId: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  occupiedById?: string | null;
  occupiedByName?: string | null;
  token?: string;
}

export interface Floor {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  pin: string;
  active: boolean;
  archived?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  active: boolean;
  minOrder: number;
  promoType: 'manual' | 'auto_product' | 'auto_order';
  applyTo?: 'product' | 'order';
  productId?: string;
  minQty?: number;
  orderThreshold?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'upi';
  enabled: boolean;
  upiId?: string;
}

export interface Order {
  id: string;
  orderNum: string;
  tableId?: string | null;
  tableLabel: string | null;
  status: 'draft' | 'paid' | 'cancelled';
  total: number;
  customerId?: string | null;
  customer?: string;
  employeeId?: string;
  employeeName?: string;
  sessionId?: string;
  items: { productId?: string; name: string; qty: number; price: number; discount?: number }[];
  createdAt: string;
  paymentMethod?: 'cash' | 'card' | 'upi';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  visits: number;
  totalSpend: number;
}

export const CATEGORY_PALETTE = [
  '#006241', // coffee green
  '#D97706', // toasted orange
  '#2563A6', // cold-drink blue
  '#C2416C', // pastry berry
  '#7C3AED', // violet
  '#0F766E', // teal
  '#B45309', // caramel
  '#BE123C', // cherry
] as const;

export const TAX_RATES = [5, 18, 28] as const;

export const categoriesSeed: Category[] = [
  { id: 'c-coffee', name: 'Coffee', color: CATEGORY_PALETTE[0], sortOrder: 0 },
  { id: 'c-food', name: 'Food', color: CATEGORY_PALETTE[1], sortOrder: 1 },
  { id: 'c-cold', name: 'Cold', color: CATEGORY_PALETTE[2], sortOrder: 2 },
  { id: 'c-pastry', name: 'Pastry', color: CATEGORY_PALETTE[3], sortOrder: 3 },
];

export const productsSeed: Product[] = [
  { id: 'p-fw', name: 'Flat White', price: 180, categoryId: 'c-coffee', taxRate: 5, uom: 'pc', available: true, description: 'Velvety steamed milk over a double ristretto.' },
  { id: 'p-capp', name: 'Cappuccino', price: 160, categoryId: 'c-coffee', taxRate: 5, uom: 'pc', available: true, description: 'Classic Italian espresso with dense milk foam.' },
  { id: 'p-esp', name: 'Espresso', price: 120, categoryId: 'c-coffee', taxRate: 5, uom: 'pc', available: true, description: 'Concentrated shot of coffee.' },
  { id: 'p-lat', name: 'Latte', price: 200, categoryId: 'c-coffee', taxRate: 5, uom: 'pc', available: true, description: 'Espresso with steamed milk and light foam.' },
  { id: 'p-mocha', name: 'Mocha', price: 220, categoryId: 'c-coffee', taxRate: 5, uom: 'pc', available: true, description: 'Espresso with chocolate and steamed milk.' },
  { id: 'p-avo', name: 'Avocado Toast', price: 320, categoryId: 'c-food', taxRate: 5, uom: 'pc', available: true, description: 'Smashed avocado on sourdough.' },
  { id: 'p-egg', name: 'Eggs Benedict', price: 380, categoryId: 'c-food', taxRate: 5, uom: 'pc', available: true, description: 'Poached eggs on English muffin with hollandaise.' },
  { id: 'p-croque', name: 'Croque Madame', price: 340, categoryId: 'c-food', taxRate: 5, uom: 'pc', available: true, description: 'Classic French grilled ham & cheese with fried egg.' },
  { id: 'p-cb', name: 'Cold Brew', price: 220, categoryId: 'c-cold', taxRate: 5, uom: 'ml', available: true, description: 'Slow-steeped for 20 hours.' },
  { id: 'p-iced', name: 'Iced Latte', price: 210, categoryId: 'c-cold', taxRate: 5, uom: 'ml', available: true, description: 'Chilled espresso over ice with cold milk.' },
  { id: 'p-croissant', name: 'Butter Croissant', price: 140, categoryId: 'c-pastry', taxRate: 5, uom: 'pc', available: true, description: 'Flaky, buttery French pastry.' },
  { id: 'p-pain', name: 'Pain au Chocolat', price: 160, categoryId: 'c-pastry', taxRate: 5, uom: 'pc', available: true, description: 'Chocolate-filled croissant pastry.' },
];

export const floorsSeed: Floor[] = [
  { id: 'f-main', name: 'Main Floor' },
  { id: 'f-terrace', name: 'Terrace' },
];

export const tablesSeed: FloorTable[] = [
  { id: 't-01', label: '01', floorId: 'f-main', seats: 2, status: 'available', token: 'tbl-01-a1b2' },
  { id: 't-02', label: '02', floorId: 'f-main', seats: 2, status: 'available', token: 'tbl-02-c3d4' },
  { id: 't-03', label: '03', floorId: 'f-main', seats: 4, status: 'occupied', token: 'tbl-03-e5f6' },
  { id: 't-04', label: '04', floorId: 'f-main', seats: 4, status: 'occupied', token: 'tbl-04-g7h8' },
  { id: 't-05', label: '05', floorId: 'f-main', seats: 6, status: 'available', token: 'tbl-05-i9j0' },
  { id: 't-06', label: '06', floorId: 'f-main', seats: 2, status: 'reserved', token: 'tbl-06-k1l2' },
  { id: 't-07', label: '07', floorId: 'f-terrace', seats: 4, status: 'available', token: 'tbl-07-m3n4' },
  { id: 't-08', label: '08', floorId: 'f-terrace', seats: 4, status: 'available', token: 'tbl-08-o5p6' },
  { id: 't-09', label: '09', floorId: 'f-terrace', seats: 8, status: 'occupied', token: 'tbl-09-q7r8' },
];

export const employeesSeed: Employee[] = [
  { id: 'e-01', name: 'Amara Singh', email: 'amara@cafeetoile.test', role: 'ADMIN', pin: '1111', active: true, archived: false },
  { id: 'e-02', name: 'Léa Moreau', email: 'lea@cafeetoile.test', role: 'EMPLOYEE', pin: '2222', active: true, archived: false },
  { id: 'e-03', name: 'Ravi Kumar', email: 'ravi@cafeetoile.test', role: 'EMPLOYEE', pin: '3333', active: true, archived: false },
];

export const couponsSeed: Coupon[] = [
  { id: 'cp-01', code: 'WELCOME10', type: 'percent', value: 10, active: true, minOrder: 0, promoType: 'manual' },
  { id: 'cp-02', code: 'FLAT100', type: 'flat', value: 100, active: true, minOrder: 500, promoType: 'manual' },
  { id: 'cp-03', code: 'WEEKEND15', type: 'percent', value: 15, active: false, minOrder: 800, promoType: 'manual' },
  { id: 'cp-04', code: 'AUTO_ORDER_500', type: 'percent', value: 5, active: true, minOrder: 0, promoType: 'auto_order', applyTo: 'order', orderThreshold: 500 },
];

export const paymentMethodsSeed: PaymentMethod[] = [
  { id: 'pm-cash', name: 'Cash', type: 'cash', enabled: true },
  { id: 'pm-card', name: 'Digital Card', type: 'card', enabled: true },
  { id: 'pm-upi', name: 'UPI QR', type: 'upi', enabled: true, upiId: 'cafeetoile@upi' },
];

export const customersSeed: Customer[] = [
  { id: 'cu-01', name: 'Priya Nair', phone: '+91 98765 43210', email: 'priya@example.test', visits: 14, totalSpend: 12450 },
  { id: 'cu-02', name: 'Marc Dubois', phone: '+91 99887 76655', visits: 6, totalSpend: 4280 },
  { id: 'cu-03', name: 'Ananya Roy', phone: '+91 90123 45678', email: 'ananya@example.test', visits: 22, totalSpend: 19800 },
];

export const ordersSeed: Order[] = [
  {
    id: 'o-0047', orderNum: '#0047', tableLabel: '04', status: 'paid', total: 945,
    items: [{ name: 'Flat White', qty: 2, price: 180 }, { name: 'Avocado Toast', qty: 1, price: 320 }, { name: 'Cold Brew', qty: 1, price: 220 }],
    createdAt: '2026-06-20T10:24:00Z', paymentMethod: 'upi', employeeName: 'Amara Singh',
  },
  {
    id: 'o-0046', orderNum: '#0046', tableLabel: '03', status: 'paid', total: 560,
    items: [{ name: 'Cappuccino', qty: 2, price: 160 }, { name: 'Butter Croissant', qty: 1, price: 140 }],
    createdAt: '2026-06-20T10:02:00Z', paymentMethod: 'cash', employeeName: 'Léa Moreau',
  },
  {
    id: 'o-0045', orderNum: '#0045', tableLabel: null, status: 'draft', total: 420,
    items: [{ name: 'Eggs Benedict', qty: 1, price: 380 }, { name: 'Espresso', qty: 1, price: 120 }],
    createdAt: '2026-06-20T09:48:00Z', employeeName: 'Amara Singh',
  },
  {
    id: 'o-0044', orderNum: '#0044', tableLabel: '09', status: 'cancelled', total: 840,
    items: [{ name: 'Mocha', qty: 2, price: 220 }, { name: 'Pain au Chocolat', qty: 2, price: 160 }],
    createdAt: '2026-06-19T18:15:00Z', employeeName: 'Ravi Kumar',
  },
];
