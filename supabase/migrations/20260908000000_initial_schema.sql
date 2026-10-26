-- ==========================================================
-- ENTERPRISE INVENTORY, SALES & PURCHASE MANAGEMENT SCHEMA
-- PostgreSQL & Supabase Migration: 20260908000000_initial_schema.sql
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'sales', 'inventory', 'purchase', 'viewer');

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'admin' NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. BUSINESS SETTINGS
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name TEXT NOT NULL DEFAULT 'Apex Dynamics',
    brand_logo TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_email TEXT,
    tax_id TEXT, -- GSTIN / Tax identification number
    default_currency_code TEXT DEFAULT 'INR' NOT NULL,
    allow_negative_stock BOOLEAN DEFAULT false NOT NULL,
    low_stock_threshold INTEGER DEFAULT 10 NOT NULL,
    invoice_prefix TEXT DEFAULT 'INV-' NOT NULL,
    order_prefix TEXT DEFAULT '' NOT NULL,
    purchase_prefix TEXT DEFAULT 'PO-' NOT NULL,
    terms_and_conditions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. CURRENCIES
CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    symbol TEXT NOT NULL,
    decimal_precision INTEGER DEFAULT 2 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. SALES CHANNELS
CREATE TABLE IF NOT EXISTS sales_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    total_orders INTEGER DEFAULT 0 NOT NULL,
    total_spent NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    last_order_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 6. PRODUCTS
CREATE TYPE product_item_type AS ENUM ('single', 'variant');

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sourcing_agency TEXT,
    item_type product_item_type DEFAULT 'single' NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    units INTEGER DEFAULT 0 NOT NULL,
    buy_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    selling_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    mrp NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    discount NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    images JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(is_archived);

-- 7. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    units INTEGER DEFAULT 0 NOT NULL,
    buy_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    selling_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    mrp NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    discount NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);

-- 8. ORDERS
CREATE TYPE order_status AS ENUM ('Received', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned');
CREATE TYPE payment_method_type AS ENUM ('Cash', 'Card', 'UPI', 'Bank Transfer', 'Other');

CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    order_date DATE DEFAULT CURRENT_DATE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    payment_method payment_method_type DEFAULT 'UPI' NOT NULL,
    sales_channel_id UUID REFERENCES sales_channels(id) ON DELETE SET NULL,
    sales_channel_name TEXT NOT NULL,
    status order_status DEFAULT 'Received' NOT NULL,
    subtotal NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    discount_total NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    tax_total NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    currency_code TEXT DEFAULT 'INR' NOT NULL,
    currency_symbol TEXT DEFAULT '₹' NOT NULL,
    is_invoiced BOOLEAN DEFAULT false NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- 9. ORDER ITEMS (Immutable Historical Snapshot)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    variant_name_snapshot TEXT,
    sku_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    rate_snapshot NUMERIC(12, 2) NOT NULL,
    discount_snapshot NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 10. INVENTORY MOVEMENTS (Auditable Ledger)
CREATE TYPE movement_action_type AS ENUM ('sale', 'purchase', 'return', 'adjustment', 'cancellation');

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    variant_name TEXT,
    sku TEXT NOT NULL,
    movement_type movement_action_type NOT NULL,
    quantity_changed INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_id TEXT,
    reference_number TEXT,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by TEXT DEFAULT 'System Admin' NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_sku ON inventory_movements(sku);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON inventory_movements(created_at);

-- 11. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    customer_address TEXT,
    payment_method TEXT NOT NULL,
    sales_channel_name TEXT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_total NUMERIC(12, 2) NOT NULL,
    tax_total NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency_code TEXT NOT NULL,
    currency_symbol TEXT NOT NULL,
    status TEXT DEFAULT 'Paid' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- 12. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL
);

-- 13. PURCHASES
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_number TEXT UNIQUE NOT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE NOT NULL,
    sourcing_agency TEXT NOT NULL,
    item_count INTEGER DEFAULT 0 NOT NULL,
    purchase_amount NUMERIC(12, 2) NOT NULL,
    gst_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    delivery_charge NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    grand_total NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_number ON purchases(purchase_number);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);

-- 14. PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    variant_name TEXT,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    purchased_price NUMERIC(12, 2) NOT NULL,
    gst_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    delivery_charge NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_line NUMERIC(12, 2) NOT NULL
);

-- 15. RETURNS
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number TEXT UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    return_date DATE DEFAULT CURRENT_DATE NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    refund_status TEXT DEFAULT 'Processed' NOT NULL,
    total_refund_amount NUMERIC(12, 2) NOT NULL,
    currency_code TEXT DEFAULT 'INR' NOT NULL,
    currency_symbol TEXT DEFAULT '₹' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_returns_number ON returns(return_number);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date);

-- 16. RETURN ITEMS
CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    sku TEXT NOT NULL,
    quantity_returned INTEGER NOT NULL,
    rate NUMERIC(12, 2) NOT NULL,
    refund_amount NUMERIC(12, 2) NOT NULL,
    condition TEXT DEFAULT 'Good' NOT NULL,
    restock_inventory BOOLEAN DEFAULT true NOT NULL
);

-- 17. DOCUMENTS REGISTRY
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    title TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    customer_or_vendor TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency_code TEXT NOT NULL,
    currency_symbol TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(date);

-- 18. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name TEXT DEFAULT 'Admin' NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users with valid profile access
CREATE POLICY "Authenticated users can select all records" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Enterprise RLS: Read access for authenticated staff; write restricted to manager/admin
CREATE POLICY "Staff can read business settings" ON business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can update business settings" ON business_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
);

CREATE POLICY "Staff can read currencies" ON currencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage currencies" ON currencies FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
);

CREATE POLICY "Staff can read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage products" ON products FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'inventory'))
);

CREATE POLICY "Staff can read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage orders" ON orders FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'sales'))
);

CREATE POLICY "Staff can read inventory movements" ON inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert movements" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can read invoices" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can create invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can read purchases" ON purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage purchases" ON purchases FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'purchase'))
);

CREATE POLICY "Staff can read returns" ON returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage returns" ON returns FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'sales'))
);

CREATE POLICY "Staff can read documents" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can read audit logs" ON audit_logs FOR SELECT TO authenticated USING (true);
