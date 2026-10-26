import {
  BusinessSettings,
  Currency,
  Customer,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  InventoryMovement,
  Purchase,
  OrderReturn,
  Invoice,
  BusinessDocument,
  AuditLog,
  SalesChannel,
  UserProfile,
  Role,
  BackupCounts,
  BackupSummary,
  BackupInspectResult,
} from '../types';

const DB_KEY_PREFIX = 'erp_storage_v1_';

const initialSettings: BusinessSettings = {
  id: 'settings-1',
  brand_name: 'REYRA Inventory',
  company_name: 'REYRA Inventory',
  brand_logo: '',
  company_address: 'Plot 42, Tech Park Central, Sector 18, Bangalore, KA 560100',
  company_phone: '+91 98765 43210',
  company_email: 'contact@reyra.com',
  business_address: 'Plot 42, Tech Park Central, Sector 18, Bangalore, KA 560100',
  business_phone: '+91 98765 43210',
  business_email: 'contact@reyra.com',
  tax_id: '29ABCDE1234F1Z5',
  tax_identifier: '29ABCDE1234F1Z5',
  default_currency_code: 'INR',
  currency_code: 'INR',
  currency_symbol: '₹',
  allow_negative_stock: false,
  low_stock_threshold: 10,
  default_tax_rate: 18,
  invoice_prefix: 'INV-',
  order_prefix: '',
  purchase_prefix: 'PO-',
  terms_and_conditions: '1. Goods once sold will only be accepted for return within 7 days in original condition.\n2. Warranty as per manufacturer terms.\n3. Payment is due within 15 days of invoice date.',
  updated_at: new Date().toISOString(),
};

const initialCurrencies: Currency[] = [
  { id: 'curr-1', name: 'Indian Rupee', code: 'INR', symbol: '₹', decimal_precision: 2, is_active: true, is_default: true },
  { id: 'curr-2', name: 'US Dollar', code: 'USD', symbol: '$', decimal_precision: 2, is_active: true, is_default: false },
  { id: 'curr-3', name: 'Euro', code: 'EUR', symbol: '€', decimal_precision: 2, is_active: true, is_default: false },
  { id: 'curr-4', name: 'British Pound', code: 'GBP', symbol: '£', decimal_precision: 2, is_active: true, is_default: false },
];

const initialSalesChannels: SalesChannel[] = [
  { id: 'sc-1', name: 'Offline Store', code: 'OFFLINE', is_active: true },
  { id: 'sc-2', name: 'Official Website', code: 'WEBSITE', is_active: true },
  { id: 'sc-3', name: 'Amazon India', code: 'AMAZON', is_active: true },
  { id: 'sc-4', name: 'Instagram Direct', code: 'INSTAGRAM', is_active: true },
];

const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@example.com',
    phone: '+91 98201 12345',
    address: 'A-402, Sunshine Heights, Andheri West, Mumbai 400058',
    total_orders: 2,
    total_spent: 4250,
    last_order_date: '2026-09-02',
    created_at: '2026-08-15T10:00:00.000Z',
    updated_at: '2026-09-02T14:30:00.000Z',
  },
  {
    id: 'cust-2',
    name: 'Pooja Varma',
    email: 'pooja.v@example.com',
    phone: '+91 97411 98765',
    address: '12, 4th Main, Indiranagar, Bengaluru 560038',
    total_orders: 1,
    total_spent: 1899,
    last_order_date: '2026-09-05',
    created_at: '2026-08-20T11:15:00.000Z',
    updated_at: '2026-09-05T09:20:00.000Z',
  },
  {
    id: 'cust-3',
    name: 'Ananya Roy',
    email: 'ananya.roy@example.com',
    phone: '+91 91630 45678',
    address: 'Flat 3B, Lake View Residency, Salt Lake, Kolkata 700091',
    total_orders: 1,
    total_spent: 2499,
    last_order_date: '2026-09-06',
    created_at: '2026-08-25T16:40:00.000Z',
    updated_at: '2026-09-06T12:00:00.000Z',
  },
];

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Ergonomic Wireless Mouse M2',
    sourcing_agency: 'TechVibe Electronics Ltd',
    item_type: 'single',
    sku: 'EWM-M2-BLK',
    barcode: 'EWM-M2-BLK',
    units: 42,
    buy_price: 650,
    selling_price: 1199,
    mrp: 1499,
    discount: 5,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&auto=format&fit=crop&q=80'],
    is_archived: false,
    variants: [],
    created_at: '2026-08-10T09:00:00.000Z',
    updated_at: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod-2',
    name: 'Premium Cotton Polo Shirt',
    sourcing_agency: 'Vanguard Textiles Tirupur',
    item_type: 'variant',
    sku: 'POLO-VNG-NAVY',
    barcode: 'POLO-VNG-NAVY',
    units: 65,
    buy_price: 320,
    selling_price: 799,
    mrp: 999,
    discount: 10,
    images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&auto=format&fit=crop&q=80'],
    is_archived: false,
    variants: [
      {
        id: 'var-1',
        product_id: 'prod-2',
        variant_name: 'Navy Blue / Medium',
        sku: 'POLO-NAVY-M',
        barcode: 'POLO-NAVY-M',
        units: 25,
        buy_price: 320,
        selling_price: 799,
        mrp: 999,
        discount: 10,
        created_at: '2026-08-11T09:00:00.000Z',
        updated_at: '2026-08-11T09:00:00.000Z',
      },
      {
        id: 'var-2',
        product_id: 'prod-2',
        variant_name: 'Navy Blue / Large',
        sku: 'POLO-NAVY-L',
        barcode: 'POLO-NAVY-L',
        units: 22,
        buy_price: 320,
        selling_price: 799,
        mrp: 999,
        discount: 10,
        created_at: '2026-08-11T09:00:00.000Z',
        updated_at: '2026-08-11T09:00:00.000Z',
      },
      {
        id: 'var-3',
        product_id: 'prod-2',
        variant_name: 'Navy Blue / XL',
        sku: 'POLO-NAVY-XL',
        barcode: 'POLO-NAVY-XL',
        units: 18,
        buy_price: 340,
        selling_price: 849,
        mrp: 1099,
        discount: 10,
        created_at: '2026-08-11T09:00:00.000Z',
        updated_at: '2026-08-11T09:00:00.000Z',
      },
    ],
    created_at: '2026-08-11T09:00:00.000Z',
    updated_at: '2026-08-11T09:00:00.000Z',
  },
  {
    id: 'prod-3',
    name: 'Active Noise Cancelling Headphones ANC-500',
    sourcing_agency: 'AudioCraft Labs Shenzhen',
    item_type: 'single',
    sku: 'ANC-500-SLV',
    barcode: 'ANC-500-SLV',
    units: 18,
    buy_price: 1850,
    selling_price: 3499,
    mrp: 4999,
    discount: 0,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80'],
    is_archived: false,
    variants: [],
    created_at: '2026-08-12T10:00:00.000Z',
    updated_at: '2026-08-12T10:00:00.000Z',
  },
  {
    id: 'prod-4',
    name: 'Stainless Steel Thermal Flask 1000ml',
    sourcing_agency: 'SteelCraft Industries Pune',
    item_type: 'single',
    sku: 'SST-1000-BLK',
    barcode: 'SST-1000-BLK',
    units: 30,
    buy_price: 380,
    selling_price: 749,
    mrp: 899,
    discount: 5,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=80'],
    is_archived: false,
    variants: [],
    created_at: '2026-08-14T11:00:00.000Z',
    updated_at: '2026-08-14T11:00:00.000Z',
  },
];

const initialOrders: Order[] = [
  {
    id: 'order-1',
    order_number: '000001',
    order_date: '2026-09-02',
    customer_id: 'cust-1',
    customer_name: 'Rajesh Sharma',
    customer_email: 'rajesh.sharma@example.com',
    customer_phone: '+91 98201 12345',
    payment_method: 'UPI',
    sales_channel_id: 'sc-2',
    sales_channel_name: 'Official Website',
    status: 'Delivered',
    subtotal: 1199,
    discount_total: 59.95,
    tax_total: 0,
    total_amount: 1139.05,
    currency_code: 'INR',
    currency_symbol: '₹',
    is_invoiced: true,
    items: [
      {
        id: 'oi-1',
        order_id: 'order-1',
        product_id: 'prod-1',
        product_name: 'Ergonomic Wireless Mouse M2',
        sku: 'EWM-M2-BLK',
        quantity: 1,
        rate: 1199,
        discount: 5,
        line_total: 1139.05,
      },
    ],
    notes: 'Delivered safely at front desk',
    created_at: '2026-09-02T10:15:00.000Z',
    updated_at: '2026-09-02T14:30:00.000Z',
  },
  {
    id: 'order-2',
    order_number: '000002',
    order_date: '2026-09-05',
    customer_id: 'cust-2',
    customer_name: 'Pooja Varma',
    customer_email: 'pooja.v@example.com',
    customer_phone: '+91 97411 98765',
    payment_method: 'Card',
    sales_channel_id: 'sc-1',
    sales_channel_name: 'Offline Store',
    status: 'Shipped',
    subtotal: 1598,
    discount_total: 159.8,
    tax_total: 0,
    total_amount: 1438.2,
    currency_code: 'INR',
    currency_symbol: '₹',
    is_invoiced: true,
    items: [
      {
        id: 'oi-2',
        order_id: 'order-2',
        product_id: 'prod-2',
        variant_id: 'var-1',
        product_name: 'Premium Cotton Polo Shirt',
        variant_name: 'Navy Blue / Medium',
        sku: 'POLO-NAVY-M',
        quantity: 2,
        rate: 799,
        discount: 10,
        line_total: 1438.2,
      },
    ],
    notes: 'Dispatched via BlueDart AWB#882194',
    created_at: '2026-09-05T09:20:00.000Z',
    updated_at: '2026-09-05T13:45:00.000Z',
  },
  {
    id: 'order-3',
    order_number: '000003',
    order_date: '2026-09-06',
    customer_id: 'cust-3',
    customer_name: 'Ananya Roy',
    customer_email: 'ananya.roy@example.com',
    customer_phone: '+91 91630 45678',
    payment_method: 'UPI',
    sales_channel_id: 'sc-3',
    sales_channel_name: 'Amazon India',
    status: 'Packed',
    subtotal: 3499,
    discount_total: 0,
    tax_total: 0,
    total_amount: 3499,
    currency_code: 'INR',
    currency_symbol: '₹',
    is_invoiced: false,
    items: [
      {
        id: 'oi-3',
        order_id: 'order-3',
        product_id: 'prod-3',
        product_name: 'Active Noise Cancelling Headphones ANC-500',
        sku: 'ANC-500-SLV',
        quantity: 1,
        rate: 3499,
        discount: 0,
        line_total: 3499,
      },
    ],
    notes: 'Amazon Prime Fulfilled',
    created_at: '2026-09-06T12:00:00.000Z',
    updated_at: '2026-09-06T15:10:00.000Z',
  },
  {
    id: 'order-4',
    order_number: '000004',
    order_date: '2026-09-08',
    customer_id: 'cust-1',
    customer_name: 'Rajesh Sharma',
    customer_email: 'rajesh.sharma@example.com',
    customer_phone: '+91 98201 12345',
    payment_method: 'Cash',
    sales_channel_id: 'sc-1',
    sales_channel_name: 'Offline Store',
    status: 'Received',
    subtotal: 749,
    discount_total: 37.45,
    tax_total: 0,
    total_amount: 711.55,
    currency_code: 'INR',
    currency_symbol: '₹',
    is_invoiced: false,
    items: [
      {
        id: 'oi-4',
        order_id: 'order-4',
        product_id: 'prod-4',
        product_name: 'Stainless Steel Thermal Flask 1000ml',
        sku: 'SST-1000-BLK',
        quantity: 1,
        rate: 749,
        discount: 5,
        line_total: 711.55,
      },
    ],
    notes: 'Walk-in customer purchase',
    created_at: '2026-09-08T08:00:00.000Z',
    updated_at: '2026-09-08T08:00:00.000Z',
  },
  {
    id: 'order-5',
    order_number: '000005',
    order_date: '2026-09-22',
    customer_id: 'cust-2',
    customer_name: 'Pooja Varma',
    customer_email: 'pooja.v@example.com',
    customer_phone: '+91 97411 98765',
    payment_method: 'UPI',
    sales_channel_id: 'sc-2',
    sales_channel_name: 'Official Website',
    status: 'Delivered',
    subtotal: 2398,
    discount_total: 119.9,
    tax_total: 0,
    total_amount: 2278.1,
    currency_code: 'INR',
    currency_symbol: '₹',
    is_invoiced: true,
    items: [
      {
        id: 'oi-5',
        order_id: 'order-5',
        product_id: 'prod-1',
        product_name: 'Ergonomic Wireless Mouse M2',
        sku: 'EWM-M2-BLK',
        quantity: 2,
        rate: 1199,
        discount: 5,
        line_total: 2278.1,
      },
    ],
    notes: 'Express courier delivery',
    created_at: '2026-09-22T11:15:00.000Z',
    updated_at: '2026-09-22T15:30:00.000Z',
  },
  {
    id: 'order-6',
    order_number: '000006',
    order_date: '2026-09-24',
    customer_id: 'cust-3',
    customer_name: 'Ananya Roy',
    customer_email: 'ananya.roy@example.com',
    customer_phone: '+91 91630 45678',
    payment_method: 'Card',
    sales_channel_id: 'sc-1',
    sales_channel_name: 'Offline Store',
    status: 'Received',
    subtotal: 3499,
    discount_total: 0,
    tax_total: 0,
    total_amount: 3499,
    currency_code: 'INR',
    currency_symbol: '₹',
    is_invoiced: false,
    items: [
      {
        id: 'oi-6',
        order_id: 'order-6',
        product_id: 'prod-3',
        product_name: 'Active Noise Cancelling Headphones ANC-500',
        sku: 'ANC-500-SLV',
        quantity: 1,
        rate: 3499,
        discount: 0,
        line_total: 3499,
      },
    ],
    notes: 'Store pickup in progress',
    created_at: '2026-09-24T10:30:00.000Z',
    updated_at: '2026-09-24T10:30:00.000Z',
  },
];

const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoice_number: 'INV-000001',
    invoice_date: '2026-09-02',
    order_id: 'order-1',
    order_number: '000001',
    customer_name: 'Rajesh Sharma',
    customer_phone: '+91 98201 12345',
    customer_email: 'rajesh.sharma@example.com',
    customer_address: 'A-402, Sunshine Heights, Andheri West, Mumbai 400058',
    payment_method: 'UPI',
    sales_channel_name: 'Official Website',
    items: [
      {
        id: 'ii-1',
        product_name: 'Ergonomic Wireless Mouse M2',
        sku: 'EWM-M2-BLK',
        quantity: 1,
        unit_price: 1199,
        discount: 5,
        line_total: 1139.05,
      },
    ],
    subtotal: 1199,
    discount_total: 59.95,
    tax_total: 0,
    total_amount: 1139.05,
    currency_code: 'INR',
    currency_symbol: '₹',
    status: 'Paid',
    created_at: '2026-09-02T10:30:00.000Z',
  },
  {
    id: 'inv-2',
    invoice_number: 'INV-000002',
    invoice_date: '2026-09-05',
    order_id: 'order-2',
    order_number: '000002',
    customer_name: 'Pooja Varma',
    customer_phone: '+91 97411 98765',
    customer_email: 'pooja.v@example.com',
    customer_address: '12, 4th Main, Indiranagar, Bengaluru 560038',
    payment_method: 'Card',
    sales_channel_name: 'Offline Store',
    items: [
      {
        id: 'ii-2',
        product_name: 'Premium Cotton Polo Shirt',
        variant_name: 'Navy Blue / Medium',
        sku: 'POLO-NAVY-M',
        quantity: 2,
        unit_price: 799,
        discount: 10,
        line_total: 1438.2,
      },
    ],
    subtotal: 1598,
    discount_total: 159.8,
    tax_total: 0,
    total_amount: 1438.2,
    currency_code: 'INR',
    currency_symbol: '₹',
    status: 'Paid',
    created_at: '2026-09-05T09:45:00.000Z',
  },
];

const initialPurchases: Purchase[] = [
  {
    id: 'pur-1',
    purchase_number: 'PO-000001',
    po_number: 'PO-000001',
    purchase_date: '2026-08-28',
    order_date: '2026-08-28',
    expected_delivery_date: '2026-09-02',
    sourcing_agency: 'TechVibe Electronics Ltd',
    vendor_name: 'TechVibe Electronics Ltd',
    vendor_contact: '+91 98111 22334',
    item_count: 50,
    purchase_amount: 32500,
    gst_amount: 5850,
    delivery_charge: 500,
    grand_total: 38850,
    payment_status: 'Paid',
    status: 'Received',
    items: [
      {
        id: 'pi-1',
        purchase_id: 'pur-1',
        product_id: 'prod-1',
        item_name: 'Ergonomic Wireless Mouse M2',
        product_name: 'Ergonomic Wireless Mouse M2',
        sku: 'EWM-M2-BLK',
        quantity: 50,
        purchased_price: 650,
        unit_cost: 650,
        gst_amount: 5850,
        delivery_charge: 500,
        total_line: 38850,
        total_cost: 32500,
      },
    ],
    notes: 'Batch #TV-2026-AUG',
    created_at: '2026-08-28T14:00:00.000Z',
  },
];

const initialReturns: OrderReturn[] = [
  {
    id: 'ret-1',
    return_number: 'RET-000001',
    order_id: 'order-1',
    order_number: '000001',
    customer_name: 'Rajesh Sharma',
    customer_phone: '+91 98201 12345',
    return_date: '2026-09-04',
    reason: 'Customer ordered wrong color variant',
    notes: 'Product sealed in original box, verified',
    refund_status: 'Processed',
    total_refund_amount: 1139.05,
    currency_code: 'INR',
    currency_symbol: '₹',
    items: [
      {
        id: 'ri-1',
        product_id: 'prod-1',
        product_name: 'Ergonomic Wireless Mouse M2',
        sku: 'EWM-M2-BLK',
        quantity_returned: 1,
        rate: 1199,
        refund_amount: 1139.05,
        condition: 'Good',
        restock_inventory: true,
      },
    ],
    created_at: '2026-09-04T11:00:00.000Z',
  },
];

const initialMovements: InventoryMovement[] = [
  {
    id: 'mov-1',
    product_id: 'prod-1',
    product_name: 'Ergonomic Wireless Mouse M2',
    sku: 'EWM-M2-BLK',
    movement_type: 'purchase',
    quantity_changed: 50,
    balance_after: 50,
    reference_id: 'pur-1',
    reference_number: 'PO-000001',
    reason: 'Purchase PO-000001 received',
    created_at: '2026-08-28T14:00:00.000Z',
    created_by: 'System Admin',
  },
  {
    id: 'mov-2',
    product_id: 'prod-1',
    product_name: 'Ergonomic Wireless Mouse M2',
    sku: 'EWM-M2-BLK',
    movement_type: 'sale',
    quantity_changed: -1,
    balance_after: 49,
    reference_id: 'order-1',
    reference_number: '000001',
    reason: 'Sale order 000001 fulfilled',
    created_at: '2026-09-02T10:15:00.000Z',
    created_by: 'System Admin',
  },
  {
    id: 'mov-3',
    product_id: 'prod-1',
    product_name: 'Ergonomic Wireless Mouse M2',
    sku: 'EWM-M2-BLK',
    movement_type: 'return',
    quantity_changed: 1,
    balance_after: 50,
    reference_id: 'ret-1',
    reference_number: 'RET-000001',
    reason: 'Return RET-000001 restocked (good condition)',
    created_at: '2026-09-04T11:00:00.000Z',
    created_by: 'System Admin',
  },
  {
    id: 'mov-4',
    product_id: 'prod-2',
    product_name: 'Premium Cotton Polo Shirt',
    variant_id: 'var-1',
    variant_name: 'Navy Blue / Medium',
    sku: 'POLO-NAVY-M',
    movement_type: 'sale',
    quantity_changed: -2,
    balance_after: 25,
    reference_id: 'order-2',
    reference_number: '000002',
    reason: 'Sale order 000002 fulfilled',
    created_at: '2026-09-05T09:20:00.000Z',
    created_by: 'System Admin',
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    user_name: 'System Admin',
    action: 'SYSTEM_BOOT',
    entity_type: 'SYSTEM',
    entity_id: 'SYS-1',
    details: 'Database initialized with verified enterprise ledger schema',
    created_at: '2026-08-28T10:00:00.000Z',
  },
  {
    id: 'log-2',
    user_name: 'System Admin',
    action: 'PURCHASE_CREATED',
    entity_type: 'PURCHASE',
    entity_id: 'PO-000001',
    details: 'Received 50 units of Ergonomic Wireless Mouse M2',
    created_at: '2026-08-28T14:00:00.000Z',
  },
  {
    id: 'log-3',
    user_name: 'System Admin',
    action: 'ORDER_CREATED',
    entity_type: 'ORDER',
    entity_id: '000001',
    details: 'Created Order #000001 for Rajesh Sharma, amount ₹1,139.05',
    created_at: '2026-09-02T10:15:00.000Z',
  },
  {
    id: 'log-4',
    user_name: 'System Admin',
    action: 'INVOICE_GENERATED',
    entity_type: 'INVOICE',
    entity_id: 'INV-000001',
    details: 'Generated Invoice #INV-000001 for Order #000001',
    created_at: '2026-09-02T10:30:00.000Z',
  },
];

const initialDocuments: BusinessDocument[] = [
  {
    id: 'doc-1',
    document_type: 'invoice',
    document_number: 'INV-000001',
    title: 'Tax Invoice - Rajesh Sharma',
    reference_id: 'inv-1',
    customer_or_vendor: 'Rajesh Sharma',
    amount: 1139.05,
    currency_code: 'INR',
    currency_symbol: '₹',
    date: '2026-09-02',
    created_at: '2026-09-02T10:30:00.000Z',
  },
  {
    id: 'doc-2',
    document_type: 'invoice',
    document_number: 'INV-000002',
    title: 'Tax Invoice - Pooja Varma',
    reference_id: 'inv-2',
    customer_or_vendor: 'Pooja Varma',
    amount: 1438.2,
    currency_code: 'INR',
    currency_symbol: '₹',
    date: '2026-09-05',
    created_at: '2026-09-05T09:45:00.000Z',
  },
  {
    id: 'doc-3',
    document_type: 'purchase',
    document_number: 'PO-000001',
    title: 'Purchase Order - TechVibe Electronics Ltd',
    reference_id: 'pur-1',
    customer_or_vendor: 'TechVibe Electronics Ltd',
    amount: 38850,
    currency_code: 'INR',
    currency_symbol: '₹',
    date: '2026-08-28',
    created_at: '2026-08-28T14:00:00.000Z',
  },
  {
    id: 'doc-4',
    document_type: 'return',
    document_number: 'RET-000001',
    title: 'Return Credit Note - Rajesh Sharma',
    reference_id: 'ret-1',
    customer_or_vendor: 'Rajesh Sharma',
    amount: 1139.05,
    currency_code: 'INR',
    currency_symbol: '₹',
    date: '2026-09-04',
    created_at: '2026-09-04T11:00:00.000Z',
  },
];

class ERPDatabase {
  private cache: Map<string, any> = new Map();
  private productBarcodeIndex: Map<string, { product: Product; variant?: ProductVariant }> = new Map();
  private productIdIndex: Map<string, Product> = new Map();

  private get<T>(key: string, defaultValue: T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    try {
      const stored = localStorage.getItem(DB_KEY_PREFIX + key);
      if (!stored) {
        this.set(key, defaultValue);
        return defaultValue;
      }
      const parsed = JSON.parse(stored);
      this.cache.set(key, parsed);
      return parsed;
    } catch {
      this.cache.set(key, defaultValue);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    this.cache.set(key, value);
    if (key === 'products') {
      this.rebuildProductIndexes(value as Product[]);
    }
    try {
      localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage quota high or constrained, executing auto-compaction:', e);
      this.compactStorage();
      try {
        localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(value));
      } catch (err) {
        console.error('Storage persistence warning:', err);
      }
    }
  }

  // Automatic storage compaction to ensure fast, zero-lag operation indefinitely
  private compactStorage(): void {
    try {
      const logs = this.cache.get('audit_logs') || [];
      if (logs.length > 150) {
        const pruned = logs.slice(0, 100);
        this.cache.set('audit_logs', pruned);
        localStorage.setItem(DB_KEY_PREFIX + 'audit_logs', JSON.stringify(pruned));
      }
    } catch {
      // safe fallback
    }
  }

  private rebuildProductIndexes(products: Product[]): void {
    this.productBarcodeIndex.clear();
    this.productIdIndex.clear();
    if (!Array.isArray(products)) return;

    for (const p of products) {
      this.productIdIndex.set(p.id, p);
      if (p.sku) {
        this.productBarcodeIndex.set(p.sku.trim().toUpperCase(), { product: p });
      }
      if (p.barcode) {
        this.productBarcodeIndex.set(p.barcode.trim().toUpperCase(), { product: p });
      }
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          if (v.sku) {
            this.productBarcodeIndex.set(v.sku.trim().toUpperCase(), { product: p, variant: v });
          }
          if (v.barcode) {
            this.productBarcodeIndex.set(v.barcode.trim().toUpperCase(), { product: p, variant: v });
          }
        }
      }
    }
  }

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(DB_KEY_PREFIX + 'initialized')) {
      this.resetToDefaults();
    } else {
      const prods = this.get<Product[]>('products', initialProducts);
      this.rebuildProductIndexes(prods);
    }
  }

  public resetToDefaults() {
    this.cache.clear();
    this.productBarcodeIndex.clear();
    this.productIdIndex.clear();
    this.set('settings', initialSettings);
    this.set('currencies', initialCurrencies);
    this.set('sales_channels', initialSalesChannels);
    this.set('customers', initialCustomers);
    this.set('products', initialProducts);
    this.set('orders', initialOrders);
    this.set('invoices', initialInvoices);
    this.set('purchases', initialPurchases);
    this.set('returns', initialReturns);
    this.set('movements', initialMovements);
    this.set('audit_logs', initialAuditLogs);
    this.set('documents', initialDocuments);
    this.set('order_counter', 4);
    this.set('invoice_counter', 2);
    this.set('purchase_counter', 1);
    this.set('return_counter', 1);
    this.set('initialized', 'true');
  }

  // --- SETTINGS ---
  public getSettings(): BusinessSettings {
    const raw = this.get<BusinessSettings>('settings', initialSettings);
    const resolvedBrand =
      raw.brand_name && raw.brand_name !== 'Apex Dynamics'
        ? raw.brand_name
        : 'REYRA Inventory';
    const resolvedCompany =
      raw.company_name && raw.company_name !== 'Apex Dynamics'
        ? raw.company_name
        : resolvedBrand;

    return {
      ...initialSettings,
      ...raw,
      brand_name: resolvedBrand,
      company_name: resolvedCompany,
      brand_logo: raw.brand_logo !== undefined ? raw.brand_logo : initialSettings.brand_logo,
      company_address: raw.company_address || initialSettings.company_address,
      company_phone: raw.company_phone || initialSettings.company_phone,
      company_email: raw.company_email || initialSettings.company_email,
      business_address: raw.business_address || raw.company_address || initialSettings.business_address,
      business_phone: raw.business_phone || raw.company_phone || initialSettings.business_phone,
      business_email: raw.business_email || raw.company_email || initialSettings.business_email,
      tax_id: raw.tax_id || initialSettings.tax_id,
      tax_identifier: raw.tax_identifier || raw.tax_id || initialSettings.tax_identifier,
      default_currency_code: raw.default_currency_code || initialSettings.default_currency_code,
      currency_code: raw.currency_code || raw.default_currency_code || initialSettings.currency_code,
      currency_symbol: raw.currency_symbol || initialSettings.currency_symbol,
      allow_negative_stock: raw.allow_negative_stock ?? initialSettings.allow_negative_stock,
      low_stock_threshold: raw.low_stock_threshold ?? initialSettings.low_stock_threshold,
      default_tax_rate: raw.default_tax_rate ?? initialSettings.default_tax_rate,
      invoice_prefix: raw.invoice_prefix || initialSettings.invoice_prefix,
      order_prefix: raw.order_prefix ?? initialSettings.order_prefix,
      purchase_prefix: raw.purchase_prefix || initialSettings.purchase_prefix,
      terms_and_conditions: raw.terms_and_conditions || initialSettings.terms_and_conditions,
    };
  }

  public updateSettings(updates: Partial<BusinessSettings>): BusinessSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    this.set('settings', updated);
    this.addAuditLog('SETTINGS_UPDATED', 'SETTINGS', current.id, 'Business settings updated');
    return updated;
  }

  // --- CURRENCIES ---
  public getCurrencies(): Currency[] {
    return this.get<Currency[]>('currencies', initialCurrencies);
  }

  public addCurrency(currency: Omit<Currency, 'id'>): Currency {
    const list = this.getCurrencies();
    const newCurr: Currency = {
      ...currency,
      id: 'curr-' + Date.now(),
    };
    list.push(newCurr);
    this.set('currencies', list);
    return newCurr;
  }

  public setDefaultCurrency(code: string) {
    const list = this.getCurrencies().map(c => ({
      ...c,
      is_default: c.code === code,
    }));
    this.set('currencies', list);
    this.updateSettings({ default_currency_code: code });
  }

  // --- SALES CHANNELS ---
  public getSalesChannels(): SalesChannel[] {
    return this.get<SalesChannel[]>('sales_channels', initialSalesChannels);
  }

  public addSalesChannel(name: string): SalesChannel {
    const list = this.getSalesChannels();
    const newChannel: SalesChannel = {
      id: 'sc-' + Date.now(),
      name,
      code: name.toUpperCase().replace(/\s+/g, '_'),
      is_active: true,
    };
    list.push(newChannel);
    this.set('sales_channels', list);
    return newChannel;
  }

  // --- CUSTOMERS ---
  public getCustomers(): Customer[] {
    return this.get<Customer[]>('customers', initialCustomers);
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  public saveCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_orders' | 'total_spent'> & { id?: string }): Customer {
    const list = this.getCustomers();
    const now = new Date().toISOString();
    if (customer.id) {
      const idx = list.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...customer,
          updated_at: now,
        };
        this.set('customers', list);
        return list[idx];
      }
    }
    const newCustomer: Customer = {
      ...customer,
      id: 'cust-' + Date.now(),
      total_orders: 0,
      total_spent: 0,
      created_at: now,
      updated_at: now,
    };
    list.push(newCustomer);
    this.set('customers', list);
    this.addAuditLog('CUSTOMER_CREATED', 'CUSTOMER', newCustomer.id, `Customer ${newCustomer.name} created`);
    return newCustomer;
  }

  // --- PRODUCTS ---
  public getProducts(includeArchived: boolean = false): Product[] {
    const products = this.get<Product[]>('products', initialProducts);
    if (!includeArchived) {
      return products.filter(p => !p.is_archived);
    }
    return products;
  }

  public getProductById(id: string): Product | undefined {
    if (this.productIdIndex.has(id)) {
      return this.productIdIndex.get(id);
    }
    return this.get<Product[]>('products', initialProducts).find(p => p.id === id);
  }

  public findProductOrVariantBySKU(skuOrBarcode: string): { product: Product; variant?: ProductVariant } | null {
    if (!skuOrBarcode) return null;
    const clean = skuOrBarcode.trim().toUpperCase();
    if (this.productBarcodeIndex.has(clean)) {
      return this.productBarcodeIndex.get(clean)!;
    }
    const products = this.getProducts(true);
    for (const p of products) {
      if (p.sku.toUpperCase() === clean || (p.barcode && p.barcode.toUpperCase() === clean)) {
        return { product: p };
      }
      if (p.variants && p.variants.length > 0) {
        const foundVar = p.variants.find(v => v.sku.toUpperCase() === clean || (v.barcode && v.barcode.toUpperCase() === clean));
        if (foundVar) {
          return { product: p, variant: foundVar };
        }
      }
    }
    return null;
  }

  public saveProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { id?: string }): { success: boolean; product?: Product; error?: string } {
    const list = this.get<Product[]>('products', initialProducts);
    const now = new Date().toISOString();

    // Check SKU uniqueness
    const cleanSKU = productData.sku.trim().toUpperCase();
    const duplicate = list.find(p => p.id !== productData.id && p.sku.toUpperCase() === cleanSKU);
    if (duplicate) {
      return { success: false, error: `SKU "${productData.sku}" is already in use by product "${duplicate.name}".` };
    }

    // Check variant SKU uniqueness
    if (productData.item_type === 'variant' && productData.variants) {
      const variantSkus = new Set<string>();
      for (const v of productData.variants) {
        const vSKU = v.sku.trim().toUpperCase();
        if (variantSkus.has(vSKU)) {
          return { success: false, error: `Duplicate variant SKU "${v.sku}" found in product.` };
        }
        variantSkus.add(vSKU);

        // Check against other products
        const dupInOther = list.find(p => {
          if (p.id === productData.id) return false;
          if (p.sku.toUpperCase() === vSKU) return true;
          return p.variants?.some(otherV => otherV.sku.toUpperCase() === vSKU);
        });
        if (dupInOther) {
          return { success: false, error: `Variant SKU "${v.sku}" is already in use elsewhere.` };
        }
      }
    }

    if (productData.id) {
      const idx = list.findIndex(p => p.id === productData.id);
      if (idx !== -1) {
        const oldUnits = list[idx].units;
        const updated: Product = {
          ...list[idx],
          ...productData,
          updated_at: now,
        };
        list[idx] = updated;
        this.set('products', list);
        if (oldUnits !== updated.units) {
          this.recordMovement({
            product_id: updated.id,
            product_name: updated.name,
            sku: updated.sku,
            movement_type: 'adjustment',
            quantity_changed: updated.units - oldUnits,
            balance_after: updated.units,
            reason: 'Manual product units edit in catalog',
            created_by: 'System Admin',
          });
        }
        this.addAuditLog('PRODUCT_UPDATED', 'PRODUCT', updated.id, `Product ${updated.name} updated`);
        return { success: true, product: updated };
      }
    }

    const newProd: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
      is_archived: false,
      created_at: now,
      updated_at: now,
    };
    list.unshift(newProd);
    this.set('products', list);

    // Initial movement
    if (newProd.units > 0) {
      this.recordMovement({
        product_id: newProd.id,
        product_name: newProd.name,
        sku: newProd.sku,
        movement_type: 'adjustment',
        quantity_changed: newProd.units,
        balance_after: newProd.units,
        reason: 'Initial stock entry on product creation',
        created_by: 'System Admin',
      });
    }

    this.addAuditLog('PRODUCT_CREATED', 'PRODUCT', newProd.id, `Product ${newProd.name} created with SKU ${newProd.sku}`);
    return { success: true, product: newProd };
  }

  public archiveProduct(id: string): boolean {
    const list = this.get<Product[]>('products', initialProducts);
    const prod = list.find(p => p.id === id);
    if (!prod) return false;
    prod.is_archived = true;
    prod.updated_at = new Date().toISOString();
    this.set('products', list);
    this.addAuditLog('PRODUCT_ARCHIVED', 'PRODUCT', id, `Product ${prod.name} archived`);
    return true;
  }

  public restoreProduct(id: string): boolean {
    const list = this.get<Product[]>('products', initialProducts);
    const prod = list.find(p => p.id === id);
    if (!prod) return false;
    prod.is_archived = false;
    prod.updated_at = new Date().toISOString();
    this.set('products', list);
    this.addAuditLog('PRODUCT_RESTORED', 'PRODUCT', id, `Product ${prod.name} restored`);
    return true;
  }

  public updateProductUnitsAndDiscount(id: string, units: number, discount: number, variantId?: string): boolean {
    const list = this.get<Product[]>('products', initialProducts);
    const prod = list.find(p => p.id === id);
    if (!prod) return false;

    if (variantId && prod.variants) {
      const v = prod.variants.find(varItem => varItem.id === variantId);
      if (v) {
        const diff = units - v.units;
        v.units = units;
        v.discount = discount;
        v.updated_at = new Date().toISOString();
        // sum total product units
        prod.units = prod.variants.reduce((acc, curr) => acc + curr.units, 0);
        prod.updated_at = new Date().toISOString();
        this.set('products', list);
        if (diff !== 0) {
          this.recordMovement({
            product_id: prod.id,
            product_name: prod.name,
            variant_id: v.id,
            variant_name: v.variant_name,
            sku: v.sku,
            movement_type: 'adjustment',
            quantity_changed: diff,
            balance_after: v.units,
            reason: 'Quick inline inventory stock adjustment',
            created_by: 'System Admin',
          });
        }
        return true;
      }
    } else {
      const diff = units - prod.units;
      prod.units = units;
      prod.discount = discount;
      prod.updated_at = new Date().toISOString();
      this.set('products', list);
      if (diff !== 0) {
        this.recordMovement({
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          movement_type: 'adjustment',
          quantity_changed: diff,
          balance_after: prod.units,
          reason: 'Quick inline inventory stock adjustment',
          created_by: 'System Admin',
        });
      }
      return true;
    }
    return false;
  }

  // --- INVENTORY MOVEMENTS ---
  public getInventoryMovements(): InventoryMovement[] {
    return this.get<InventoryMovement[]>('movements', initialMovements);
  }

  private recordMovement(data: Omit<InventoryMovement, 'id' | 'created_at'>): InventoryMovement {
    const movements = this.getInventoryMovements();
    const newMovement: InventoryMovement = {
      ...data,
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
    };
    movements.unshift(newMovement);
    this.set('movements', movements);
    return newMovement;
  }

  // --- ORDERS / SALES ---
  public getOrders(): Order[] {
    return this.get<Order[]>('orders', initialOrders);
  }

  public getOrderById(id: string): Order | undefined {
    return this.getOrders().find(o => o.id === id);
  }

  public getNextOrderNumber(): string {
    const currentCounter = this.get<number>('order_counter', 4);
    const nextVal = currentCounter + 1;
    this.set('order_counter', nextVal);
    return String(nextVal).padStart(6, '0');
  }

  public peekNextOrderNumber(): string {
    const currentCounter = this.get<number>('order_counter', 4);
    return String(currentCounter + 1).padStart(6, '0');
  }

  /**
   * Transactional Sale Order Creation:
   * 1. Validate required information
   * 2. Validate inventory availability (unless negative stock allowed)
   * 3. Deduct inventory & record movement
   * 4. Create order & order items
   * 5. Update customer totals & last order date
   * 6. Generate audit log
   */
  public createOrder(data: {
    order_number?: string;
    customer_id?: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    shipping_address?: string;
    order_date: string;
    status?: Order['status'];
    payment_method: any;
    sales_channel_id: string;
    sales_channel_name?: string;
    subtotal?: number;
    total_discount?: number;
    discount_total?: number;
    tax_amount?: number;
    tax_total?: number;
    total_amount?: number;
    currency?: string;
    items: {
      product_id: string;
      variant_id?: string;
      product_name?: string;
      variant_name?: string;
      sku?: string;
      quantity: number;
      rate?: number;
      unit_price?: number;
      discount?: number;
      tax_amount?: number;
      subtotal?: number;
      line_total?: number;
    }[];
    notes?: string;
  }): { success: boolean; order?: Order; error?: string } {
    const settings = this.getSettings();
    const products = this.get<Product[]>('products', initialProducts);
    const currency = this.getCurrencies().find(c => c.is_default) || initialCurrencies[0];
    const channel = this.getSalesChannels().find(sc => sc.id === data.sales_channel_id);

    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'At least one item must be added to the order.' };
    }

    // Pre-flight check inventory
    for (const item of data.items) {
      const prod = products.find(p => p.id === item.product_id);
      if (!prod) {
        return { success: false, error: `Product not found for item ${item.product_id}` };
      }
      if (item.variant_id && prod.variants) {
        const variant = prod.variants.find(v => v.id === item.variant_id);
        if (!variant) {
          return { success: false, error: `Variant not found for product ${prod.name}` };
        }
        if (!settings.allow_negative_stock && variant.units < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${prod.name} (${variant.variant_name})". Available: ${variant.units}, Requested: ${item.quantity}.`,
          };
        }
      } else {
        if (!settings.allow_negative_stock && prod.units < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${prod.name}". Available: ${prod.units}, Requested: ${item.quantity}.`,
          };
        }
      }
    }

    // Generate Order Number
    const orderNumber = data.order_number || this.getNextOrderNumber();
    const orderId = 'order-' + Date.now();

    // Calculate line items & deduct stock
    const orderItems: OrderItem[] = [];
    let subtotal = 0;
    let discountTotal = 0;

    for (const item of data.items) {
      const prod = products.find(p => p.id === item.product_id)!;
      let sku = item.sku || prod.sku;
      let variantName: string | undefined = item.variant_name;
      let balanceAfter = 0;
      const rate = item.rate !== undefined ? item.rate : (item.unit_price || 0);
      const discount = item.discount || 0;

      if (item.variant_id && prod.variants) {
        const variant = prod.variants.find(v => v.id === item.variant_id)!;
        sku = variant.sku;
        variantName = variant.variant_name;
        variant.units -= item.quantity;
        balanceAfter = variant.units;
        // update parent product units sum
        prod.units = prod.variants.reduce((acc, curr) => acc + curr.units, 0);
      } else {
        prod.units -= item.quantity;
        balanceAfter = prod.units;
      }

      const lineGross = rate * item.quantity;
      const lineDiscount = lineGross * (discount / 100);
      const lineTotal = lineGross - lineDiscount;

      subtotal += lineGross;
      discountTotal += lineDiscount;

      orderItems.push({
        id: 'oi-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        order_id: orderId,
        product_id: prod.id,
        variant_id: item.variant_id,
        product_name: item.product_name || prod.name,
        variant_name: variantName,
        sku,
        quantity: item.quantity,
        rate,
        discount,
        line_total: Number(lineTotal.toFixed(2)),
        subtotal: Number(lineTotal.toFixed(2)),
      });

      // Record movement
      this.recordMovement({
        product_id: prod.id,
        product_name: prod.name,
        variant_id: item.variant_id,
        variant_name: variantName,
        sku,
        movement_type: 'sale',
        quantity_changed: -item.quantity,
        balance_after: balanceAfter,
        reference_id: orderId,
        reference_number: orderNumber,
        reason: `Sale order ${orderNumber} fulfilled`,
        created_by: 'System Admin',
      });
    }

    // Save updated products inventory
    this.set('products', products);

    const custEmail = data.customer_email || '';
    const custPhone = data.customer_phone || '';

    // Ensure customer exists or update
    let customerId = data.customer_id;
    if (!customerId) {
      const existingCust = this.getCustomers().find(c => 
        (custEmail && c.email.toLowerCase() === custEmail.toLowerCase()) || 
        (custPhone && c.phone === custPhone)
      );
      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const newCust = this.saveCustomer({
          name: data.customer_name,
          email: custEmail,
          phone: custPhone,
          address: data.shipping_address,
        });
        customerId = newCust.id;
      }
    }

    const totalAmount = data.total_amount !== undefined ? data.total_amount : Number((subtotal - discountTotal).toFixed(2));

    // Update customer statistics
    const customers = this.getCustomers();
    const custIdx = customers.findIndex(c => c.id === customerId);
    if (custIdx !== -1) {
      customers[custIdx].total_orders += 1;
      customers[custIdx].total_spent += totalAmount;
      customers[custIdx].last_order_date = data.order_date;
      customers[custIdx].updated_at = new Date().toISOString();
      this.set('customers', customers);
    }

    const now = new Date().toISOString();
    const combinedNotes = [data.notes, data.shipping_address ? `Shipping Address: ${data.shipping_address}` : '']
      .filter(Boolean)
      .join(' | ');

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      order_date: data.order_date,
      customer_id: customerId,
      customer_name: data.customer_name,
      customer_email: custEmail,
      customer_phone: custPhone,
      payment_method: data.payment_method,
      sales_channel_id: data.sales_channel_id,
      sales_channel_name: data.sales_channel_name || channel?.name || 'Direct',
      status: data.status || 'Received',
      subtotal: Number(subtotal.toFixed(2)),
      discount_total: Number(discountTotal.toFixed(2)),
      total_discount: Number(discountTotal.toFixed(2)),
      tax_total: data.tax_amount || data.tax_total || 0,
      total_amount: totalAmount,
      currency_code: data.currency || currency.code,
      currency_symbol: currency.symbol,
      is_invoiced: false,
      items: orderItems,
      notes: combinedNotes || undefined,
      created_at: now,
      updated_at: now,
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.set('orders', orders);

    // Register Document metadata
    this.addBusinessDocument({
      document_type: 'sale',
      document_number: orderNumber,
      title: `Sales Order - ${newOrder.customer_name}`,
      reference_id: newOrder.id,
      customer_or_vendor: newOrder.customer_name,
      amount: newOrder.total_amount,
      currency_code: newOrder.currency_code,
      currency_symbol: newOrder.currency_symbol,
      date: newOrder.order_date,
    });

    this.addAuditLog('ORDER_CREATED', 'ORDER', orderNumber, `Order #${orderNumber} created for ${newOrder.customer_name}, total ${currency.symbol}${totalAmount}`);

    return { success: true, order: newOrder };
  }

  public updateOrderStatus(orderId: string, newStatus: Order['status']): { success: boolean; error?: string } {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const oldStatus = order.status;
    if (oldStatus === newStatus) return { success: true };

    // If order is cancelled, restore inventory
    if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
      const products = this.get<Product[]>('products', initialProducts);
      for (const item of order.items) {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          let balanceAfter = 0;
          if (item.variant_id && prod.variants) {
            const v = prod.variants.find(varItem => varItem.id === item.variant_id);
            if (v) {
              v.units += item.quantity;
              balanceAfter = v.units;
              prod.units = prod.variants.reduce((acc, curr) => acc + curr.units, 0);
            }
          } else {
            prod.units += item.quantity;
            balanceAfter = prod.units;
          }

          this.recordMovement({
            product_id: prod.id,
            product_name: prod.name,
            variant_id: item.variant_id,
            variant_name: item.variant_name,
            sku: item.sku,
            movement_type: 'cancellation',
            quantity_changed: item.quantity,
            balance_after: balanceAfter,
            reference_id: order.id,
            reference_number: order.order_number,
            reason: `Order ${order.order_number} cancelled, inventory restored`,
            created_by: 'System Admin',
          });
        }
      }
      this.set('products', products);
    }

    order.status = newStatus;
    order.updated_at = new Date().toISOString();
    this.set('orders', orders);
    this.addAuditLog('ORDER_STATUS_CHANGED', 'ORDER', order.order_number, `Order #${order.order_number} status updated to ${newStatus}`);
    return { success: true };
  }

  // --- INVOICES ---
  public getInvoices(): Invoice[] {
    return this.get<Invoice[]>('invoices', initialInvoices);
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find(inv => inv.id === id);
  }

  public getNextInvoiceNumber(): string {
    const settings = this.getSettings();
    const currentCounter = this.get<number>('invoice_counter', 2);
    const nextVal = currentCounter + 1;
    this.set('invoice_counter', nextVal);
    const prefix = settings.invoice_prefix || 'INV-';
    return `${prefix}${String(nextVal).padStart(6, '0')}`;
  }

  public createInvoiceFromOrder(orderId: string): { success: boolean; invoice?: Invoice; error?: string } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }
    if (order.is_invoiced) {
      const existing = this.getInvoices().find(i => i.order_id === orderId);
      if (existing) {
        return { success: true, invoice: existing };
      }
    }

    const invoiceNumber = this.getNextInvoiceNumber();
    const customer = this.getCustomerById(order.customer_id);

    const invoiceItems: Invoice['items'] = (order.items || []).map((item, idx) => ({
      id: item.id || ('ii-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substr(2, 4)),
      product_name: item.product_name || 'Item',
      variant_name: item.variant_name || '',
      sku: item.sku || '',
      quantity: Number(item.quantity ?? 1),
      unit_price: Number(item.rate ?? 0),
      discount: Number(item.discount ?? 0),
      line_total: Number(item.line_total ?? ((item.rate ?? 0) * (item.quantity ?? 1))),
      subtotal: Number(item.line_total ?? ((item.rate ?? 0) * (item.quantity ?? 1))),
    }));

    const calculatedSubtotal = invoiceItems.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
    const subtotal = Number(order.subtotal ?? calculatedSubtotal);
    const discountTotal = Number(order.discount_total ?? 0);
    const taxTotal = Number(order.tax_total ?? 0);
    const totalAmount = Number(order.total_amount ?? Math.max(0, subtotal - discountTotal + taxTotal));

    // Historical currency preservation: retain order's currency at creation time
    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name || 'Customer',
      customer_phone: order.customer_phone || '',
      customer_email: order.customer_email || '',
      customer_address: customer?.address || '',
      payment_method: order.payment_method || 'Cash',
      sales_channel_name: order.sales_channel_name || 'Direct Store',
      items: invoiceItems,
      subtotal: subtotal,
      discount_total: discountTotal,
      total_discount: discountTotal,
      tax_total: taxTotal,
      tax_amount: taxTotal,
      total_amount: totalAmount,
      currency_code: order.currency_code || 'INR',
      currency_symbol: order.currency_symbol || '₹',
      currency: order.currency_symbol || order.currency_code || '₹',
      status: 'Paid',
      created_at: new Date().toISOString(),
    };

    const invoices = this.getInvoices();
    invoices.unshift(newInvoice);
    this.set('invoices', invoices);

    // Mark order as invoiced
    const orders = this.getOrders();
    const o = orders.find(ord => ord.id === orderId);
    if (o) {
      o.is_invoiced = true;
      o.updated_at = new Date().toISOString();
      this.set('orders', orders);
    }

    // Register Document
    this.addBusinessDocument({
      document_type: 'invoice',
      document_number: invoiceNumber,
      title: `Tax Invoice - ${newInvoice.customer_name}`,
      reference_id: newInvoice.id,
      customer_or_vendor: newInvoice.customer_name,
      amount: newInvoice.total_amount,
      currency_code: newInvoice.currency_code,
      currency_symbol: newInvoice.currency_symbol,
      date: newInvoice.invoice_date,
    });

    this.addAuditLog('INVOICE_GENERATED', 'INVOICE', invoiceNumber, `Invoice #${invoiceNumber} issued for Order #${order.order_number}`);

    return { success: true, invoice: newInvoice };
  }

  // --- PURCHASES ---
  public getPurchases(): Purchase[] {
    return this.get<Purchase[]>('purchases', initialPurchases);
  }

  public getNextPurchaseNumber(): string {
    const settings = this.getSettings();
    const currentCounter = this.get<number>('purchase_counter', 1);
    const nextVal = currentCounter + 1;
    this.set('purchase_counter', nextVal);
    const prefix = settings.purchase_prefix || 'PO-';
    return `${prefix}${String(nextVal).padStart(6, '0')}`;
  }

  public createPurchase(data: {
    po_number?: string;
    purchase_number?: string;
    vendor_name?: string;
    sourcing_agency?: string;
    vendor_contact?: string;
    order_date?: string;
    purchase_date?: string;
    expected_delivery_date?: string;
    payment_status?: 'Unpaid' | 'Pending' | 'Partial' | 'Paid';
    status?: 'Draft' | 'Ordered' | 'Received' | 'Cancelled';
    delivery_charge?: number;
    grand_total?: number;
    notes?: string;
    items: {
      product_id: string;
      variant_id?: string;
      product_name?: string;
      item_name?: string;
      variant_name?: string;
      sku?: string;
      quantity: number;
      unit_cost?: number;
      purchased_price?: number;
      gst_amount?: number;
      total_cost?: number;
    }[];
  }): { success: boolean; purchase?: Purchase; error?: string } {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'At least one item is required in the purchase order.' };
    }

    const purchaseNumber = data.po_number || data.purchase_number || this.getNextPurchaseNumber();
    const purchaseId = 'pur-' + Date.now();
    const products = this.get<Product[]>('products', initialProducts);
    const vendorName = data.vendor_name || data.sourcing_agency || 'General Vendor';
    const orderDate = data.order_date || data.purchase_date || new Date().toISOString().split('T')[0];
    const initialStatus = data.status || 'Received';
    const shouldRestockNow = initialStatus === 'Received';

    let purchaseAmount = 0;
    let totalGST = 0;
    let totalQuantity = 0;
    const purchaseItems: Purchase['items'] = [];

    for (const item of data.items) {
      const prod = products.find(p => p.id === item.product_id);
      const unitPrice = item.unit_cost !== undefined ? item.unit_cost : (item.purchased_price || 0);
      const gst = item.gst_amount || 0;
      const sku = item.sku || prod?.sku || 'SKU';
      const variantName = item.variant_name;
      let balanceAfter = 0;

      if (shouldRestockNow && prod) {
        if (item.variant_id && prod.variants) {
          const v = prod.variants.find(varItem => varItem.id === item.variant_id);
          if (v) {
            v.units += item.quantity;
            balanceAfter = v.units;
            v.buy_price = unitPrice;
            prod.units = prod.variants.reduce((acc, curr) => acc + curr.units, 0);
          }
        } else {
          prod.units += item.quantity;
          balanceAfter = prod.units;
          prod.buy_price = unitPrice;
        }

        // Record inventory movement for stock replenishment
        this.recordMovement({
          product_id: prod.id,
          product_name: prod.name,
          variant_id: item.variant_id,
          variant_name: variantName,
          sku,
          movement_type: 'purchase',
          quantity_changed: item.quantity,
          balance_after: balanceAfter,
          reference_id: purchaseId,
          reference_number: purchaseNumber,
          reason: `Purchase PO ${purchaseNumber} stock received`,
          created_by: 'System Admin',
        });
      }

      const lineTotal = item.total_cost !== undefined ? item.total_cost : (unitPrice * item.quantity + gst);
      purchaseAmount += unitPrice * item.quantity;
      totalGST += gst;
      totalQuantity += item.quantity;

      purchaseItems.push({
        id: 'pi-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        purchase_id: purchaseId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        item_name: item.product_name || item.item_name || prod?.name || 'Item',
        product_name: item.product_name || item.item_name || prod?.name || 'Item',
        variant_name: variantName,
        sku,
        quantity: item.quantity,
        purchased_price: unitPrice,
        unit_cost: unitPrice,
        gst_amount: gst,
        delivery_charge: 0,
        total_line: lineTotal,
        total_cost: lineTotal,
      });
    }

    if (shouldRestockNow) {
      this.set('products', products);
    }

    const calculatedGrandTotal = data.grand_total !== undefined ? data.grand_total : (purchaseAmount + totalGST + (data.delivery_charge || 0));

    const newPurchase: Purchase = {
      id: purchaseId,
      purchase_number: purchaseNumber,
      po_number: purchaseNumber,
      purchase_date: orderDate,
      order_date: orderDate,
      expected_delivery_date: data.expected_delivery_date,
      sourcing_agency: vendorName,
      vendor_name: vendorName,
      vendor_contact: data.vendor_contact,
      item_count: totalQuantity,
      purchase_amount: Number(purchaseAmount.toFixed(2)),
      gst_amount: Number(totalGST.toFixed(2)),
      delivery_charge: data.delivery_charge || 0,
      grand_total: Number(calculatedGrandTotal.toFixed(2)),
      payment_status: data.payment_status || 'Pending',
      status: initialStatus,
      items: purchaseItems,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    const purchases = this.getPurchases();
    purchases.unshift(newPurchase);
    this.set('purchases', purchases);

    // Register Document
    const currency = this.getCurrencies().find(c => c.is_default) || initialCurrencies[0];
    this.addBusinessDocument({
      document_type: 'purchase',
      document_number: purchaseNumber,
      title: `Purchase Order - ${newPurchase.vendor_name}`,
      reference_id: newPurchase.id,
      customer_or_vendor: newPurchase.vendor_name,
      amount: newPurchase.grand_total,
      currency_code: currency.code,
      currency_symbol: currency.symbol,
      date: newPurchase.order_date,
    });

    this.addAuditLog('PURCHASE_CREATED', 'PURCHASE', purchaseNumber, `Purchase #${purchaseNumber} recorded from ${newPurchase.vendor_name}, total ${currency.symbol}${newPurchase.grand_total}`);

    return { success: true, purchase: newPurchase };
  }

  // --- RETURNS ---
  public getReturns(): OrderReturn[] {
    return this.get<OrderReturn[]>('returns', initialReturns);
  }

  public getNextReturnNumber(): string {
    const currentCounter = this.get<number>('return_counter', 1);
    const nextVal = currentCounter + 1;
    this.set('return_counter', nextVal);
    return `RET-${String(nextVal).padStart(6, '0')}`;
  }

  public createReturn(data: {
    order_id: string;
    return_date: string;
    reason: string;
    notes?: string;
    items: {
      product_id: string;
      variant_id?: string;
      quantity_returned: number;
      condition: 'Good' | 'Damaged' | 'Defective';
      restock_inventory: boolean;
    }[];
  }): { success: boolean; returnRecord?: OrderReturn; error?: string } {
    const order = this.getOrderById(data.order_id);
    if (!order) return { success: false, error: 'Order not found.' };

    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'No items selected for return.' };
    }

    const returnNumber = this.getNextReturnNumber();
    const returnId = 'ret-' + Date.now();
    const products = this.get<Product[]>('products', initialProducts);
    const returnItems: OrderReturn['items'] = [];
    let totalRefund = 0;

    for (const item of data.items) {
      const orderItem = order.items.find(oi => oi.product_id === item.product_id && (item.variant_id ? oi.variant_id === item.variant_id : true));
      if (!orderItem) continue;

      const unitNet = orderItem.line_total / orderItem.quantity;
      const refundLine = unitNet * item.quantity_returned;
      totalRefund += refundLine;

      returnItems.push({
        id: 'ri-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: orderItem.product_name,
        variant_name: orderItem.variant_name,
        sku: orderItem.sku,
        quantity_returned: item.quantity_returned,
        rate: orderItem.rate,
        refund_amount: Number(refundLine.toFixed(2)),
        condition: item.condition,
        restock_inventory: item.restock_inventory,
      });

      // If restock inventory is enabled (and item is in good condition), restore to inventory
      if (item.restock_inventory) {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          let balanceAfter = 0;
          if (item.variant_id && prod.variants) {
            const v = prod.variants.find(varItem => varItem.id === item.variant_id);
            if (v) {
              v.units += item.quantity_returned;
              balanceAfter = v.units;
              prod.units = prod.variants.reduce((acc, curr) => acc + curr.units, 0);
            }
          } else {
            prod.units += item.quantity_returned;
            balanceAfter = prod.units;
          }

          this.recordMovement({
            product_id: prod.id,
            product_name: prod.name,
            variant_id: item.variant_id,
            variant_name: orderItem.variant_name,
            sku: orderItem.sku,
            movement_type: 'return',
            quantity_changed: item.quantity_returned,
            balance_after: balanceAfter,
            reference_id: returnId,
            reference_number: returnNumber,
            reason: `Return ${returnNumber} processed: condition ${item.condition}`,
            created_by: 'System Admin',
          });
        }
      }
    }

    if (returnItems.some(ri => ri.restock_inventory)) {
      this.set('products', products);
    }

    const newReturn: OrderReturn = {
      id: returnId,
      return_number: returnNumber,
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      return_date: data.return_date,
      reason: data.reason,
      notes: data.notes,
      refund_status: 'Processed',
      total_refund_amount: Number(totalRefund.toFixed(2)),
      currency_code: order.currency_code,
      currency_symbol: order.currency_symbol,
      items: returnItems,
      created_at: new Date().toISOString(),
    };

    const returns = this.getReturns();
    returns.unshift(newReturn);
    this.set('returns', returns);

    // Register Document
    this.addBusinessDocument({
      document_type: 'return',
      document_number: returnNumber,
      title: `Return Credit Note - ${order.customer_name}`,
      reference_id: newReturn.id,
      customer_or_vendor: order.customer_name,
      amount: newReturn.total_refund_amount,
      currency_code: newReturn.currency_code,
      currency_symbol: newReturn.currency_symbol,
      date: newReturn.return_date,
    });

    this.addAuditLog('RETURN_PROCESSED', 'RETURN', returnNumber, `Return #${returnNumber} processed for Order #${order.order_number}, refund ${order.currency_symbol}${totalRefund.toFixed(2)}`);

    return { success: true, returnRecord: newReturn };
  }

  // --- DOCUMENTS ---
  public getDocuments(): BusinessDocument[] {
    return this.get<BusinessDocument[]>('documents', initialDocuments);
  }

  private addBusinessDocument(doc: Omit<BusinessDocument, 'id' | 'created_at'>): BusinessDocument {
    const list = this.getDocuments();
    const newDoc: BusinessDocument = {
      ...doc,
      id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
    };
    list.unshift(newDoc);
    this.set('documents', list);
    return newDoc;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>('audit_logs', initialAuditLogs);
  }

  public addAuditLog(action: string, entity_type: string, entity_id: string, details: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      user_name: 'Admin',
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 500 logs in storage
    if (logs.length > 500) logs.length = 500;
    this.set('audit_logs', logs);
  }

  // --- COMPREHENSIVE BACKUP & DATA PORTABILITY ---
  public exportFullBackup(options?: { catalogOnly?: boolean }): string {
    const isCatalogOnly = options?.catalogOnly ?? false;
    const settings = this.getSettings();
    const products = this.getProducts(true);
    const orders = isCatalogOnly ? [] : this.getOrders();
    const invoices = isCatalogOnly ? [] : this.getInvoices();
    const purchases = isCatalogOnly ? [] : this.getPurchases();
    const returns = isCatalogOnly ? [] : this.getReturns();
    const movements = this.getInventoryMovements();
    const customers = isCatalogOnly ? [] : this.getCustomers();
    const auditLogs = isCatalogOnly ? [] : this.getAuditLogs();
    const documents = isCatalogOnly ? [] : this.getDocuments();
    const currencies = this.getCurrencies();
    const channels = this.getSalesChannels();

    const counts: BackupCounts = {
      products: products.length,
      orders: orders.length,
      customers: customers.length,
      movements: movements.length,
      purchases: purchases.length,
      invoices: invoices.length,
      returns: returns.length,
      documents: documents.length,
      audit_logs: auditLogs.length,
    };

    const backup = {
      app_name: 'REYRA Inventory',
      schema_version: '2.0.0',
      exported_at: new Date().toISOString(),
      backup_type: isCatalogOnly ? 'CATALOG_AND_INVENTORY' : 'FULL_SYSTEM_SNAPSHOT',
      company_name: settings.brand_name || settings.company_name || 'REYRA',
      currency: settings.currency_code || 'INR',
      counts,
      settings,
      currencies,
      sales_channels: channels,
      customers,
      products,
      orders,
      invoices,
      purchases,
      returns,
      movements,
      audit_logs: auditLogs,
      documents,
    };
    return JSON.stringify(backup, null, 2);
  }

  public exportDatabaseBackup(catalogOnly: boolean = false): string {
    return this.exportFullBackup({ catalogOnly });
  }

  public inspectBackupFile(jsonString: string): BackupInspectResult {
    try {
      if (!jsonString || typeof jsonString !== 'string' || jsonString.trim().length === 0) {
        return { valid: false, error: 'The provided backup file is empty.' };
      }

      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid file format: Root structure is not a valid JSON object.' };
      }

      // Check if at least one core ERP entity collection is present
      const hasProducts = Array.isArray(data.products);
      const hasOrders = Array.isArray(data.orders);
      const hasCustomers = Array.isArray(data.customers);
      const hasSettings = data.settings && typeof data.settings === 'object';

      if (!hasProducts && !hasOrders && !hasCustomers && !hasSettings) {
        return {
          valid: false,
          error: 'Unrecognized backup structure: File does not contain standard REYRA inventory or sales data.',
        };
      }

      const productsCount = Array.isArray(data.products) ? data.products.length : 0;
      const ordersCount = Array.isArray(data.orders) ? data.orders.length : 0;
      const customersCount = Array.isArray(data.customers) ? data.customers.length : 0;
      const movementsCount = Array.isArray(data.movements) ? data.movements.length : 0;
      const purchasesCount = Array.isArray(data.purchases) ? data.purchases.length : 0;
      const invoicesCount = Array.isArray(data.invoices) ? data.invoices.length : 0;
      const returnsCount = Array.isArray(data.returns) ? data.returns.length : 0;
      const documentsCount = Array.isArray(data.documents) ? data.documents.length : 0;
      const auditLogsCount = Array.isArray(data.audit_logs) ? data.audit_logs.length : 0;

      const summary: BackupSummary = {
        version: data.schema_version || data.version || '1.0.0',
        exported_at: data.exported_at || 'Unknown Date',
        app_name: data.app_name || 'REYRA ERP',
        company_name: data.company_name || data.settings?.brand_name || data.settings?.company_name || 'REYRA Enterprise',
        currency: data.currency || data.settings?.currency_code || 'INR',
        counts: {
          products: productsCount,
          orders: ordersCount,
          customers: customersCount,
          movements: movementsCount,
          purchases: purchasesCount,
          invoices: invoicesCount,
          returns: returnsCount,
          documents: documentsCount,
          audit_logs: auditLogsCount,
        },
        file_size_bytes: new Blob([jsonString]).size,
      };

      return {
        valid: true,
        summary,
        data,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: 'JSON parsing failure: ' + (err?.message || 'Corrupted or malformed file content.'),
      };
    }
  }

  // --- SAFETY RESTORE SNAPSHOT (EMERGENCY ROLLBACK) ---
  public createSafetySnapshot(): boolean {
    try {
      const currentBackup = this.exportFullBackup();
      localStorage.setItem('reyra_safety_rollback_snapshot', currentBackup);
      return true;
    } catch {
      return false;
    }
  }

  public getSafetySnapshotInfo(): { created_at: string; counts: BackupCounts } | null {
    try {
      const raw = localStorage.getItem('reyra_safety_rollback_snapshot');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        created_at: parsed.exported_at || new Date().toISOString(),
        counts: parsed.counts || {
          products: parsed.products?.length || 0,
          orders: parsed.orders?.length || 0,
          customers: parsed.customers?.length || 0,
          movements: parsed.movements?.length || 0,
          purchases: parsed.purchases?.length || 0,
          invoices: parsed.invoices?.length || 0,
          returns: parsed.returns?.length || 0,
        },
      };
    } catch {
      return null;
    }
  }

  public restoreSafetySnapshot(): { success: boolean; error?: string } {
    try {
      const raw = localStorage.getItem('reyra_safety_rollback_snapshot');
      if (!raw) {
        return { success: false, error: 'No safety snapshot found to roll back to.' };
      }
      return this.restoreDatabase(JSON.parse(raw), { mode: 'replace', createSafetyPoint: false });
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to rollback to safety snapshot.' };
    }
  }

  public clearSafetySnapshot(): void {
    localStorage.removeItem('reyra_safety_rollback_snapshot');
  }

  // --- RESTORE DATABASE WITH REPLACE OR MERGE MODES ---
  public restoreDatabase(
    data: any,
    options: { mode: 'replace' | 'merge'; createSafetyPoint?: boolean } = { mode: 'replace', createSafetyPoint: true }
  ): { success: boolean; error?: string; restoredCounts?: BackupCounts } {
    try {
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid backup dataset provided.' };
      }

      // Create an automatic safety point before making irreversible changes
      if (options.createSafetyPoint !== false) {
        this.createSafetySnapshot();
      }

      this.cache.clear();

      if (options.mode === 'replace') {
        // Full clean replace
        if (data.settings && typeof data.settings === 'object') this.set('settings', data.settings);
        if (Array.isArray(data.currencies)) this.set('currencies', data.currencies);
        if (Array.isArray(data.sales_channels)) this.set('sales_channels', data.sales_channels);
        if (Array.isArray(data.customers)) this.set('customers', data.customers);
        if (Array.isArray(data.products)) this.set('products', data.products);
        if (Array.isArray(data.orders)) this.set('orders', data.orders);
        if (Array.isArray(data.invoices)) this.set('invoices', data.invoices);
        if (Array.isArray(data.purchases)) this.set('purchases', data.purchases);
        if (Array.isArray(data.returns)) this.set('returns', data.returns);
        if (Array.isArray(data.movements)) this.set('movements', data.movements);
        if (Array.isArray(data.audit_logs)) this.set('audit_logs', data.audit_logs);
        if (Array.isArray(data.documents)) this.set('documents', data.documents);
      } else {
        // Safe Merge mode: Upsert records without wiping existing data
        if (Array.isArray(data.products)) {
          const current = this.getProducts(true);
          const map = new Map<string, Product>();
          current.forEach(p => map.set(p.id, p));
          data.products.forEach((p: Product) => map.set(p.id, p));
          this.set('products', Array.from(map.values()));
        }

        if (Array.isArray(data.customers)) {
          const current = this.getCustomers();
          const map = new Map<string, Customer>();
          current.forEach(c => map.set(c.id, c));
          data.customers.forEach((c: Customer) => map.set(c.id, c));
          this.set('customers', Array.from(map.values()));
        }

        if (Array.isArray(data.orders)) {
          const current = this.getOrders();
          const map = new Map<string, Order>();
          current.forEach(o => map.set(o.id, o));
          data.orders.forEach((o: Order) => map.set(o.id, o));
          this.set('orders', Array.from(map.values()));
        }

        if (Array.isArray(data.invoices)) {
          const current = this.getInvoices();
          const map = new Map<string, Invoice>();
          current.forEach(i => map.set(i.id, i));
          data.invoices.forEach((i: Invoice) => map.set(i.id, i));
          this.set('invoices', Array.from(map.values()));
        }

        if (Array.isArray(data.purchases)) {
          const current = this.getPurchases();
          const map = new Map<string, Purchase>();
          current.forEach(p => map.set(p.id, p));
          data.purchases.forEach((p: Purchase) => map.set(p.id, p));
          this.set('purchases', Array.from(map.values()));
        }

        if (Array.isArray(data.movements)) {
          const current = this.getInventoryMovements();
          const map = new Map<string, InventoryMovement>();
          current.forEach(m => map.set(m.id, m));
          data.movements.forEach((m: InventoryMovement) => map.set(m.id, m));
          this.set('movements', Array.from(map.values()));
        }

        if (Array.isArray(data.returns)) {
          const current = this.getReturns();
          const map = new Map<string, OrderReturn>();
          current.forEach(r => map.set(r.id, r));
          data.returns.forEach((r: OrderReturn) => map.set(r.id, r));
          this.set('returns', Array.from(map.values()));
        }
      }

      // Refresh in-memory cache
      this.cache.clear();

      const finalCounts: BackupCounts = {
        products: this.getProducts(true).length,
        orders: this.getOrders().length,
        customers: this.getCustomers().length,
        movements: this.getInventoryMovements().length,
        purchases: this.getPurchases().length,
        invoices: this.getInvoices().length,
        returns: this.getReturns().length,
      };

      this.addAuditLog(
        'DATABASE_BACKUP_RESTORED',
        'SYSTEM',
        'database',
        `Restored database in ${options.mode.toUpperCase()} mode. Products: ${finalCounts.products}, Orders: ${finalCounts.orders}`
      );

      return { success: true, restoredCounts: finalCounts };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Restore procedure failed.' };
    }
  }

  public importDatabaseBackup(
    jsonString: string,
    mode: 'replace' | 'merge' = 'replace'
  ): { success: boolean; error?: string; restoredCounts?: BackupCounts } {
    const inspected = this.inspectBackupFile(jsonString);
    if (!inspected.valid || !inspected.data) {
      return { success: false, error: inspected.error || 'Failed to inspect backup archive.' };
    }
    return this.restoreDatabase(inspected.data, { mode, createSafetyPoint: true });
  }

  public resetToSampleData(): void {
    this.resetToDefaults();
  }

  public getLowStockProducts(threshold?: number): Product[] {
    const limit = threshold !== undefined ? threshold : this.getSettings().low_stock_threshold;
    return this.getProducts(false).filter(p => p.units <= limit);
  }

  public findProductByBarcodeOrSku(skuOrBarcode: string): { product: Product; variant?: ProductVariant } | null {
    return this.findProductOrVariantBySKU(skuOrBarcode);
  }

  public cancelOrder(orderId: string, _restoreInventory: boolean = true): { success: boolean; error?: string } {
    return this.updateOrderStatus(orderId, 'Cancelled');
  }

  public generateInvoiceForOrder(orderId: string): { success: boolean; invoice?: Invoice; error?: string } {
    return this.createInvoiceFromOrder(orderId);
  }

  public receivePurchaseOrder(poId: string): { success: boolean; error?: string } {
    const purchases = this.getPurchases();
    const po = purchases.find(p => p.id === poId);
    if (!po) return { success: false, error: 'Purchase Order not found.' };

    if (po.status === 'Received') {
      return { success: true };
    }

    const products = this.get<Product[]>('products', initialProducts);

    for (const item of po.items) {
      const prod = products.find(p => p.id === item.product_id);
      if (!prod) continue;

      let balanceAfter = 0;
      const unitCost = item.unit_cost !== undefined ? item.unit_cost : (item.purchased_price || 0);

      if (item.variant_id && prod.variants) {
        const v = prod.variants.find(varItem => varItem.id === item.variant_id);
        if (v) {
          v.units += item.quantity;
          balanceAfter = v.units;
          if (unitCost > 0) {
            v.buy_price = unitCost;
          }
          prod.units = prod.variants.reduce((acc, curr) => acc + curr.units, 0);
        }
      } else {
        prod.units += item.quantity;
        balanceAfter = prod.units;
        if (unitCost > 0) {
          prod.buy_price = unitCost;
        }
      }

      this.recordMovement({
        product_id: prod.id,
        product_name: prod.name,
        variant_id: item.variant_id,
        variant_name: item.variant_name,
        sku: item.sku,
        movement_type: 'purchase',
        quantity_changed: item.quantity,
        balance_after: balanceAfter,
        reference_id: po.id,
        reference_number: po.po_number || po.purchase_number || po.id,
        reason: `Purchase PO ${po.po_number || po.purchase_number} received into stock`,
        created_by: 'System Admin',
      });
    }

    this.set('products', products);

    po.status = 'Received';
    this.set('purchases', purchases);

    const poIdentifier = po.po_number || po.purchase_number || po.id;
    this.addAuditLog('PURCHASE_RECEIVED', 'PURCHASE', poIdentifier, `PO #${poIdentifier} marked as Received, inventory restocked`);
    return { success: true };
  }

  public processReturn(data: {
    order_id: string;
    order_number: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    product_id: string;
    variant_id?: string;
    product_name: string;
    variant_name?: string;
    sku: string;
    quantity_returned: number;
    refund_amount: number;
    reason: string;
    notes?: string;
    refund_status: 'Pending' | 'Processed' | 'Rejected' | 'Refunded' | 'Store Credit';
    restock_inventory: boolean;
  }): { success: boolean; error?: string } {
    const res = this.createReturn({
      order_id: data.order_id,
      return_date: new Date().toISOString().split('T')[0],
      reason: data.reason,
      notes: data.notes,
      items: [
        {
          product_id: data.product_id,
          variant_id: data.variant_id,
          quantity_returned: data.quantity_returned,
          condition: 'Good',
          restock_inventory: data.restock_inventory,
        },
      ],
    });

    return { success: res.success, error: res.error };
  }
}

export const db = new ERPDatabase();
