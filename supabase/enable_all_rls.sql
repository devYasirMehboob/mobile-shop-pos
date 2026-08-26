-- ==========================================================
-- Mobile Shop POS — Enable Row Level Security (RLS) on All Tables
-- Enables RLS across all 32 public tables and creates
-- clean, fully-permissive policies for anon and authenticated
-- clients so the POS operates seamlessly with RLS protection active.
-- ==========================================================

-- 1. ROLES & PERMISSIONS
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to roles" ON roles;
CREATE POLICY "Allow all access to roles" ON roles FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to permissions" ON permissions;
CREATE POLICY "Allow all access to permissions" ON permissions FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to role_permissions" ON role_permissions;
CREATE POLICY "Allow all access to role_permissions" ON role_permissions FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS access_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to access_credentials" ON access_credentials;
CREATE POLICY "Allow all access to access_credentials" ON access_credentials FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to user_permissions" ON user_permissions;
CREATE POLICY "Allow all access to user_permissions" ON user_permissions FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. CATEGORIES & UNITS
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to categories" ON categories;
CREATE POLICY "Allow all access to categories" ON categories FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to units" ON units;
CREATE POLICY "Allow all access to units" ON units FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. PRODUCTS & BATCHES
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to products" ON products;
CREATE POLICY "Allow all access to products" ON products FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS product_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to product_batches" ON product_batches;
CREATE POLICY "Allow all access to product_batches" ON product_batches FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS stock_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to stock_transactions" ON stock_transactions;
CREATE POLICY "Allow all access to stock_transactions" ON stock_transactions FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. SALES, BILLING & REFUNDS
ALTER TABLE IF EXISTS invoice_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to invoice_sequences" ON invoice_sequences;
CREATE POLICY "Allow all access to invoice_sequences" ON invoice_sequences FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to sales" ON sales;
CREATE POLICY "Allow all access to sales" ON sales FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to sale_items" ON sale_items;
CREATE POLICY "Allow all access to sale_items" ON sale_items FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS sale_item_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to sale_item_batches" ON sale_item_batches;
CREATE POLICY "Allow all access to sale_item_batches" ON sale_item_batches FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to payments" ON payments;
CREATE POLICY "Allow all access to payments" ON payments FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to refunds" ON refunds;
CREATE POLICY "Allow all access to refunds" ON refunds FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS held_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to held_sales" ON held_sales;
CREATE POLICY "Allow all access to held_sales" ON held_sales FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS held_sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to held_sale_items" ON held_sale_items;
CREATE POLICY "Allow all access to held_sale_items" ON held_sale_items FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. EXPENSES
ALTER TABLE IF EXISTS expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to expense_categories" ON expense_categories;
CREATE POLICY "Allow all access to expense_categories" ON expense_categories FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to expenses" ON expenses;
CREATE POLICY "Allow all access to expenses" ON expenses FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. SUPPLIERS & PURCHASES
ALTER TABLE IF EXISTS suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to suppliers" ON suppliers;
CREATE POLICY "Allow all access to suppliers" ON suppliers FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS purchase_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to purchase_sequences" ON purchase_sequences;
CREATE POLICY "Allow all access to purchase_sequences" ON purchase_sequences FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS purchase_return_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to purchase_return_sequences" ON purchase_return_sequences;
CREATE POLICY "Allow all access to purchase_return_sequences" ON purchase_return_sequences FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to purchases" ON purchases;
CREATE POLICY "Allow all access to purchases" ON purchases FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS purchase_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to purchase_items" ON purchase_items;
CREATE POLICY "Allow all access to purchase_items" ON purchase_items FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS purchase_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to purchase_payments" ON purchase_payments;
CREATE POLICY "Allow all access to purchase_payments" ON purchase_payments FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS purchase_returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to purchase_returns" ON purchase_returns;
CREATE POLICY "Allow all access to purchase_returns" ON purchase_returns FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS purchase_return_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to purchase_return_items" ON purchase_return_items;
CREATE POLICY "Allow all access to purchase_return_items" ON purchase_return_items FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. NOTIFICATIONS & ALERTS
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to notifications" ON notifications;
CREATE POLICY "Allow all access to notifications" ON notifications FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS notification_recipients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to notification_recipients" ON notification_recipients;
CREATE POLICY "Allow all access to notification_recipients" ON notification_recipients FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to notification_preferences" ON notification_preferences;
CREATE POLICY "Allow all access to notification_preferences" ON notification_preferences FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. ACTIVITY LOGS
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to activity_logs" ON activity_logs;
CREATE POLICY "Allow all access to activity_logs" ON activity_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- 9. GRANTS TO ANON AND AUTHENTICATED ROLES
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
