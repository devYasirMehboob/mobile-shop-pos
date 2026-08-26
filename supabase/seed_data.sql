-- ==========================================================
-- Mobile Shop POS — Master Seed Data Migration
-- Comprehensive realistic test data for all modules:
-- Categories, Units, Products, Batches, Inventory,
-- Suppliers, Purchases, Purchase Returns, Expenses,
-- Sales, Sale Items, Stock Transactions & Notifications.
-- ==========================================================

-- 1. BASE UNITS
INSERT INTO units (name, symbol, unit_type, precision, is_fractional, conversion_factor, status) VALUES
('Piece', 'Pcs', 'count', 0, 0, 1.000000, 'active'),
('Box', 'Box', 'count', 0, 0, 1.000000, 'active'),
('Pack', 'Pack', 'count', 0, 0, 1.000000, 'active'),
('Set', 'Set', 'count', 0, 0, 1.000000, 'active'),
('Dozen', 'Doz', 'count', 0, 0, 12.000000, 'active')
ON CONFLICT (name) DO UPDATE SET symbol=EXCLUDED.symbol, status='active';

-- 2. CATEGORIES (10 Categories)
INSERT INTO categories (name, description, status) VALUES
('Smartphones & Flagships', 'Premium and flagship smartphones from Apple, Samsung, Google', 'active'),
('Budget & Feature Phones', 'Mid-range Android phones and keypad feature phones', 'active'),
('AirPods & Wireless Audio', 'TWS wireless earbuds, headphones, and Bluetooth neckbands', 'active'),
('Fast Chargers & Adapters', 'GaN fast wall chargers, travel adapters, and multi-port docks', 'active'),
('Charging Cables & Converters', 'Type-C, Lightning, Micro USB cables and OTG audio converters', 'active'),
('Power Banks & Portable Power', 'High capacity fast charging portable power banks and batteries', 'active'),
('Protective Cases & Covers', 'Silicon, leather, rugged armor, and transparent hybrid back covers', 'active'),
('Tempered Glass & Screen Guards', '9D privacy, matte gaming, and UV curved screen protectors', 'active'),
('Smart Watches & Fitness Bands', 'AMOLED smartwatches, fitness trackers, and replacement straps', 'active'),
('Memory Cards & USB Storage', 'High speed MicroSD cards, flash drives, and SSD storage', 'active')
ON CONFLICT (name) DO UPDATE SET description=EXCLUDED.description, status='active';

-- 3. EXPENSE CATEGORIES
INSERT INTO expense_categories (name, description, status) VALUES
('Rent', 'Shop and warehouse monthly rental expense', 'active'),
('Electricity', 'LESCO commercial power and electricity bills', 'active'),
('Employee Salary', 'Monthly staff and cashier payroll', 'active'),
('Internet & Utilities', 'High speed fiber internet, PTCL, and drinking water', 'active'),
('Office Supplies', 'Packaging bags, receipt paper rolls, and printing stationery', 'active'),
('Shop Maintenance', 'CCTV, furniture, lighting, and POS hardware maintenance', 'active'),
('Transport & Delivery', 'Supplier pickup logistics and parcel delivery charges', 'active'),
('Other Expenses', 'Miscellaneous day-to-day operational expenses', 'active')
ON CONFLICT (name) DO UPDATE SET description=EXCLUDED.description, status='active';

-- 4. SUPPLIERS
INSERT INTO suppliers (name, contact_person, phone, email, address, opening_balance, current_balance, status) VALUES
('Airlink Communications Ltd.', 'Mian Tariq', '+92 300 8452119', 'sales@airlink.com.pk', 'Gulberg III, Main Boulevard, Lahore', 125000.00, 125000.00, 'active'),
('Mega Cellular & Accessories', 'Nadeem Vijhi', '+92 321 4455667', 'nadeem@megacellular.pk', 'Hall Road, Commercial Plaza, Lahore', 50000.00, 50000.00, 'active'),
('TechZone Distribution PK', 'Asif Raza', '+92 333 9988776', 'info@techzone.pk', 'Hafeez Centre, 2nd Floor, Lahore', 35000.00, 35000.00, 'active'),
('Ali Telecom Importers', 'Sheikh Ali', '+92 302 7766554', 'ali.telecom@gmail.com', 'Saddar Electronic Market, Karachi', 0.00, 0.00, 'active'),
('Global Smart Accessories Hub', 'Bilal Butt', '+92 314 5544332', 'orders@globalhub.pk', 'Shah Alam Market, Lahore', 18500.00, 18500.00, 'active')
ON CONFLICT (name) DO UPDATE SET phone=EXCLUDED.phone, address=EXCLUDED.address, opening_balance=EXCLUDED.opening_balance, current_balance=EXCLUDED.current_balance;

-- 5. PRODUCTS (30 Realistic Products)
DO $$
DECLARE
    cat_smartphones BIGINT;
    cat_budget BIGINT;
    cat_audio BIGINT;
    cat_chargers BIGINT;
    cat_cables BIGINT;
    cat_powerbanks BIGINT;
    cat_cases BIGINT;
    cat_glass BIGINT;
    cat_watches BIGINT;
    cat_memory BIGINT;
    u_piece BIGINT;
    admin_id INT;
BEGIN
    SELECT id INTO cat_smartphones FROM categories WHERE name = 'Smartphones & Flagships' LIMIT 1;
    SELECT id INTO cat_budget FROM categories WHERE name = 'Budget & Feature Phones' LIMIT 1;
    SELECT id INTO cat_audio FROM categories WHERE name = 'AirPods & Wireless Audio' LIMIT 1;
    SELECT id INTO cat_chargers FROM categories WHERE name = 'Fast Chargers & Adapters' LIMIT 1;
    SELECT id INTO cat_cables FROM categories WHERE name = 'Charging Cables & Converters' LIMIT 1;
    SELECT id INTO cat_powerbanks FROM categories WHERE name = 'Power Banks & Portable Power' LIMIT 1;
    SELECT id INTO cat_cases FROM categories WHERE name = 'Protective Cases & Covers' LIMIT 1;
    SELECT id INTO cat_glass FROM categories WHERE name = 'Tempered Glass & Screen Guards' LIMIT 1;
    SELECT id INTO cat_watches FROM categories WHERE name = 'Smart Watches & Fitness Bands' LIMIT 1;
    SELECT id INTO cat_memory FROM categories WHERE name = 'Memory Cards & USB Storage' LIMIT 1;
    SELECT id INTO u_piece FROM units WHERE name = 'Piece' LIMIT 1;
    SELECT id INTO admin_id FROM access_credentials LIMIT 1;
    IF admin_id IS NULL THEN admin_id := 1; END IF;

    -- Category 1: Smartphones & Flagships
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_smartphones, 'Apple iPhone 15 Pro Max 256GB Natural Titanium', 'PRD-IP15PM', '89010001', 385000.00, 425000.00, 12.000, 3.000, 'Apple', 1, 1, 'active'),
    (cat_smartphones, 'Samsung Galaxy S24 Ultra 512GB Titanium Black', 'PRD-S24ULT', '89010002', 360000.00, 395000.00, 8.000, 2.000, 'Samsung', 1, 1, 'active'),
    (cat_smartphones, 'Google Pixel 8 Pro 128GB Obsidian', 'PRD-PIX8PR', '89010003', 195000.00, 220000.00, 4.000, 2.000, 'Google', 1, 1, 'active')
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- Category 2: Budget & Feature Phones
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_budget, 'Xiaomi Redmi Note 13 8GB/256GB Midnight Black', 'PRD-RN13', '89010004', 48000.00, 54999.00, 25.000, 5.000, 'Xiaomi', 1, 0, 'active'),
    (cat_budget, 'Infinix Note 40 Pro 12GB/256GB Vintage Green', 'PRD-INF40P', '89010005', 62000.00, 69999.00, 18.000, 4.000, 'Infinix', 1, 0, 'active'),
    (cat_budget, 'Nokia 105 4G Dual SIM Charcoal', 'PRD-NOK105', '89010006', 4200.00, 4999.00, 40.000, 10.000, 'Nokia', 1, 0, 'active'),
    (cat_budget, 'Tecno Spark 20 Pro 8GB/256GB Frosty White', 'PRD-TEC20P', '89010007', 39000.00, 44500.00, 0.000, 5.000, 'Tecno', 1, 0, 'active') -- OUT OF STOCK
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- Category 3: AirPods & Wireless Audio
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_audio, 'Apple AirPods Pro 2nd Gen with MagSafe USB-C', 'PRD-APP2', '89010008', 58000.00, 68500.00, 15.000, 3.000, 'Apple', 1, 1, 'active'),
    (cat_audio, 'Audionic Airbud 550 TWS Wireless Earbuds', 'PRD-AUD550', '89010009', 3800.00, 4999.00, 30.000, 6.000, 'Audionic', 1, 0, 'active'),
    (cat_audio, 'Ronin R-520 Ultra Clear Audio Wireless Earphones', 'PRD-RON520', '89010010', 2400.00, 3200.00, 2.000, 8.000, 'Ronin', 1, 0, 'active') -- LOW STOCK
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- Category 4: Fast Chargers & Adapters
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_chargers, 'Anker 65W GaN II 3-Port Fast Wall Charger', 'PRD-ANK65W', '89010011', 6500.00, 8499.00, 22.000, 5.000, 'Anker', 1, 0, 'active'),
    (cat_chargers, 'Apple 20W USB-C Power Adapter (Original Box)', 'PRD-AP20W', '89010012', 4800.00, 6200.00, 35.000, 8.000, 'Apple', 1, 0, 'active'),
    (cat_chargers, 'Samsung 25W Super Fast Travel Adapter Type-C', 'PRD-SAM25W', '89010013', 2800.00, 3800.00, 28.000, 6.000, 'Samsung', 1, 0, 'active')
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- Category 5: Charging Cables & Converters
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_cables, 'Baseus 100W PD Type-C to Type-C Braided Cable 2M', 'PRD-BAS100W', '89010014', 1200.00, 1850.00, 50.000, 10.000, 'Baseus', 1, 0, 'active'),
    (cat_cables, 'Joyroom 3-in-1 Fast Charging Multi Cable', 'PRD-JR3IN1', '89010015', 950.00, 1500.00, 35.000, 8.000, 'Joyroom', 1, 0, 'active'),
    (cat_cables, 'Apple Lightning to 3.5mm Headphone Jack Adapter', 'PRD-AP35MM', '89010016', 1800.00, 2600.00, 3.000, 10.000, 'Apple', 1, 0, 'active') -- LOW STOCK
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- Category 6: Power Banks & Portable Power
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_powerbanks, 'Anker PowerCore 20000mAh 20W PD Portable Charger', 'PRD-ANK20K', '89010017', 9500.00, 12500.00, 16.000, 4.000, 'Anker', 1, 1, 'active'),
    (cat_powerbanks, 'Faster PB-100 10000mAh Slim Fast Power Bank', 'PRD-FAS10K', '89010018', 3200.00, 4400.00, 24.000, 5.000, 'Faster', 1, 0, 'active'),
    (cat_powerbanks, 'Baseus Blade 100W 20000mAh Laptop Power Bank', 'PRD-BASBLD', '89010019', 18500.00, 23500.00, 0.000, 3.000, 'Baseus', 1, 0, 'active') -- OUT OF STOCK
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- Category 7: Protective Cases & Covers
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_cases, 'Spigen Ultra Hybrid Clear Case for iPhone 15 Pro Max', 'PRD-SPG15PM', '89010020', 2800.00, 4200.00, 30.000, 6.000, 'Spigen', 1, 0, 'active'),
    (cat_cases, 'Nillkin CamShield Pro Case for Samsung S24 Ultra', 'PRD-NIL24U', '89010021', 2200.00, 3500.00, 20.000, 5.000, 'Nillkin', 1, 0, 'active'),
    (cat_cases, 'Liquid Silicone Matte Soft Case for Redmi Note 13', 'PRD-SILRN13', '89010022', 450.00, 950.00, 45.000, 10.000, 'Generic', 1, 0, 'active')
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- Category 8: Tempered Glass & Screen Guards
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_glass, 'Super D 9D Privacy Tempered Glass iPhone Series', 'PRD-9DPRV', '89010023', 220.00, 650.00, 80.000, 15.000, 'Super D', 1, 0, 'active'),
    (cat_glass, 'UV Liquid Curved Screen Protector Galaxy S24 Ultra', 'PRD-UV24U', '89010024', 600.00, 1400.00, 35.000, 8.000, 'UV Pro', 1, 0, 'active'),
    (cat_glass, 'Matte Gaming Anti-Fingerprint Glass Universal', 'PRD-MATGAM', '89010025', 180.00, 500.00, 60.000, 12.000, 'Gorilla', 1, 0, 'active')
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- Category 9: Smart Watches & Fitness Bands
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_watches, 'Apple Watch Series 9 GPS 45mm Midnight Aluminum', 'PRD-AW945M', '89010026', 115000.00, 132000.00, 6.000, 2.000, 'Apple', 1, 1, 'active'),
    (cat_watches, 'Haylou Solar Plus RT3 AMOLED Smartwatch', 'PRD-HAYRT3', '89010027', 8200.00, 10999.00, 14.000, 4.000, 'Haylou', 1, 0, 'active'),
    (cat_watches, 'Xiaomi Smart Band 8 Active Black', 'PRD-MIBND8', '89010028', 5400.00, 7200.00, 1.000, 6.000, 'Xiaomi', 1, 0, 'active') -- LOW STOCK
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- Category 10: Memory Cards & USB Storage
    INSERT INTO products (category_id, name, product_code, barcode, purchase_cost, selling_price, quantity, minimum_stock, brand, track_stock, track_batches, status) VALUES
    (cat_memory, 'SanDisk Ultra 128GB MicroSDXC Class 10 UHS-I', 'PRD-SD128G', '89010029', 2100.00, 3100.00, 40.000, 8.000, 'SanDisk', 1, 1, 'active'),
    (cat_memory, 'Kingston DataTraveler Exodia 64GB USB 3.2 Flash Drive', 'PRD-KNG64G', '89010030', 1300.00, 1950.00, 30.000, 6.000, 'Kingston', 1, 0, 'active')
    ON CONFLICT (product_code) DO UPDATE SET purchase_cost=EXCLUDED.purchase_cost, selling_price=EXCLUDED.selling_price, quantity=EXCLUDED.quantity, minimum_stock=EXCLUDED.minimum_stock;

    -- 6. PRODUCT BATCHES
    INSERT INTO product_batches (product_id, batch_number, received_quantity, remaining_quantity, unit_cost, manufacturing_date, expiry_date, created_by, status)
    SELECT id, 'BAT-2026-IP15-A1', 15.000, 12.000, 385000.00, '2026-01-10', '2028-01-10', admin_id, 'active'
    FROM products WHERE product_code = 'PRD-IP15PM'
    ON CONFLICT DO NOTHING;

    INSERT INTO product_batches (product_id, batch_number, received_quantity, remaining_quantity, unit_cost, manufacturing_date, expiry_date, created_by, status)
    SELECT id, 'BAT-2026-S24U-01', 10.000, 8.000, 360000.00, '2026-02-01', '2028-02-01', admin_id, 'active'
    FROM products WHERE product_code = 'PRD-S24ULT'
    ON CONFLICT DO NOTHING;

    INSERT INTO product_batches (product_id, batch_number, received_quantity, remaining_quantity, unit_cost, manufacturing_date, expiry_date, created_by, status)
    SELECT id, 'BAT-2026-APP2-03', 20.000, 15.000, 58000.00, '2026-01-15', '2027-12-31', admin_id, 'active'
    FROM products WHERE product_code = 'PRD-APP2'
    ON CONFLICT DO NOTHING;

    INSERT INTO product_batches (product_id, batch_number, received_quantity, remaining_quantity, unit_cost, manufacturing_date, expiry_date, created_by, status)
    SELECT id, 'BAT-2026-ANK-20K', 20.000, 16.000, 9500.00, '2026-03-01', '2028-03-01', admin_id, 'active'
    FROM products WHERE product_code = 'PRD-ANK20K'
    ON CONFLICT DO NOTHING;

    INSERT INTO product_batches (product_id, batch_number, received_quantity, remaining_quantity, unit_cost, manufacturing_date, expiry_date, created_by, status)
    SELECT id, 'BAT-2026-AW9-01', 8.000, 6.000, 115000.00, '2026-01-20', '2028-01-20', admin_id, 'active'
    FROM products WHERE product_code = 'PRD-AW945M'
    ON CONFLICT DO NOTHING;

    INSERT INTO product_batches (product_id, batch_number, received_quantity, remaining_quantity, unit_cost, manufacturing_date, expiry_date, created_by, status)
    SELECT id, 'BAT-2026-SD128-02', 50.000, 40.000, 2100.00, '2026-02-15', '2030-02-15', admin_id, 'active'
    FROM products WHERE product_code = 'PRD-SD128G'
    ON CONFLICT DO NOTHING;

END $$;

-- 7. EXPENSES
DO $$
DECLARE
    cat_rent BIGINT;
    cat_elec BIGINT;
    cat_sal BIGINT;
    cat_net BIGINT;
    cat_off BIGINT;
    cat_maint BIGINT;
    admin_id INT;
BEGIN
    SELECT id INTO cat_rent FROM expense_categories WHERE name = 'Rent' LIMIT 1;
    SELECT id INTO cat_elec FROM expense_categories WHERE name = 'Electricity' LIMIT 1;
    SELECT id INTO cat_sal FROM expense_categories WHERE name = 'Employee Salary' LIMIT 1;
    SELECT id INTO cat_net FROM expense_categories WHERE name = 'Internet & Utilities' LIMIT 1;
    SELECT id INTO cat_off FROM expense_categories WHERE name = 'Office Supplies' LIMIT 1;
    SELECT id INTO cat_maint FROM expense_categories WHERE name = 'Shop Maintenance' LIMIT 1;
    SELECT id INTO admin_id FROM access_credentials LIMIT 1;
    IF admin_id IS NULL THEN admin_id := 1; END IF;

    INSERT INTO expenses (expense_category_id, title, amount, expense_date, description, payment_method, added_by, status) VALUES
    (cat_rent, 'Shop Monthly Rent - August 2026', 75000.00, '2026-08-01', 'Commercial plaza shop unit rent payment via cheque', 'cheque', admin_id, 'active'),
    (cat_sal, 'Staff Payroll & Cashier Salaries', 60000.00, '2026-08-05', 'Monthly salary for senior cashier and storekeeper', 'bank_transfer', admin_id, 'active'),
    (cat_elec, 'LESCO Commercial Electricity Bill', 38500.00, '2026-08-10', 'Commercial 3-phase electricity consumption bill', 'cash', admin_id, 'active'),
    (cat_net, 'StormFiber High-Speed Business Internet', 4500.00, '2026-08-12', '50 Mbps business dedicated optical fiber bill', 'mobile_wallet', admin_id, 'active'),
    (cat_off, 'Custom Printed Branding Bags & Bill Rolls', 8200.00, '2026-08-16', '1000 pcs mobile carrier bags and thermal receipt rolls', 'cash', admin_id, 'active'),
    (cat_maint, 'CCTV Cameras Servicing & POS Backup Maintenance', 6000.00, '2026-08-19', 'Serviced security camera NVR and battery backup', 'cash', admin_id, 'active')
    ON CONFLICT DO NOTHING;
END $$;

-- 8. COMPLETED PURCHASES & PURCHASE ITEMS
DO $$
DECLARE
    supp_airlink BIGINT;
    supp_mega BIGINT;
    supp_techzone BIGINT;
    supp_ali BIGINT;
    supp_global BIGINT;
    prod_ip15 BIGINT;
    prod_s24 BIGINT;
    prod_app2 BIGINT;
    prod_ank65 BIGINT;
    prod_rn13 BIGINT;
    admin_id INT;
    purch1_id BIGINT;
    purch2_id BIGINT;
    purch3_id BIGINT;
BEGIN
    SELECT id INTO supp_airlink FROM suppliers WHERE name LIKE 'Airlink%' LIMIT 1;
    SELECT id INTO supp_mega FROM suppliers WHERE name LIKE 'Mega Cellular%' LIMIT 1;
    SELECT id INTO supp_techzone FROM suppliers WHERE name LIKE 'TechZone%' LIMIT 1;
    SELECT id INTO supp_ali FROM suppliers WHERE name LIKE 'Ali Telecom%' LIMIT 1;
    SELECT id INTO supp_global FROM suppliers WHERE name LIKE 'Global Smart%' LIMIT 1;

    SELECT id INTO prod_ip15 FROM products WHERE product_code = 'PRD-IP15PM' LIMIT 1;
    SELECT id INTO prod_s24 FROM products WHERE product_code = 'PRD-S24ULT' LIMIT 1;
    SELECT id INTO prod_app2 FROM products WHERE product_code = 'PRD-APP2' LIMIT 1;
    SELECT id INTO prod_ank65 FROM products WHERE product_code = 'PRD-ANK65W' LIMIT 1;
    SELECT id INTO prod_rn13 FROM products WHERE product_code = 'PRD-RN13' LIMIT 1;

    SELECT id INTO admin_id FROM access_credentials LIMIT 1;
    IF admin_id IS NULL THEN admin_id := 1; END IF;

    -- Purchase 1: Airlink
    INSERT INTO purchases (purchase_number, request_token, supplier_id, supplier_invoice_number, purchase_date, subtotal, grand_total, amount_paid, balance_due, payment_status, purchase_status, created_by)
    VALUES ('PUR-20260815-101', 'token-pur-101', supp_airlink, 'INV-AIR-9921', '2026-08-15', 4785000.00, 4785000.00, 4660000.00, 125000.00, 'partial', 'received', admin_id)
    ON CONFLICT (purchase_number) DO UPDATE SET amount_paid=EXCLUDED.amount_paid, balance_due=EXCLUDED.balance_due
    RETURNING id INTO purch1_id;

    IF purch1_id IS NOT NULL AND prod_ip15 IS NOT NULL THEN
        INSERT INTO purchase_items (purchase_id, product_id, product_name, product_code, quantity, unit_cost, line_total)
        VALUES (purch1_id, prod_ip15, 'Apple iPhone 15 Pro Max 256GB Natural Titanium', 'PRD-IP15PM', 10.000, 385000.00, 3850000.00)
        ON CONFLICT (purchase_id, product_id) DO NOTHING;
    END IF;

    -- Purchase 2: Mega Cellular
    INSERT INTO purchases (purchase_number, request_token, supplier_id, supplier_invoice_number, purchase_date, subtotal, grand_total, amount_paid, balance_due, payment_status, purchase_status, created_by)
    VALUES ('PUR-20260818-102', 'token-pur-102', supp_mega, 'INV-MEGA-4421', '2026-08-18', 320000.00, 320000.00, 270000.00, 50000.00, 'partial', 'received', admin_id)
    ON CONFLICT (purchase_number) DO UPDATE SET amount_paid=EXCLUDED.amount_paid, balance_due=EXCLUDED.balance_due
    RETURNING id INTO purch2_id;

    IF purch2_id IS NOT NULL AND prod_app2 IS NOT NULL THEN
        INSERT INTO purchase_items (purchase_id, product_id, product_name, product_code, quantity, unit_cost, line_total)
        VALUES (purch2_id, prod_app2, 'Apple AirPods Pro 2nd Gen with MagSafe USB-C', 'PRD-APP2', 5.000, 58000.00, 290000.00)
        ON CONFLICT (purchase_id, product_id) DO NOTHING;
    END IF;

    -- Purchase 3: TechZone
    INSERT INTO purchases (purchase_number, request_token, supplier_id, supplier_invoice_number, purchase_date, subtotal, grand_total, amount_paid, balance_due, payment_status, purchase_status, created_by)
    VALUES ('PUR-20260820-103', 'token-pur-103', supp_techzone, 'INV-TECH-1102', '2026-08-20', 850000.00, 850000.00, 815000.00, 35000.00, 'partial', 'received', admin_id)
    ON CONFLICT (purchase_number) DO UPDATE SET amount_paid=EXCLUDED.amount_paid, balance_due=EXCLUDED.balance_due
    RETURNING id INTO purch3_id;

    IF purch3_id IS NOT NULL AND prod_rn13 IS NOT NULL THEN
        INSERT INTO purchase_items (purchase_id, product_id, product_name, product_code, quantity, unit_cost, line_total)
        VALUES (purch3_id, prod_rn13, 'Xiaomi Redmi Note 13 8GB/256GB Midnight Black', 'PRD-RN13', 15.000, 48000.00, 720000.00)
        ON CONFLICT (purchase_id, product_id) DO NOTHING;
    END IF;
END $$;

-- 9. PURCHASE RETURNS
DO $$
DECLARE
    supp_mega BIGINT;
    purch2_id BIGINT;
    admin_id INT;
BEGIN
    SELECT id INTO supp_mega FROM suppliers WHERE name LIKE 'Mega Cellular%' LIMIT 1;
    SELECT id INTO purch2_id FROM purchases WHERE purchase_number = 'PUR-20260818-102' LIMIT 1;
    SELECT id INTO admin_id FROM access_credentials LIMIT 1;
    IF admin_id IS NULL THEN admin_id := 1; END IF;

    IF purch2_id IS NOT NULL AND supp_mega IS NOT NULL THEN
        INSERT INTO purchase_returns (return_number, purchase_id, supplier_id, return_date, subtotal, refund_amount, balance_adjustment, reason, status, processed_by)
        VALUES ('PRET-20260821-001', purch2_id, supp_mega, '2026-08-21', 13000.00, 13000.00, 0.00, 'Damaged factory box packaging on arrival', 'completed', admin_id)
        ON CONFLICT (return_number) DO NOTHING;
    END IF;
END $$;

-- 10. COMPLETED SALES & BILLING TRANSACTIONS (For POS, History, Analytics & Reports)
DO $$
DECLARE
    admin_id INT;
    sale1_id BIGINT;
    sale2_id BIGINT;
    sale3_id BIGINT;
    sale4_id BIGINT;
    sale5_id BIGINT;
    sale6_id BIGINT;
    sale7_id BIGINT;
    sale8_id BIGINT;
    prod_ip15 BIGINT;
    prod_s24 BIGINT;
    prod_app2 BIGINT;
    prod_ap20 BIGINT;
    prod_rn13 BIGINT;
    prod_ank20 BIGINT;
    prod_aw9 BIGINT;
    prod_glass BIGINT;
    prod_case BIGINT;
    prod_sd BIGINT;
BEGIN
    SELECT id INTO admin_id FROM access_credentials LIMIT 1;
    IF admin_id IS NULL THEN admin_id := 1; END IF;

    SELECT id INTO prod_ip15 FROM products WHERE product_code = 'PRD-IP15PM' LIMIT 1;
    SELECT id INTO prod_s24 FROM products WHERE product_code = 'PRD-S24ULT' LIMIT 1;
    SELECT id INTO prod_app2 FROM products WHERE product_code = 'PRD-APP2' LIMIT 1;
    SELECT id INTO prod_ap20 FROM products WHERE product_code = 'PRD-AP20W' LIMIT 1;
    SELECT id INTO prod_rn13 FROM products WHERE product_code = 'PRD-RN13' LIMIT 1;
    SELECT id INTO prod_ank20 FROM products WHERE product_code = 'PRD-ANK20K' LIMIT 1;
    SELECT id INTO prod_aw9 FROM products WHERE product_code = 'PRD-AW945M' LIMIT 1;
    SELECT id INTO prod_glass FROM products WHERE product_code = 'PRD-9DPRV' LIMIT 1;
    SELECT id INTO prod_case FROM products WHERE product_code = 'PRD-SPG15PM' LIMIT 1;
    SELECT id INTO prod_sd FROM products WHERE product_code = 'PRD-SD128G' LIMIT 1;

    -- Sale 1: Aug 20
    INSERT INTO sales (invoice_number, request_token, cashier_id, customer_name, customer_phone, subtotal, grand_total, amount_received, change_returned, payment_method, status, created_at)
    VALUES ('INV-20260820-001', 'token-sale-001', admin_id, 'Hamza Tariq', '+92 300 1122334', 425000.00, 425000.00, 425000.00, 0.00, 'cash', 'completed', '2026-08-20 14:30:00+05')
    ON CONFLICT (invoice_number) DO NOTHING
    RETURNING id INTO sale1_id;

    IF sale1_id IS NOT NULL AND prod_ip15 IS NOT NULL THEN
        INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, unit_price, purchase_cost, line_total)
        VALUES (sale1_id, prod_ip15, 'Apple iPhone 15 Pro Max 256GB Natural Titanium', 'PRD-IP15PM', 1.000, 425000.00, 385000.00, 425000.00);
        INSERT INTO payments (sale_id, payment_method, amount, status) VALUES (sale1_id, 'cash', 425000.00, 'paid');
    END IF;

    -- Sale 2: Aug 20
    INSERT INTO sales (invoice_number, request_token, cashier_id, customer_name, customer_phone, subtotal, grand_total, amount_received, change_returned, payment_method, status, created_at)
    VALUES ('INV-20260820-002', 'token-sale-002', admin_id, 'Zubair Ahmed', '+92 321 9988776', 74700.00, 74700.00, 75000.00, 300.00, 'card', 'completed', '2026-08-20 17:15:00+05')
    ON CONFLICT (invoice_number) DO NOTHING
    RETURNING id INTO sale2_id;

    IF sale2_id IS NOT NULL AND prod_app2 IS NOT NULL AND prod_ap20 IS NOT NULL THEN
        INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, unit_price, purchase_cost, line_total)
        VALUES
        (sale2_id, prod_app2, 'Apple AirPods Pro 2nd Gen with MagSafe USB-C', 'PRD-APP2', 1.000, 68500.00, 58000.00, 68500.00),
        (sale2_id, prod_ap20, 'Apple 20W USB-C Power Adapter (Original Box)', 'PRD-AP20W', 1.000, 6200.00, 4800.00, 6200.00);
        INSERT INTO payments (sale_id, payment_method, amount, status) VALUES (sale2_id, 'card', 74700.00, 'paid');
    END IF;

    -- Sale 3: Aug 21
    INSERT INTO sales (invoice_number, request_token, cashier_id, customer_name, customer_phone, subtotal, grand_total, amount_received, change_returned, payment_method, status, created_at)
    VALUES ('INV-20260821-003', 'token-sale-003', admin_id, 'Bilal Khan', '+92 333 4455661', 55649.00, 55649.00, 55649.00, 0.00, 'mobile_wallet', 'completed', '2026-08-21 12:45:00+05')
    ON CONFLICT (invoice_number) DO NOTHING
    RETURNING id INTO sale3_id;

    IF sale3_id IS NOT NULL AND prod_rn13 IS NOT NULL AND prod_glass IS NOT NULL THEN
        INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, unit_price, purchase_cost, line_total)
        VALUES
        (sale3_id, prod_rn13, 'Xiaomi Redmi Note 13 8GB/256GB Midnight Black', 'PRD-RN13', 1.000, 54999.00, 48000.00, 54999.00),
        (sale3_id, prod_glass, 'Super D 9D Privacy Tempered Glass iPhone Series', 'PRD-9DPRV', 1.000, 650.00, 220.00, 650.00);
        INSERT INTO payments (sale_id, payment_method, amount, status) VALUES (sale3_id, 'mobile_wallet', 55649.00, 'paid');
    END IF;

    -- Sale 4: Aug 22
    INSERT INTO sales (invoice_number, request_token, cashier_id, customer_name, customer_phone, subtotal, grand_total, amount_received, change_returned, payment_method, status, created_at)
    VALUES ('INV-20260822-004', 'token-sale-004', admin_id, 'Usman Farooq', '+92 304 5566778', 395000.00, 395000.00, 395000.00, 0.00, 'bank_transfer', 'completed', '2026-08-22 16:00:00+05')
    ON CONFLICT (invoice_number) DO NOTHING
    RETURNING id INTO sale4_id;

    IF sale4_id IS NOT NULL AND prod_s24 IS NOT NULL THEN
        INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, unit_price, purchase_cost, line_total)
        VALUES (sale4_id, prod_s24, 'Samsung Galaxy S24 Ultra 512GB Titanium Black', 'PRD-S24ULT', 1.000, 395000.00, 360000.00, 395000.00);
        INSERT INTO payments (sale_id, payment_method, amount, status) VALUES (sale4_id, 'bank_transfer', 395000.00, 'paid');
    END IF;

    -- Sale 5: Aug 23
    INSERT INTO sales (invoice_number, request_token, cashier_id, customer_name, customer_phone, subtotal, grand_total, amount_received, change_returned, payment_method, status, created_at)
    VALUES ('INV-20260823-005', 'token-sale-005', admin_id, 'Walk-in Customer', NULL, 136200.00, 136200.00, 136500.00, 300.00, 'cash', 'completed', '2026-08-23 15:20:00+05')
    ON CONFLICT (invoice_number) DO NOTHING
    RETURNING id INTO sale5_id;

    IF sale5_id IS NOT NULL AND prod_aw9 IS NOT NULL AND prod_case IS NOT NULL THEN
        INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, unit_price, purchase_cost, line_total)
        VALUES
        (sale5_id, prod_aw9, 'Apple Watch Series 9 GPS 45mm Midnight Aluminum', 'PRD-AW945M', 1.000, 132000.00, 115000.00, 132000.00),
        (sale5_id, prod_case, 'Spigen Ultra Hybrid Clear Case for iPhone 15 Pro Max', 'PRD-SPG15PM', 1.000, 4200.00, 2800.00, 4200.00);
        INSERT INTO payments (sale_id, payment_method, amount, status) VALUES (sale5_id, 'cash', 136200.00, 'paid');
    END IF;

    -- Sale 6: Aug 24
    INSERT INTO sales (invoice_number, request_token, cashier_id, customer_name, customer_phone, subtotal, grand_total, amount_received, change_returned, payment_method, status, created_at)
    VALUES ('INV-20260824-006', 'token-sale-006', admin_id, 'Kamran Ali', '+92 315 8877665', 15600.00, 15600.00, 16000.00, 400.00, 'cash', 'completed', '2026-08-24 11:10:00+05')
    ON CONFLICT (invoice_number) DO NOTHING
    RETURNING id INTO sale6_id;

    IF sale6_id IS NOT NULL AND prod_ank20 IS NOT NULL AND prod_sd IS NOT NULL THEN
        INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, unit_price, purchase_cost, line_total)
        VALUES
        (sale6_id, prod_ank20, 'Anker PowerCore 20000mAh 20W PD Portable Charger', 'PRD-ANK20K', 1.000, 12500.00, 9500.00, 12500.00),
        (sale6_id, prod_sd, 'SanDisk Ultra 128GB MicroSDXC Class 10 UHS-I', 'PRD-SD128G', 1.000, 3100.00, 2100.00, 3100.00);
        INSERT INTO payments (sale_id, payment_method, amount, status) VALUES (sale6_id, 'cash', 15600.00, 'paid');
    END IF;
END $$;

-- 11. NOTIFICATIONS & ALERTS
INSERT INTO notifications (notification_type, severity, title, message, module, related_type, action_url, source_key, status, is_system_generated) VALUES
('announcement', 'info', 'Welcome to Mobile Shop POS Live Cloud', 'Your POS store is fully synchronized with Supabase database and ready for fast billing.', 'system', 'system', '/dashboard', 'welcome_announcement', 'unread', 0),
('stock_out', 'critical', 'Out of Stock: Tecno Spark 20 Pro', 'Tecno Spark 20 Pro has 0 units remaining. Restock immediately to continue billing.', 'inventory', 'product', '/inventory?search=Tecno', 'stock_out_seed_tec20', 'unread', 1),
('stock_out', 'critical', 'Out of Stock: Baseus Blade 100W Power Bank', 'Baseus Blade 100W 20000mAh Laptop Power Bank has 0 units remaining.', 'inventory', 'product', '/inventory?search=Baseus', 'stock_out_seed_basbld', 'unread', 1),
('stock_low', 'warning', 'Low Stock Alert: Ronin R-520 Earphones', 'Ronin R-520 Earphones is running low with only 2 units remaining (Minimum threshold: 8).', 'inventory', 'product', '/inventory?filter=low', 'stock_low_seed_ron520', 'unread', 1),
('stock_low', 'warning', 'Low Stock Alert: Apple Lightning to 3.5mm Adapter', 'Apple Lightning to 3.5mm Adapter has only 3 units remaining (Minimum threshold: 10).', 'inventory', 'product', '/inventory?filter=low', 'stock_low_seed_ap35', 'unread', 1),
('supplier_balance', 'warning', 'Outstanding Vendor Due: Airlink Communications', 'Pending payable balance of Rs. 125,000 for Airlink Communications. Review ledger.', 'suppliers', 'supplier', '/suppliers?search=Airlink', 'supp_balance_seed_airlink', 'unread', 1),
('supplier_balance', 'warning', 'Outstanding Vendor Due: Mega Cellular & Accessories', 'Pending payable balance of Rs. 50,000 for Mega Cellular. Review ledger.', 'suppliers', 'supplier', '/suppliers?search=Mega', 'supp_balance_seed_mega', 'unread', 1)
ON CONFLICT (source_key) DO UPDATE SET title=EXCLUDED.title, message=EXCLUDED.message, status=EXCLUDED.status;
