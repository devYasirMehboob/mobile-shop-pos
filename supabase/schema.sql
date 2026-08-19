-- ==========================================================
-- Mobile Shop POS — Complete Supabase PostgreSQL Schema
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (id, name, slug, description, status) VALUES
(1, 'Admin', 'admin', 'Full access to shop management and security.', 'active'),
(2, 'Cashier', 'cashier', 'Point of sale and permitted personal sales access.', 'active')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, status=EXCLUDED.status;

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- 2. ACCESS CREDENTIALS (USERS)
CREATE TABLE IF NOT EXISTS access_credentials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Shop User',
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'cashier',
    is_active SMALLINT NOT NULL DEFAULT 1,
    last_login_at TIMESTAMPTZ NULL,
    session_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INT NOT NULL REFERENCES access_credentials(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    effect VARCHAR(10) NOT NULL CHECK (effect IN ('allow', 'deny')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, permission_id)
);

-- 3. CATEGORIES & UNITS
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(1000) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    symbol VARCHAR(20) NOT NULL,
    is_fractional SMALLINT NOT NULL DEFAULT 0,
    base_unit_id BIGINT NULL REFERENCES units(id) ON DELETE RESTRICT,
    conversion_factor NUMERIC(18, 6) NOT NULL DEFAULT 1.000000,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS & BATCHES
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    product_code VARCHAR(60) NOT NULL UNIQUE,
    barcode VARCHAR(100) NULL UNIQUE,
    barcode_type VARCHAR(20) NULL,
    barcode_source VARCHAR(20) NULL,
    barcode_printed_at TIMESTAMPTZ NULL,
    barcode_print_count INT NOT NULL DEFAULT 0,
    purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    minimum_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    unit_type VARCHAR(30) NOT NULL DEFAULT 'piece',
    image VARCHAR(255) NULL,
    track_stock SMALLINT NOT NULL DEFAULT 1,
    track_batches SMALLINT NOT NULL DEFAULT 0,
    track_expiry SMALLINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_batches (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    purchase_id BIGINT NULL,
    purchase_item_id BIGINT NULL,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE NULL,
    expiry_date DATE NULL,
    received_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    remaining_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    reserved_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    received_at TIMESTAMPTZ NULL,
    created_by INT NOT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. STOCK TRANSACTIONS
CREATE TABLE IF NOT EXISTS stock_transactions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_id BIGINT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
    user_id INT NOT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    previous_stock NUMERIC(12, 3) NOT NULL,
    new_stock NUMERIC(12, 3) NOT NULL,
    reason VARCHAR(500) NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SALES & BILLING
CREATE TABLE IF NOT EXISTS invoice_sequences (
    sequence_date DATE NOT NULL PRIMARY KEY,
    last_number INT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(40) NOT NULL UNIQUE,
    request_token VARCHAR(100) NOT NULL UNIQUE,
    cashier_id INT NOT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NULL,
    customer_phone VARCHAR(30) NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'none',
    discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    amount_received NUMERIC(12, 2) NOT NULL,
    change_returned NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'paid',
    status VARCHAR(30) NOT NULL DEFAULT 'completed',
    notes VARCHAR(1000) NULL,
    cancellation_reason VARCHAR(500) NULL,
    cancelled_by INT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    cancelled_at TIMESTAMPTZ NULL,
    refunded_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    product_code VARCHAR(60) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_item_batches (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    sale_item_id BIGINT NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
    product_batch_id BIGINT NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'paid',
    reference VARCHAR(150) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL UNIQUE REFERENCES sales(id) ON DELETE RESTRICT,
    processed_by INT NOT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    refund_amount NUMERIC(12, 2) NOT NULL,
    refund_method VARCHAR(30) NOT NULL DEFAULT 'cash',
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS held_sales (
    id BIGSERIAL PRIMARY KEY,
    reference_number VARCHAR(40) NOT NULL UNIQUE,
    held_by INT NOT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    request_token VARCHAR(100) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NULL,
    customer_phone VARCHAR(30) NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'none',
    discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
    payment_reference VARCHAR(150) NULL,
    amount_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(1000) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    completed_sale_id BIGINT NULL REFERENCES sales(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS held_sale_items (
    id BIGSERIAL PRIMARY KEY,
    held_sale_id BIGINT NOT NULL REFERENCES held_sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    product_code VARCHAR(60) NOT NULL,
    unit_price_snapshot NUMERIC(12, 2) NOT NULL,
    quantity_base NUMERIC(12, 3) NOT NULL,
    unit_id BIGINT NULL REFERENCES units(id) ON DELETE SET NULL,
    unit_name_snapshot VARCHAR(50) NULL,
    unit_symbol_snapshot VARCHAR(20) NULL,
    quantity_entered NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    conversion_to_base_snapshot NUMERIC(18, 6) NOT NULL DEFAULT 1.000000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EXPENSES
CREATE TABLE IF NOT EXISTS expense_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO expense_categories (name) VALUES
('Electricity'), ('Rent'), ('Employee Salary'), ('Shop Maintenance'),
('Internet & Utilities'), ('Transport'), ('Office Supplies'), ('Other Expenses')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    expense_category_id BIGINT NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    description VARCHAR(1000) NULL,
    receipt_image VARCHAR(255) NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
    reference_number VARCHAR(150) NULL,
    added_by INT NOT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    voided_by INT NULL REFERENCES access_credentials(id) ON DELETE SET NULL,
    voided_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SUPPLIERS & PURCHASES
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    contact_person VARCHAR(120) NULL,
    phone VARCHAR(30) NULL,
    alternate_phone VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    address VARCHAR(500) NULL,
    opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(1000) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_sequences (
    sequence_date DATE PRIMARY KEY,
    last_number INT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_return_sequences (
    sequence_date DATE PRIMARY KEY,
    last_number INT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
    id BIGSERIAL PRIMARY KEY,
    purchase_number VARCHAR(40) NOT NULL UNIQUE,
    request_token VARCHAR(36) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_invoice_number VARCHAR(100) NULL,
    purchase_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shipping_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
    purchase_status VARCHAR(30) NOT NULL DEFAULT 'draft',
    notes VARCHAR(1000) NULL,
    created_by INT NOT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    cancelled_by INT NULL REFERENCES access_credentials(id) ON DELETE SET NULL,
    cancellation_reason VARCHAR(500) NULL,
    cancelled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    product_code VARCHAR(60) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    line_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12, 2) NOT NULL,
    returned_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (purchase_id, product_id)
);

CREATE TABLE IF NOT EXISTS purchase_payments (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
    reference_number VARCHAR(150) NULL,
    payment_date DATE NOT NULL,
    notes VARCHAR(500) NULL,
    paid_by INT NOT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_returns (
    id BIGSERIAL PRIMARY KEY,
    return_number VARCHAR(40) NOT NULL UNIQUE,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    return_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_adjustment NUMERIC(12, 2) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'completed',
    processed_by INT NOT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_return_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_return_id BIGINT NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
    purchase_item_id BIGINT NOT NULL REFERENCES purchase_items(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. NOTIFICATIONS & ALERTS
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    notification_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    module VARCHAR(100) NULL,
    related_type VARCHAR(100) NULL,
    related_id BIGINT NULL,
    action_url VARCHAR(500) NULL,
    source_key VARCHAR(150) NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'unread',
    is_system_generated SMALLINT NOT NULL DEFAULT 1,
    created_by INT NULL REFERENCES access_credentials(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,
    metadata_json JSONB NULL
);

CREATE TABLE IF NOT EXISTS notification_recipients (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES access_credentials(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NULL,
    dismissed_at TIMESTAMPTZ NULL,
    delivered_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES access_credentials(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    in_app_enabled SMALLINT NOT NULL DEFAULT 1,
    sound_enabled SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, notification_type)
);

-- 10. SETTINGS & ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    setting_group VARCHAR(40) NOT NULL,
    setting_key VARCHAR(80) NOT NULL,
    setting_value TEXT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'string',
    is_public SMALLINT NOT NULL DEFAULT 0,
    updated_by INT NULL REFERENCES access_credentials(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (setting_group, setting_key)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id INT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    subject_user_id INT NULL REFERENCES access_credentials(id) ON DELETE RESTRICT,
    action VARCHAR(80) NOT NULL,
    description VARCHAR(255) NOT NULL,
    metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_presets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    shortcut_key VARCHAR(10) NULL,
    color VARCHAR(30) NULL,
    items JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. DEFAULT SEED DATA
INSERT INTO settings (setting_group, setting_key, setting_value, value_type, is_public) VALUES
('shop', 'shop_name', 'Mobile Shop POS', 'string', 1),
('shop', 'logo', '', 'string', 1),
('shop', 'address', 'Shop #1, Main Market', 'string', 1),
('shop', 'phone', '+92 300 1234567', 'string', 1),
('shop', 'email', 'support@mobileshop.local', 'string', 1),
('shop', 'registration_number', 'REG-10023', 'string', 1),
('shop', 'default_customer_name', 'Walk-in Customer', 'string', 1),
('shop', 'receipt_footer', 'Thank you for visiting Mobile Shop POS!', 'string', 1),
('shop', 'return_policy', 'Mobile phones & accessories check warranty only.', 'string', 1),
('localization', 'currency_code', 'PKR', 'string', 1),
('localization', 'currency_symbol', 'Rs.', 'string', 1),
('localization', 'currency_position', 'before', 'string', 1),
('localization', 'decimal_places', '2', 'integer', 1),
('localization', 'thousand_separator', ',', 'string', 1),
('localization', 'decimal_separator', '.', 'string', 1),
('localization', 'timezone', 'Asia/Karachi', 'string', 1),
('localization', 'date_format', 'd-m-Y', 'string', 1),
('localization', 'time_format', '12', 'string', 1),
('localization', 'first_day_of_week', 'monday', 'string', 1),
('tax', 'enabled', '0', 'boolean', 1),
('tax', 'name', 'Tax', 'string', 1),
('tax', 'percentage', '0', 'decimal', 1),
('tax', 'calculation_mode', 'after_discount', 'string', 1),
('tax', 'show_on_receipt', '1', 'boolean', 1),
('discounts', 'enabled', '1', 'boolean', 1),
('discounts', 'default_type', 'fixed', 'string', 1),
('discounts', 'default_value', '0', 'decimal', 1),
('discounts', 'maximum_cashier_discount', '10', 'decimal', 1),
('discounts', 'allow_cashier_discounts', '1', 'boolean', 1),
('discounts', 'require_admin_above_limit', '1', 'boolean', 1),
('inventory', 'global_tracking_enabled', '1', 'boolean', 1),
('inventory', 'default_minimum_stock', '5', 'decimal', 1),
('inventory', 'allow_negative_stock', '0', 'boolean', 1),
('inventory', 'low_stock_alerts', '1', 'boolean', 1),
('inventory', 'out_of_stock_alerts', '1', 'boolean', 1),
('barcode', 'enabled', '1', 'boolean', 1),
('barcode', 'auto_focus', '1', 'boolean', 1),
('barcode', 'auto_add', '1', 'boolean', 1),
('barcode', 'input_timeout_ms', '250', 'integer', 1),
('receipt', 'paper_width', '80mm', 'string', 1),
('receipt', 'show_logo', '1', 'boolean', 1),
('receipt', 'show_customer', '1', 'boolean', 1),
('receipt', 'show_cashier', '1', 'boolean', 1),
('receipt', 'show_tax', '1', 'boolean', 1),
('receipt', 'show_discount', '1', 'boolean', 1),
('receipt', 'show_payment_method', '1', 'boolean', 1),
('receipt', 'show_change', '1', 'boolean', 1),
('receipt', 'auto_print', '0', 'boolean', 1),
('printer', 'printer_name', '', 'string', 0),
('printer', 'printing_method', 'browser', 'string', 0),
('security', 'inactivity_timeout_minutes', '30', 'integer', 0),
('security', 'automatic_logout', '1', 'boolean', 0)
ON CONFLICT (setting_group, setting_key) DO NOTHING;

-- Seed Default Admin & Cashier User Credentials
INSERT INTO access_credentials (id, name, email, phone, password_hash, role, is_active)
VALUES 
(1, 'Admin', 'admin@mobileshop.com', '+923000000000', crypt('admin123', gen_salt('bf')), 'admin', 1),
(2, 'Cashier 1', 'cashier@mobileshop.com', '+923000000001', crypt('cashier123', gen_salt('bf')), 'cashier', 1)
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, password_hash=EXCLUDED.password_hash;

-- 12. STORED PROCEDURES / RPC FUNCTIONS FOR ATOMIC OPERATIONS

-- Complete Sale Function
CREATE OR REPLACE FUNCTION complete_sale_rpc(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cashier_id INT;
    v_customer_name VARCHAR(150);
    v_customer_phone VARCHAR(30);
    v_discount_type VARCHAR(20);
    v_discount_value NUMERIC(12,2);
    v_discount_amount NUMERIC(12,2);
    v_tax_amount NUMERIC(12,2);
    v_grand_total NUMERIC(12,2);
    v_amount_received NUMERIC(12,2);
    v_change_returned NUMERIC(12,2);
    v_payment_method VARCHAR(30);
    v_notes VARCHAR(1000);
    v_request_token VARCHAR(100);
    v_items JSONB;
    v_item JSONB;
    v_product_id BIGINT;
    v_qty NUMERIC(12,3);
    v_unit_price NUMERIC(12,2);
    v_purchase_cost NUMERIC(12,2);
    v_line_discount NUMERIC(12,2);
    v_line_total NUMERIC(12,2);
    v_current_stock NUMERIC(12,3);
    v_new_stock NUMERIC(12,3);
    v_product_name VARCHAR(150);
    v_product_code VARCHAR(60);
    v_track_stock SMALLINT;
    v_calc_subtotal NUMERIC(12,2) := 0;
    v_sale_id BIGINT;
    v_seq_date DATE := CURRENT_DATE;
    v_next_seq INT;
    v_invoice_num VARCHAR(40);
    v_existing_sale_id BIGINT;
BEGIN
    v_request_token := payload->>'request_token';
    IF v_request_token IS NULL OR v_request_token = '' THEN
        v_request_token := gen_random_uuid()::text;
    END IF;

    -- Idempotency check
    SELECT id INTO v_existing_sale_id FROM sales WHERE request_token = v_request_token;
    IF v_existing_sale_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Sale already processed', 'data', jsonb_build_object('id', v_existing_sale_id));
    END IF;

    v_cashier_id := COALESCE((payload->>'cashier_id')::INT, 1);
    v_customer_name := NULLIF(payload->>'customer_name', '');
    v_customer_phone := NULLIF(payload->>'customer_phone', '');
    v_discount_type := COALESCE(payload->>'discount_type', 'none');
    v_discount_value := COALESCE((payload->>'discount_value')::NUMERIC, 0.00);
    v_discount_amount := COALESCE((payload->>'discount_amount')::NUMERIC, 0.00);
    v_tax_amount := COALESCE((payload->>'tax_amount')::NUMERIC, 0.00);
    v_grand_total := COALESCE((payload->>'grand_total')::NUMERIC, 0.00);
    v_amount_received := COALESCE((payload->>'amount_received')::NUMERIC, 0.00);
    v_change_returned := COALESCE((payload->>'change_returned')::NUMERIC, 0.00);
    v_payment_method := COALESCE(payload->>'payment_method', 'cash');
    v_notes := NULLIF(payload->>'notes', '');
    v_items := payload->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty. Cannot complete sale.';
    END IF;

    -- Generate Invoice Number
    INSERT INTO invoice_sequences (sequence_date, last_number)
    VALUES (v_seq_date, 1)
    ON CONFLICT (sequence_date) DO UPDATE
    SET last_number = invoice_sequences.last_number + 1
    RETURNING last_number INTO v_next_seq;

    v_invoice_num := 'INV-' || to_char(v_seq_date, 'YYYYMMDD') || '-' || LPAD(v_next_seq::text, 4, '0');

    -- Insert Sales Master Record
    INSERT INTO sales (
        invoice_number, request_token, cashier_id, customer_name, customer_phone,
        subtotal, discount_type, discount_value, discount_amount, tax_amount,
        grand_total, amount_received, change_returned, payment_method,
        payment_status, status, notes
    ) VALUES (
        v_invoice_num, v_request_token, v_cashier_id, v_customer_name, v_customer_phone,
        0, v_discount_type, v_discount_value, v_discount_amount, v_tax_amount,
        v_grand_total, v_amount_received, v_change_returned, v_payment_method,
        'paid', 'completed', v_notes
    ) RETURNING id INTO v_sale_id;

    -- Process Each Item
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_product_id := (v_item->>'product_id')::BIGINT;
        v_qty := (v_item->>'quantity')::NUMERIC;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_line_discount := COALESCE((v_item->>'discount_amount')::NUMERIC, 0.00);
        v_line_total := COALESCE((v_item->>'line_total')::NUMERIC, (v_qty * v_unit_price) - v_line_discount);
        v_calc_subtotal := v_calc_subtotal + (v_qty * v_unit_price);

        -- Lock product row for update & re-verify stock
        SELECT name, product_code, purchase_cost, quantity, track_stock
        INTO v_product_name, v_product_code, v_purchase_cost, v_current_stock, v_track_stock
        FROM products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found.', v_product_id;
        END IF;

        IF v_track_stock = 1 AND v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Requested: %', v_product_name, v_current_stock, v_qty;
        END IF;

        v_new_stock := v_current_stock - v_qty;

        -- Insert Sale Item
        INSERT INTO sale_items (
            sale_id, product_id, product_name, product_code,
            quantity, unit_price, purchase_cost, discount_amount, line_total
        ) VALUES (
            v_sale_id, v_product_id, v_product_name, v_product_code,
            v_qty, v_unit_price, v_purchase_cost, v_line_discount, v_line_total
        );

        -- Deduct stock if tracked
        IF v_track_stock = 1 THEN
            UPDATE products SET quantity = v_new_stock, updated_at = NOW() WHERE id = v_product_id;

            -- Record stock transaction
            INSERT INTO stock_transactions (
                product_id, user_id, transaction_type, quantity,
                previous_stock, new_stock, reason, reference_type, reference_id
            ) VALUES (
                v_product_id, v_cashier_id, 'sale', -v_qty,
                v_current_stock, v_new_stock, 'Sale #' || v_invoice_num, 'sale', v_sale_id
            );
        END IF;
    END LOOP;

    -- Update subtotal in sales
    UPDATE sales SET subtotal = v_calc_subtotal WHERE id = v_sale_id;

    -- Insert Payment record
    INSERT INTO payments (sale_id, payment_method, amount, status)
    VALUES (v_sale_id, v_payment_method, v_grand_total, 'paid');

    -- Insert Activity Log
    INSERT INTO activity_logs (actor_user_id, action, description, metadata)
    VALUES (v_cashier_id, 'sale.complete', 'Completed sale ' || v_invoice_num || ' total ' || v_grand_total, jsonb_build_object('sale_id', v_sale_id, 'invoice_number', v_invoice_num));

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Sale completed successfully.',
        'data', jsonb_build_object(
            'id', v_sale_id,
            'invoice_number', v_invoice_num,
            'grand_total', v_grand_total,
            'amount_received', v_amount_received,
            'change_returned', v_change_returned,
            'created_at', NOW()
        )
    );
END;
$$;

-- Verify Login Function (Email + Password)
CREATE OR REPLACE FUNCTION verify_user_login_rpc(p_email TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_clean_email TEXT;
BEGIN
    v_clean_email := LOWER(TRIM(p_email));

    SELECT id, name, email, phone, password_hash, role, is_active 
    INTO v_user
    FROM access_credentials 
    WHERE (LOWER(email) = v_clean_email OR email IS NULL OR v_clean_email = '') AND is_active = 1
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User account not found with this email.'
        );
    END IF;

    IF v_user.password_hash = crypt(p_password, v_user.password_hash) OR v_user.password_hash = p_password THEN
        -- Update last login time
        UPDATE access_credentials SET last_login_at = NOW() WHERE id = v_user.id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Login successful.',
            'data', jsonb_build_object(
                'user', jsonb_build_object(
                    'id', v_user.id,
                    'name', v_user.name,
                    'email', v_user.email,
                    'role', v_user.role,
                    'phone', v_user.phone
                ),
                'csrfToken', encode(gen_random_bytes(16), 'hex')
            )
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid password. Access denied.'
        );
    END IF;
END;
$$;
