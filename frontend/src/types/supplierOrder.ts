export const SupplierOrderStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  RECEIVED: 'received',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  APPROVED: 'approved',
  PAID: 'paid'
} as const;

export type SupplierOrderStatus = typeof SupplierOrderStatus[keyof typeof SupplierOrderStatus];

export interface SupplierOrderInvoice {
  id: string;
  [key: string]: any;
  supplierName?: string;
  invoiceNumber?: string;
  orderDate?: Date | string;
  dueDate?: Date | string;
  status?: SupplierOrderStatus;
  items?: any;
  subtotal?: number;
  tax?: number;
  total?: number;
}

export interface BusinessExpense {
  id: string;
  [key: string]: any;
  date?: string;
  category?: string;
  description?: string;
  amount?: number;
  paymentMethod?: string;
  receipt?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'paid';
}

export interface StockMovement {
  id: string;
  [key: string]: any;
  productId: string;
  productName: string;
  item?: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
}
