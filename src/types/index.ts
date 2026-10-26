export type Role = 'admin' | 'manager' | 'sales' | 'inventory' | 'purchase' | 'viewer';
export type UserRole = Role;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar_url?: string;
  created_at: string;
}

export interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  decimal_precision: number;
  is_active: boolean;
  is_default: boolean;
}

export interface BusinessSettings {
  id: string;
  brand_name: string;
  brand_logo: string;
  company_name?: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  tax_id: string; // GSTIN / Tax ID
  tax_identifier?: string;
  default_currency_code: string;
  currency_code?: string;
  currency_symbol?: string;
  allow_negative_stock: boolean;
  low_stock_threshold: number;
  default_tax_rate?: number;
  invoice_prefix: string;
  order_prefix: string;
  purchase_prefix: string;
  terms_and_conditions: string;
  updated_at: string;
}

export interface SalesChannel {
  id: string;
  name: string;
  channel_name?: string;
  code: string;
  is_active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  created_at: string;
  updated_at: string;
}

export type ProductType = 'single' | 'variant';

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string; // e.g. "Size: L, Color: Blue"
  sku: string;
  barcode?: string;
  units: number;
  buy_price: number;
  selling_price: number;
  mrp: number;
  discount: number; // percentage
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sourcing_agency: string;
  item_type: ProductType;
  sku: string;
  barcode?: string;
  units: number;
  buy_price: number;
  selling_price: number;
  mrp: number;
  discount: number; // percentage
  images: string[];
  is_archived: boolean;
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export type MovementType = 'sale' | 'purchase' | 'return' | 'adjustment' | 'cancellation';

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  sku: string;
  movement_type: MovementType;
  quantity_changed: number; // negative for deduction, positive for addition
  balance_after: number;
  reference_id?: string; // Order ID, Purchase ID, etc.
  reference_number?: string;
  reason: string;
  created_at: string;
  created_by: string;
}

export type OrderStatus = 'Received' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  sku: string;
  quantity: number;
  rate: number;
  discount: number; // percent
  tax_rate?: number;
  line_total: number;
  subtotal?: number;
}

export type OrderLineItem = OrderItem;

export interface Order {
  id: string;
  order_number: string; // "000001"
  order_date: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: PaymentMethod;
  sales_channel_id: string;
  sales_channel_name: string;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  total_discount?: number;
  tax_total: number;
  total_amount: number;
  currency_code: string;
  currency_symbol: string;
  is_invoiced: boolean;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  product_name: string;
  variant_name?: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  subtotal?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string; // "INV-000001"
  invoice_date: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address?: string;
  payment_method: PaymentMethod;
  sales_channel_name: string;
  items: InvoiceItem[];
  subtotal: number;
  discount_total: number;
  total_discount?: number;
  tax_total: number;
  tax_amount?: number;
  total_amount: number;
  currency_code: string;
  currency_symbol: string;
  currency?: string;
  status: 'Issued' | 'Paid' | 'Cancelled';
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id?: string;
  product_id: string;
  variant_id?: string;
  item_name?: string;
  product_name: string;
  variant_name?: string;
  sku: string;
  quantity: number;
  purchased_price?: number;
  unit_cost?: number;
  gst_amount?: number;
  delivery_charge?: number;
  total_line?: number;
  total_cost?: number;
}

export interface Purchase {
  id: string;
  purchase_number?: string; // "PO-000001"
  po_number: string;
  purchase_date?: string;
  order_date: string;
  expected_delivery_date?: string;
  sourcing_agency?: string;
  vendor_name: string;
  vendor_contact?: string;
  item_count?: number;
  purchase_amount?: number;
  gst_amount?: number;
  delivery_charge?: number;
  grand_total: number;
  payment_status: 'Unpaid' | 'Pending' | 'Partial' | 'Paid';
  status: 'Draft' | 'Ordered' | 'Received' | 'Cancelled';
  items: PurchaseItem[];
  notes?: string;
  created_at: string;
}

export type PurchaseOrder = Purchase;

export interface ReturnItem {
  id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  sku: string;
  quantity_returned: number;
  rate: number;
  refund_amount: number;
  condition: 'Good' | 'Damaged' | 'Defective';
  restock_inventory: boolean;
}

export interface OrderReturn {
  id: string;
  return_number: string; // "RET-000001"
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  return_date: string;
  reason: string;
  notes?: string;
  refund_status: 'Pending' | 'Processed' | 'Rejected';
  total_refund_amount: number;
  refund_amount?: number;
  currency_code: string;
  currency_symbol: string;
  items: ReturnItem[];
  created_at: string;
}

export type DocumentType = 'invoice' | 'purchase' | 'sale' | 'return';

export interface BusinessDocument {
  id: string;
  document_type: DocumentType;
  document_number: string;
  title: string;
  reference_id: string;
  customer_or_vendor: string;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  date: string;
  created_at: string;
  file_url?: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface BackupCounts {
  products: number;
  orders: number;
  customers: number;
  movements: number;
  purchases: number;
  invoices: number;
  returns: number;
  documents?: number;
  audit_logs?: number;
}

export interface BackupSummary {
  version: string;
  exported_at: string;
  app_name?: string;
  company_name?: string;
  currency?: string;
  counts: BackupCounts;
  file_size_bytes?: number;
}

export interface BackupInspectResult {
  valid: boolean;
  error?: string;
  summary?: BackupSummary;
  data?: any;
}

