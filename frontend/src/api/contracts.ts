export interface CategoryDto {
  id: number;
  name: string;
  colorHex: string;
}

export interface ProductDto {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  taxId: number | null;
  taxRate: number | null;
  price: number;
  unitOfMeasure: 'PIECE' | 'KG' | 'LITRE';
  description?: string;
  showOnKds: boolean;
}

export interface TableDto {
  id: number;
  floorId: number;
  tableNumber: string;
  seats: number;
  active: boolean;
  occupiedById: number | null;
  occupiedByName: string | null;
}

export interface FloorDto {
  id: number;
  name: string;
  tables: TableDto[];
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  active: boolean;
}

export interface CouponDto {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number | null;
  active: boolean;
}

export interface PromotionDto {
  id: number;
  name: string;
  appliesTo: 'PRODUCT' | 'ORDER';
  productId: number | null;
  minQuantity: number | null;
  minOrderAmount: number | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  active: boolean;
}

export interface PaymentMethodDto {
  id: number;
  type: 'CASH' | 'CARD' | 'UPI';
  enabled: boolean;
  upiId?: string;
}

export interface CustomerDto {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface SessionDto {
  id: number;
  employeeId: number;
  employeeName: string;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  status: 'OPEN' | 'CLOSED';
}

export interface SessionSummaryDto {
  session: SessionDto;
  totalOrders: number;
  revenue: number;
  expectedCash: number;
}

export interface OrderLineDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
  kdsStatus: 'TO_COOK' | 'PREPARING' | 'COMPLETED';
}

export interface OrderDto {
  id: number;
  orderNumber: string;
  sessionId: number;
  tableId: number | null;
  customerId: number | null;
  employeeId: number;
  status: 'DRAFT' | 'PAID' | 'CANCELLED';
  sentToKitchen: boolean;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  totalAmount: number;
  createdAt: string;
  lines: OrderLineDto[];
  payments: Array<{
    id: number;
    paymentMethodId: number;
    amount: number;
    referenceNumber?: string;
    status: string;
    paidAt: string;
  }>;
}

export interface KdsTicketDto {
  orderId: number;
  orderNumber: string;
  tableNumber: string | null;
  employeeId: number;
  stage: 'TO_COOK' | 'PREPARING' | 'COMPLETED';
  createdAt: string;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    status: 'TO_COOK' | 'PREPARING' | 'COMPLETED';
  }>;
}
