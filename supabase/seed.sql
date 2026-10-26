-- ==========================================================
-- SEED DATA FOR ENTERPRISE INVENTORY, SALES & PURCHASES
-- ==========================================================

INSERT INTO business_settings (
    brand_name, company_address, company_phone, company_email, tax_id, default_currency_code, allow_negative_stock, low_stock_threshold, invoice_prefix, purchase_prefix, terms_and_conditions
) VALUES (
    'Apex Dynamics',
    'Plot 42, Tech Park Central, Sector 18, Bangalore, KA 560100',
    '+91 98765 43210',
    'billing@apexdynamics.com',
    '29ABCDE1234F1Z5',
    'INR',
    false,
    10,
    'INV-',
    'PO-',
    '1. Goods once sold will only be accepted for return within 7 days in original condition.\n2. Warranty as per manufacturer terms.\n3. Payment is due within 15 days of invoice date.'
) ON CONFLICT DO NOTHING;

INSERT INTO currencies (name, code, symbol, decimal_precision, is_active, is_default) VALUES
('Indian Rupee', 'INR', '₹', 2, true, true),
('US Dollar', 'USD', '$', 2, true, false),
('Euro', 'EUR', '€', 2, true, false),
('British Pound', 'GBP', '£', 2, true, false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO sales_channels (name, code, is_active) VALUES
('Offline Store', 'OFFLINE', true),
('Official Website', 'WEBSITE', true),
('Amazon India', 'AMAZON', true),
('Instagram Direct', 'INSTAGRAM', true)
ON CONFLICT (code) DO NOTHING;
