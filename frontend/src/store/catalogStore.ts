import { create } from 'zustand';
import { api, type PageResponse } from '../api/client';
import type {
  CategoryDto,
  CouponDto,
  CustomerDto,
  FloorDto,
  OrderDto,
  PaymentMethodDto,
  ProductDto,
  PromotionDto,
  TableDto,
  UserDto,
} from '../api/contracts';
import {
  CATEGORY_PALETTE,
  type Category,
  type Coupon,
  type Customer,
  type Employee,
  type Floor,
  type FloorTable,
  type Order,
  type PaymentMethod,
  type Product,
} from '../data/seed';

interface CatalogState {
  products: Product[];
  categories: Category[];
  tables: FloorTable[];
  floors: Floor[];
  employees: Employee[];
  coupons: Coupon[];
  paymentMethods: PaymentMethod[];
  orders: Order[];
  customers: Customer[];
  selfOrderEnabled: boolean;
  selfOrderMode: 'online' | 'qr_menu';
  selfOrderBgColor: string;
  selfOrderImages: string[];
  loading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  setSelfOrderEnabled: (value: boolean) => Promise<void>;
  setSelfOrderMode: (value: 'online' | 'qr_menu') => Promise<void>;
  setSelfOrderBgColor: (value: string) => Promise<void>;
  setSelfOrderImages: (value: string[]) => Promise<void>;
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteProducts: (ids: string[]) => Promise<void>;
  saveCategory: (category: Category) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (categories: Category[]) => void;
  saveEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  deleteEmployees: (ids: string[]) => Promise<void>;
  archiveEmployee: (id: string) => Promise<void>;
  archiveEmployees: (ids: string[]) => Promise<void>;
  changeEmployeePin: (id: string, pin: string) => Promise<void>;
  saveCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  saveTable: (table: FloorTable) => Promise<void>;
  refreshTables: () => Promise<void>;
  claimTable: (id: string) => Promise<void>;
  releaseTable: (id: string) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  addFloor: (name: string) => Promise<Floor>;
  deleteFloor: (id: string) => Promise<void>;
  savePaymentMethod: (method: PaymentMethod) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  togglePaymentMethod: (id: string) => Promise<void>;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => Promise<void>;
  saveCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

const productFromDto = (value: ProductDto): Product => ({
  id: String(value.id),
  name: value.name,
  price: Number(value.price),
  categoryId: String(value.categoryId),
  taxRate: Number(value.taxRate ?? 0),
  uom: value.unitOfMeasure === 'KG' ? 'g' : value.unitOfMeasure === 'LITRE' ? 'ml' : 'pc',
  available: true,
  description: value.description,
});
const categoryFromDto = (value: CategoryDto): Category => ({
  id: String(value.id),
  name: value.name,
  color: value.colorHex,
});
const couponFromDto = (value: CouponDto): Coupon => ({
  id: String(value.id),
  code: value.code,
  type: value.discountType === 'PERCENTAGE' ? 'percent' : 'flat',
  value: Number(value.discountValue),
  active: value.active,
  minOrder: Number(value.minOrderAmount ?? 0),
  promoType: 'manual',
});
const promotionFromDto = (value: PromotionDto): Coupon => ({
  id: `promotion-${value.id}`,
  code: value.name,
  type: value.discountType === 'PERCENTAGE' ? 'percent' : 'flat',
  value: Number(value.discountValue),
  active: value.active,
  minOrder: Number(value.minOrderAmount ?? 0),
  promoType: value.appliesTo === 'PRODUCT' ? 'auto_product' : 'auto_order',
  applyTo: value.appliesTo.toLowerCase() as 'product' | 'order',
  productId: value.productId ? String(value.productId) : undefined,
  minQty: value.minQuantity ?? undefined,
  orderThreshold: value.minOrderAmount ?? undefined,
});
const employeeFromDto = (value: UserDto): Employee => ({
  id: String(value.id),
  name: value.name,
  email: value.email,
  role: value.role,
  pin: '',
  active: value.active,
  archived: !value.active,
});
const paymentFromDto = (value: PaymentMethodDto): PaymentMethod => ({
  id: String(value.id),
  name: value.type === 'UPI' ? 'UPI QR' : value.type === 'CARD' ? 'Digital Card' : 'Cash',
  type: value.type.toLowerCase() as PaymentMethod['type'],
  enabled: value.enabled,
  upiId: value.upiId,
});
const customerFromDto = (value: CustomerDto): Customer => ({
  id: String(value.id),
  name: value.name,
  email: value.email,
  phone: value.phone ?? '',
  visits: 0,
  totalSpend: 0,
});
const orderFromDto = (
  value: OrderDto,
  tables: FloorTable[],
  employees: Employee[],
  customers: Customer[]
): Order => ({
  id: String(value.id),
  orderNum: value.orderNumber,
  tableId: value.tableId ? String(value.tableId) : null,
  tableLabel: tables.find((table) => table.id === String(value.tableId))?.label ?? null,
  status: value.status.toLowerCase() as Order['status'],
  total: Number(value.totalAmount),
  customerId: value.customerId ? String(value.customerId) : null,
  customer: customers.find((customer) => customer.id === String(value.customerId))?.name,
  employeeId: String(value.employeeId),
  employeeName: employees.find((employee) => employee.id === String(value.employeeId))?.name,
  sessionId: String(value.sessionId),
  items: value.lines.map((line) => ({
    productId: String(line.productId),
    name: line.productName,
    qty: Number(line.quantity),
    price: Number(line.unitPrice),
    discount: Number(line.discountAmount),
  })),
  createdAt: value.createdAt,
  paymentMethod: undefined,
});

const emptyPage = <T>(): PageResponse<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 0,
});

interface SelfOrderConfigDto {
  enabled: boolean;
  mode: 'ONLINE_ORDERING' | 'QR_MENU';
  backgroundColor?: string;
  backgroundImageUrl?: string;
}

const tablesFromFloors = (floorsDto: FloorDto[]): FloorTable[] =>
  floorsDto.flatMap((floor) =>
    floor.tables.map((table) => ({
      id: String(table.id),
      label: table.tableNumber,
      floorId: String(table.floorId),
      seats: table.seats,
      status: !table.active
        ? ('reserved' as const)
        : table.occupiedById
          ? ('occupied' as const)
          : ('available' as const),
      occupiedById: table.occupiedById ? String(table.occupiedById) : null,
      occupiedByName: table.occupiedByName,
    }))
  );

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  categories: [],
  tables: [],
  floors: [],
  employees: [],
  coupons: [],
  paymentMethods: [],
  orders: [],
  customers: [],
  selfOrderEnabled: false,
  selfOrderMode: 'qr_menu',
  selfOrderBgColor: '#1E3932',
  selfOrderImages: [],
  loading: false,
  hydrated: false,

  hydrate: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [productsPage, categories, floorsDto, usersPage, couponsDto, promotions, methods, customersPage, ordersPage, config] =
        await Promise.all([
          api<PageResponse<ProductDto>>('/api/products?size=500'),
          api<CategoryDto[]>('/api/categories'),
          api<FloorDto[]>('/api/floors'),
          api<PageResponse<UserDto>>('/api/users?size=500').catch(() => emptyPage<UserDto>()),
          api<CouponDto[]>('/api/coupons').catch(() => []),
          api<PromotionDto[]>('/api/promotions').catch(() => []),
          api<PaymentMethodDto[]>('/api/payment-methods'),
          api<PageResponse<CustomerDto>>('/api/customers?size=500').catch(() => emptyPage<CustomerDto>()),
          api<PageResponse<OrderDto>>('/api/orders?size=500').catch(() => emptyPage<OrderDto>()),
          api<SelfOrderConfigDto>(
            '/api/self-order/config'
          ).catch((): SelfOrderConfigDto => ({ enabled: false, mode: 'QR_MENU' })),
        ]);

      const floors = floorsDto.map((floor) => ({ id: String(floor.id), name: floor.name }));
      const tables = tablesFromFloors(floorsDto);
      const employees = usersPage.content.map(employeeFromDto);
      const customers = customersPage.content.map(customerFromDto);
      const orders = ordersPage.content.map((order) =>
        orderFromDto(order, tables, employees, customers)
      );
      const coupons: Coupon[] = [
        ...couponsDto.map(couponFromDto),
        ...promotions.map(promotionFromDto),
      ];
      set({
        products: productsPage.content.map(productFromDto),
        categories: categories.map(categoryFromDto),
        floors,
        tables,
        employees,
        coupons,
        paymentMethods: methods.map(paymentFromDto),
        customers,
        orders,
        selfOrderEnabled: config.enabled,
        selfOrderMode: config.mode === 'ONLINE_ORDERING' ? 'online' : 'qr_menu',
        selfOrderBgColor: config.backgroundColor ?? '#1E3932',
        selfOrderImages: config.backgroundImageUrl ? [config.backgroundImageUrl] : [],
        loading: false,
        hydrated: true,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  refreshOrders: async () => {
    const page = await api<PageResponse<OrderDto>>('/api/orders?size=500');
    set({
      orders: page.content.map((order) =>
        orderFromDto(order, get().tables, get().employees, get().customers)
      ),
    });
  },

  refreshTables: async () => {
    const floorsDto = await api<FloorDto[]>('/api/floors');
    set({ tables: tablesFromFloors(floorsDto) });
  },

  setSelfOrderEnabled: async (enabled) => {
    await api('/api/self-order/config', {
      method: 'PUT',
      body: JSON.stringify({
        enabled,
        mode: get().selfOrderMode === 'online' ? 'ONLINE_ORDERING' : 'QR_MENU',
        backgroundColor: get().selfOrderBgColor,
        backgroundImageUrl: get().selfOrderImages[0],
      }),
    });
    set({ selfOrderEnabled: enabled });
  },
  setSelfOrderMode: async (mode) => {
    await api('/api/self-order/config', {
      method: 'PUT',
      body: JSON.stringify({
        enabled: get().selfOrderEnabled,
        mode: mode === 'online' ? 'ONLINE_ORDERING' : 'QR_MENU',
        backgroundColor: get().selfOrderBgColor,
        backgroundImageUrl: get().selfOrderImages[0],
      }),
    });
    set({ selfOrderMode: mode });
  },
  setSelfOrderBgColor: async (backgroundColor) => {
    await api('/api/self-order/config', {
      method: 'PUT',
      body: JSON.stringify({
        enabled: get().selfOrderEnabled,
        mode: get().selfOrderMode === 'online' ? 'ONLINE_ORDERING' : 'QR_MENU',
        backgroundColor,
        backgroundImageUrl: get().selfOrderImages[0],
      }),
    });
    set({ selfOrderBgColor: backgroundColor });
  },
  setSelfOrderImages: async (images) => {
    await api('/api/self-order/config', {
      method: 'PUT',
      body: JSON.stringify({
        enabled: get().selfOrderEnabled,
        mode: get().selfOrderMode === 'online' ? 'ONLINE_ORDERING' : 'QR_MENU',
        backgroundColor: get().selfOrderBgColor,
        backgroundImageUrl: images[0] || null,
      }),
    });
    set({ selfOrderImages: images.filter(Boolean) });
  },

  saveProduct: async (product) => {
    const existing = get().products.some((item) => item.id === product.id);
    const categoryId = Number(product.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw new Error('Please select a valid category.');
    }
    const dto = await api<ProductDto>(existing ? `/api/products/${product.id}` : '/api/products', {
      method: existing ? 'PUT' : 'POST',
      body: JSON.stringify({
        name: product.name,
        categoryId,
        taxRate: product.taxRate,
        price: product.price,
        unitOfMeasure: product.uom === 'g' ? 'KG' : product.uom === 'ml' ? 'LITRE' : 'PIECE',
        description: product.description,
        showOnKds: product.available,
      }),
    });
    const saved = productFromDto(dto);
    set((state) => ({
      products: existing
        ? state.products.map((item) => (item.id === product.id ? saved : item))
        : [...state.products, saved],
    }));
  },
  deleteProduct: async (id) => {
    await api(`/api/products/${id}`, { method: 'DELETE' });
    set((state) => ({ products: state.products.filter((item) => item.id !== id) }));
  },
  deleteProducts: async (ids) => {
    await Promise.all(ids.map((id) => get().deleteProduct(id)));
  },
  saveCategory: async (category) => {
    const existing = get().categories.some((item) => item.id === category.id);
    const dto = await api<CategoryDto>(
      existing ? `/api/categories/${category.id}` : '/api/categories',
      {
        method: existing ? 'PUT' : 'POST',
        body: JSON.stringify({ name: category.name, colorHex: category.color }),
      }
    );
    const saved = categoryFromDto(dto);
    set((state) => ({
      categories: existing
        ? state.categories.map((item) => (item.id === category.id ? saved : item))
        : [...state.categories, saved],
    }));
    return saved;
  },
  deleteCategory: async (id) => {
    await api(`/api/categories/${id}`, { method: 'DELETE' });
    set((state) => ({ categories: state.categories.filter((item) => item.id !== id) }));
  },
  reorderCategories: (categories) => set({ categories }),

  saveEmployee: async (employee) => {
    const existing = get().employees.some((item) => item.id === employee.id);
    const dto = await api<UserDto>(existing ? `/api/users/${employee.id}` : '/api/users', {
      method: existing ? 'PUT' : 'POST',
      body: JSON.stringify({
        name: employee.name,
        email: employee.email,
        role: employee.role,
        ...(existing ? { active: employee.active } : { password: employee.pin }),
      }),
    });
    const saved = employeeFromDto(dto);
    set((state) => ({
      employees: existing
        ? state.employees.map((item) => (item.id === employee.id ? saved : item))
        : [...state.employees, saved],
    }));
  },
  deleteEmployee: async (id) => {
    await api(`/api/users/${id}`, { method: 'DELETE' });
    set((state) => ({ employees: state.employees.filter((item) => item.id !== id) }));
  },
  deleteEmployees: async (ids) => Promise.all(ids.map((id) => get().deleteEmployee(id))).then(() => undefined),
  archiveEmployee: async (id) => {
    const dto = await api<UserDto>(`/api/users/${id}/archive`, { method: 'PUT' });
    set((state) => ({
      employees: state.employees.map((item) => (item.id === id ? employeeFromDto(dto) : item)),
    }));
  },
  archiveEmployees: async (ids) => Promise.all(ids.map((id) => get().archiveEmployee(id))).then(() => undefined),
  changeEmployeePin: async (id, pin) => {
    await api(`/api/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password: pin }) });
  },

  saveCoupon: async (coupon) => {
    const promotion = coupon.promoType !== 'manual';
    const existing = get().coupons.some((item) => item.id === coupon.id);
    if (promotion) {
      const numericId = coupon.id.replace('promotion-', '');
      const generatedName =
        coupon.code.trim() ||
        (coupon.promoType === 'auto_product'
          ? `AUTO_PRODUCT_${coupon.productId}`
          : `AUTO_ORDER_${coupon.orderThreshold}`);
      const dto = await api<PromotionDto>(existing ? `/api/promotions/${numericId}` : '/api/promotions', {
        method: existing ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: generatedName,
          appliesTo: coupon.promoType === 'auto_product' ? 'PRODUCT' : 'ORDER',
          productId: coupon.promoType === 'auto_product' && coupon.productId
            ? Number(coupon.productId)
            : null,
          minQuantity: coupon.promoType === 'auto_product' ? coupon.minQty : null,
          minOrderAmount: coupon.promoType === 'auto_order' ? coupon.orderThreshold : null,
          discountType: coupon.type === 'percent' ? 'PERCENTAGE' : 'FIXED',
          discountValue: coupon.value,
          active: coupon.active,
        }),
      });
      const saved = promotionFromDto(dto);
      set((state) => ({
        coupons: existing
          ? state.coupons.map((item) => (item.id === coupon.id ? saved : item))
          : [...state.coupons, saved],
      }));
    } else {
      const dto = await api<CouponDto>(existing ? `/api/coupons/${coupon.id}` : '/api/coupons', {
        method: existing ? 'PUT' : 'POST',
        body: JSON.stringify({
          code: coupon.code,
          discountType: coupon.type === 'percent' ? 'PERCENTAGE' : 'FIXED',
          discountValue: coupon.value,
          minOrderAmount: coupon.minOrder,
          active: coupon.active,
        }),
      });
      const saved = couponFromDto(dto);
      set((state) => ({
        coupons: existing
          ? state.coupons.map((item) => (item.id === coupon.id ? saved : item))
          : [...state.coupons, saved],
      }));
    }
  },
  deleteCoupon: async (id) => {
    const promotion = id.startsWith('promotion-');
    await api(
      promotion ? `/api/promotions/${id.replace('promotion-', '')}` : `/api/coupons/${id}`,
      { method: 'DELETE' }
    );
    set((state) => ({ coupons: state.coupons.filter((item) => item.id !== id) }));
  },

  saveTable: async (table) => {
    const existing = get().tables.some((item) => item.id === table.id);
    const dto = await api<TableDto>(
      existing ? `/api/tables/${table.id}` : `/api/floors/${table.floorId}/tables`,
      {
        method: existing ? 'PUT' : 'POST',
        body: JSON.stringify({
          tableNumber: table.label,
          seats: table.seats,
          active: table.status !== 'reserved',
        }),
      }
    );
    const saved: FloorTable = {
      id: String(dto.id),
      floorId: String(dto.floorId),
      label: dto.tableNumber,
      seats: dto.seats,
      status: !dto.active ? 'reserved' : dto.occupiedById ? 'occupied' : 'available',
      occupiedById: dto.occupiedById ? String(dto.occupiedById) : null,
      occupiedByName: dto.occupiedByName,
    };
    set((state) => ({
      tables: existing
        ? state.tables.map((item) => (item.id === table.id ? saved : item))
        : [...state.tables, saved],
    }));
  },
  claimTable: async (id) => {
    const dto = await api<TableDto>(`/api/tables/${id}/claim`, { method: 'POST' });
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === id
          ? {
              ...table,
              status: 'occupied',
              occupiedById: dto.occupiedById ? String(dto.occupiedById) : null,
              occupiedByName: dto.occupiedByName,
            }
          : table
      ),
    }));
  },
  releaseTable: async (id) => {
    await api<TableDto>(`/api/tables/${id}/release`, { method: 'POST' });
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === id
          ? { ...table, status: 'available', occupiedById: null, occupiedByName: null }
          : table
      ),
    }));
  },
  deleteTable: async (id) => {
    await api(`/api/tables/${id}`, { method: 'DELETE' });
    set((state) => ({ tables: state.tables.filter((item) => item.id !== id) }));
  },
  addFloor: async (name) => {
    const dto = await api<FloorDto>('/api/floors', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    const floor = { id: String(dto.id), name: dto.name };
    set((state) => ({ floors: [...state.floors, floor] }));
    return floor;
  },
  deleteFloor: async (id) => {
    await api(`/api/floors/${id}`, { method: 'DELETE' });
    set((state) => ({
      floors: state.floors.filter((floor) => floor.id !== id),
      tables: state.tables.filter((table) => table.floorId !== id),
    }));
  },

  savePaymentMethod: async (method) => {
    const dto = await api<PaymentMethodDto>(`/api/payment-methods/${method.id}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled: method.enabled, upiId: method.upiId }),
    });
    set((state) => ({
      paymentMethods: state.paymentMethods.map((item) =>
        item.id === method.id ? paymentFromDto(dto) : item
      ),
    }));
  },
  deletePaymentMethod: async () => undefined,
  togglePaymentMethod: async (id) => {
    const method = get().paymentMethods.find((item) => item.id === id);
    if (method) await get().savePaymentMethod({ ...method, enabled: !method.enabled });
  },

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (id, patch) =>
    set((state) => ({ orders: state.orders.map((order) => (order.id === id ? { ...order, ...patch } : order)) })),
  deleteOrder: async (id) => {
    await api(`/api/orders/${id}`, { method: 'DELETE' });
    set((state) => ({ orders: state.orders.filter((order) => order.id !== id) }));
  },
  saveCustomer: async (customer) => {
    const existing = get().customers.some((item) => item.id === customer.id);
    const dto = await api<CustomerDto>(existing ? `/api/customers/${customer.id}` : '/api/customers', {
      method: existing ? 'PUT' : 'POST',
      body: JSON.stringify({ name: customer.name, email: customer.email, phone: customer.phone }),
    });
    const saved = customerFromDto(dto);
    set((state) => ({
      customers: existing
        ? state.customers.map((item) => (item.id === customer.id ? saved : item))
        : [...state.customers, saved],
    }));
  },
  deleteCustomer: async (id) => {
    await api(`/api/customers/${id}`, { method: 'DELETE' });
    set((state) => ({ customers: state.customers.filter((item) => item.id !== id) }));
  },
}));

export function categoryName(categories: Category[], id: string): string {
  return categories.find((category) => category.id === id)?.name ?? 'Uncategorised';
}

export function categoryColor(categories: Category[], id: string): string {
  return categories.find((category) => category.id === id)?.color ?? CATEGORY_PALETTE[0];
}
