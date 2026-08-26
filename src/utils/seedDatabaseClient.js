import supabase, { isSupabaseConfigured } from "../api/supabaseClient";

export async function seedDemoStoreData() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured in .env");
  }

  const results = {
    categories: 0,
    products: 0,
    suppliers: 0,
    expenses: 0,
    purchases: 0,
    sales: 0,
    notifications: 0,
  };

  // 1. SEED UNITS
  const unitsData = [
    { name: "Piece", symbol: "Pcs", unit_type: "count", precision: 0, is_fractional: 0, conversion_factor: 1, status: "active" },
    { name: "Box", symbol: "Box", unit_type: "count", precision: 0, is_fractional: 0, conversion_factor: 1, status: "active" },
    { name: "Pack", symbol: "Pack", unit_type: "count", precision: 0, is_fractional: 0, conversion_factor: 1, status: "active" },
    { name: "Set", symbol: "Set", unit_type: "count", precision: 0, is_fractional: 0, conversion_factor: 1, status: "active" },
    { name: "Dozen", symbol: "Doz", unit_type: "count", precision: 0, is_fractional: 0, conversion_factor: 12, status: "active" },
  ];
  for (const u of unitsData) {
    await supabase.from("units").upsert(u, { onConflict: "name" });
  }

  // 2. SEED CATEGORIES (10 Categories)
  const categoriesData = [
    { name: "Smartphones & Flagships", description: "Premium and flagship smartphones from Apple, Samsung, Google", status: "active" },
    { name: "Budget & Feature Phones", description: "Mid-range Android phones and keypad feature phones", status: "active" },
    { name: "AirPods & Wireless Audio", description: "TWS wireless earbuds, headphones, and Bluetooth neckbands", status: "active" },
    { name: "Fast Chargers & Adapters", description: "GaN fast wall chargers, travel adapters, and multi-port docks", status: "active" },
    { name: "Charging Cables & Converters", description: "Type-C, Lightning, Micro USB cables and OTG audio converters", status: "active" },
    { name: "Power Banks & Portable Power", description: "High capacity fast charging portable power banks and batteries", status: "active" },
    { name: "Protective Cases & Covers", description: "Silicon, leather, rugged armor, and transparent hybrid back covers", status: "active" },
    { name: "Tempered Glass & Screen Guards", description: "9D privacy, matte gaming, and UV curved screen protectors", status: "active" },
    { name: "Smart Watches & Fitness Bands", description: "AMOLED smartwatches, fitness trackers, and replacement straps", status: "active" },
    { name: "Memory Cards & USB Storage", description: "High speed MicroSD cards, flash drives, and SSD storage", status: "active" },
  ];

  for (const c of categoriesData) {
    await supabase.from("categories").upsert(c, { onConflict: "name" });
  }
  const { data: savedCats } = await supabase.from("categories").select("id, name");
  results.categories = savedCats?.length || 0;
  const catMap = Object.fromEntries((savedCats || []).map((c) => [c.name, c.id]));

  // 3. SEED SUPPLIERS (5 Suppliers)
  const suppliersData = [
    { name: "Airlink Communications Ltd.", contact_person: "Mian Tariq", phone: "+92 300 8452119", email: "sales@airlink.com.pk", address: "Gulberg III, Main Boulevard, Lahore", opening_balance: 125000, current_balance: 125000, status: "active" },
    { name: "Mega Cellular & Accessories", contact_person: "Nadeem Vijhi", phone: "+92 321 4455667", email: "nadeem@megacellular.pk", address: "Hall Road, Commercial Plaza, Lahore", opening_balance: 50000, current_balance: 50000, status: "active" },
    { name: "TechZone Distribution PK", contact_person: "Asif Raza", phone: "+92 333 9988776", email: "info@techzone.pk", address: "Hafeez Centre, 2nd Floor, Lahore", opening_balance: 35000, current_balance: 35000, status: "active" },
    { name: "Ali Telecom Importers", contact_person: "Sheikh Ali", phone: "+92 302 7766554", email: "ali.telecom@gmail.com", address: "Saddar Electronic Market, Karachi", opening_balance: 0, current_balance: 0, status: "active" },
    { name: "Global Smart Accessories Hub", contact_person: "Bilal Butt", phone: "+92 314 5544332", email: "orders@globalhub.pk", address: "Shah Alam Market, Lahore", opening_balance: 18500, current_balance: 18500, status: "active" },
  ];

  for (const s of suppliersData) {
    await supabase.from("suppliers").upsert(s, { onConflict: "name" });
  }
  const { data: savedSupps } = await supabase.from("suppliers").select("id, name");
  results.suppliers = savedSupps?.length || 0;
  const suppMap = Object.fromEntries((savedSupps || []).map((s) => [s.name, s.id]));

  // 4. SEED PRODUCTS (30 Products across 10 Categories)
  const productsData = [
    // Smartphones & Flagships
    { category_id: catMap["Smartphones & Flagships"], name: "Apple iPhone 15 Pro Max 256GB Natural Titanium", product_code: "PRD-IP15PM", barcode: "89010001", purchase_cost: 385000, selling_price: 425000, quantity: 12, minimum_stock: 3, brand: "Apple", track_stock: 1, track_batches: 1, status: "active" },
    { category_id: catMap["Smartphones & Flagships"], name: "Samsung Galaxy S24 Ultra 512GB Titanium Black", product_code: "PRD-S24ULT", barcode: "89010002", purchase_cost: 360000, selling_price: 395000, quantity: 8, minimum_stock: 2, brand: "Samsung", track_stock: 1, track_batches: 1, status: "active" },
    { category_id: catMap["Smartphones & Flagships"], name: "Google Pixel 8 Pro 128GB Obsidian", product_code: "PRD-PIX8PR", barcode: "89010003", purchase_cost: 195000, selling_price: 220000, quantity: 4, minimum_stock: 2, brand: "Google", track_stock: 1, track_batches: 1, status: "active" },

    // Budget & Feature Phones
    { category_id: catMap["Budget & Feature Phones"], name: "Xiaomi Redmi Note 13 8GB/256GB Midnight Black", product_code: "PRD-RN13", barcode: "89010004", purchase_cost: 48000, selling_price: 54999, quantity: 25, minimum_stock: 5, brand: "Xiaomi", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Budget & Feature Phones"], name: "Infinix Note 40 Pro 12GB/256GB Vintage Green", product_code: "PRD-INF40P", barcode: "89010005", purchase_cost: 62000, selling_price: 69999, quantity: 18, minimum_stock: 4, brand: "Infinix", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Budget & Feature Phones"], name: "Nokia 105 4G Dual SIM Charcoal", product_code: "PRD-NOK105", barcode: "89010006", purchase_cost: 4200, selling_price: 4999, quantity: 40, minimum_stock: 10, brand: "Nokia", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Budget & Feature Phones"], name: "Tecno Spark 20 Pro 8GB/256GB Frosty White", product_code: "PRD-TEC20P", barcode: "89010007", purchase_cost: 39000, selling_price: 44500, quantity: 0, minimum_stock: 5, brand: "Tecno", track_stock: 1, track_batches: 0, status: "active" }, // Out of stock

    // AirPods & Wireless Audio
    { category_id: catMap["AirPods & Wireless Audio"], name: "Apple AirPods Pro 2nd Gen with MagSafe USB-C", product_code: "PRD-APP2", barcode: "89010008", purchase_cost: 58000, selling_price: 68500, quantity: 15, minimum_stock: 3, brand: "Apple", track_stock: 1, track_batches: 1, status: "active" },
    { category_id: catMap["AirPods & Wireless Audio"], name: "Audionic Airbud 550 TWS Wireless Earbuds", product_code: "PRD-AUD550", barcode: "89010009", purchase_cost: 3800, selling_price: 4999, quantity: 30, minimum_stock: 6, brand: "Audionic", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["AirPods & Wireless Audio"], name: "Ronin R-520 Ultra Clear Audio Wireless Earphones", product_code: "PRD-RON520", barcode: "89010010", purchase_cost: 2400, selling_price: 3200, quantity: 2, minimum_stock: 8, brand: "Ronin", track_stock: 1, track_batches: 0, status: "active" }, // Low stock

    // Fast Chargers & Adapters
    { category_id: catMap["Fast Chargers & Adapters"], name: "Anker 65W GaN II 3-Port Fast Wall Charger", product_code: "PRD-ANK65W", barcode: "89010011", purchase_cost: 6500, selling_price: 8499, quantity: 22, minimum_stock: 5, brand: "Anker", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Fast Chargers & Adapters"], name: "Apple 20W USB-C Power Adapter (Original Box)", product_code: "PRD-AP20W", barcode: "89010012", purchase_cost: 4800, selling_price: 6200, quantity: 35, minimum_stock: 8, brand: "Apple", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Fast Chargers & Adapters"], name: "Samsung 25W Super Fast Travel Adapter Type-C", product_code: "PRD-SAM25W", barcode: "89010013", purchase_cost: 2800, selling_price: 3800, quantity: 28, minimum_stock: 6, brand: "Samsung", track_stock: 1, track_batches: 0, status: "active" },

    // Charging Cables & Converters
    { category_id: catMap["Charging Cables & Converters"], name: "Baseus 100W PD Type-C to Type-C Braided Cable 2M", product_code: "PRD-BAS100W", barcode: "89010014", purchase_cost: 1200, selling_price: 1850, quantity: 50, minimum_stock: 10, brand: "Baseus", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Charging Cables & Converters"], name: "Joyroom 3-in-1 Fast Charging Multi Cable", product_code: "PRD-JR3IN1", barcode: "89010015", purchase_cost: 950, selling_price: 1500, quantity: 35, minimum_stock: 8, brand: "Joyroom", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Charging Cables & Converters"], name: "Apple Lightning to 3.5mm Headphone Jack Adapter", product_code: "PRD-AP35MM", barcode: "89010016", purchase_cost: 1800, selling_price: 2600, quantity: 3, minimum_stock: 10, brand: "Apple", track_stock: 1, track_batches: 0, status: "active" }, // Low stock

    // Power Banks & Portable Power
    { category_id: catMap["Power Banks & Portable Power"], name: "Anker PowerCore 20000mAh 20W PD Portable Charger", product_code: "PRD-ANK20K", barcode: "89010017", purchase_cost: 9500, selling_price: 12500, quantity: 16, minimum_stock: 4, brand: "Anker", track_stock: 1, track_batches: 1, status: "active" },
    { category_id: catMap["Power Banks & Portable Power"], name: "Faster PB-100 10000mAh Slim Fast Power Bank", product_code: "PRD-FAS10K", barcode: "89010018", purchase_cost: 3200, selling_price: 4400, quantity: 24, minimum_stock: 5, brand: "Faster", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Power Banks & Portable Power"], name: "Baseus Blade 100W 20000mAh Laptop Power Bank", product_code: "PRD-BASBLD", barcode: "89010019", purchase_cost: 18500, selling_price: 23500, quantity: 0, minimum_stock: 3, brand: "Baseus", track_stock: 1, track_batches: 0, status: "active" }, // Out of stock

    // Protective Cases & Covers
    { category_id: catMap["Protective Cases & Covers"], name: "Spigen Ultra Hybrid Clear Case for iPhone 15 Pro Max", product_code: "PRD-SPG15PM", barcode: "89010020", purchase_cost: 2800, selling_price: 4200, quantity: 30, minimum_stock: 6, brand: "Spigen", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Protective Cases & Covers"], name: "Nillkin CamShield Pro Case for Samsung S24 Ultra", product_code: "PRD-NIL24U", barcode: "89010021", purchase_cost: 2200, selling_price: 3500, quantity: 20, minimum_stock: 5, brand: "Nillkin", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Protective Cases & Covers"], name: "Liquid Silicone Matte Soft Case for Redmi Note 13", product_code: "PRD-SILRN13", barcode: "89010022", purchase_cost: 450, selling_price: 950, quantity: 45, minimum_stock: 10, brand: "Generic", track_stock: 1, track_batches: 0, status: "active" },

    // Tempered Glass & Screen Guards
    { category_id: catMap["Tempered Glass & Screen Guards"], name: "Super D 9D Privacy Tempered Glass iPhone Series", product_code: "PRD-9DPRV", barcode: "89010023", purchase_cost: 220, selling_price: 650, quantity: 80, minimum_stock: 15, brand: "Super D", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Tempered Glass & Screen Guards"], name: "UV Liquid Curved Screen Protector Galaxy S24 Ultra", product_code: "PRD-UV24U", barcode: "89010024", purchase_cost: 600, selling_price: 1400, quantity: 35, minimum_stock: 8, brand: "UV Pro", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Tempered Glass & Screen Guards"], name: "Matte Gaming Anti-Fingerprint Glass Universal", product_code: "PRD-MATGAM", barcode: "89010025", purchase_cost: 180, selling_price: 500, quantity: 60, minimum_stock: 12, brand: "Gorilla", track_stock: 1, track_batches: 0, status: "active" },

    // Smart Watches & Fitness Bands
    { category_id: catMap["Smart Watches & Fitness Bands"], name: "Apple Watch Series 9 GPS 45mm Midnight Aluminum", product_code: "PRD-AW945M", barcode: "89010026", purchase_cost: 115000, selling_price: 132000, quantity: 6, minimum_stock: 2, brand: "Apple", track_stock: 1, track_batches: 1, status: "active" },
    { category_id: catMap["Smart Watches & Fitness Bands"], name: "Haylou Solar Plus RT3 AMOLED Smartwatch", product_code: "PRD-HAYRT3", barcode: "89010027", purchase_cost: 8200, selling_price: 10999, quantity: 14, minimum_stock: 4, brand: "Haylou", track_stock: 1, track_batches: 0, status: "active" },
    { category_id: catMap["Smart Watches & Fitness Bands"], name: "Xiaomi Smart Band 8 Active Black", product_code: "PRD-MIBND8", barcode: "89010028", purchase_cost: 5400, selling_price: 7200, quantity: 1, minimum_stock: 6, brand: "Xiaomi", track_stock: 1, track_batches: 0, status: "active" }, // Low stock

    // Memory Cards & USB Storage
    { category_id: catMap["Memory Cards & USB Storage"], name: "SanDisk Ultra 128GB MicroSDXC Class 10 UHS-I", product_code: "PRD-SD128G", barcode: "89010029", purchase_cost: 2100, selling_price: 3100, quantity: 40, minimum_stock: 8, brand: "SanDisk", track_stock: 1, track_batches: 1, status: "active" },
    { category_id: catMap["Memory Cards & USB Storage"], name: "Kingston DataTraveler Exodia 64GB USB 3.2 Flash Drive", product_code: "PRD-KNG64G", barcode: "89010030", purchase_cost: 1300, selling_price: 1950, quantity: 30, minimum_stock: 6, brand: "Kingston", track_stock: 1, track_batches: 0, status: "active" },
  ];

  for (const p of productsData) {
    if (p.category_id) {
      await supabase.from("products").upsert(p, { onConflict: "product_code" });
    }
  }
  const { data: savedProds } = await supabase.from("products").select("id, name, product_code");
  results.products = savedProds?.length || 0;
  const prodMap = Object.fromEntries((savedProds || []).map((p) => [p.product_code, p.id]));

  // 5. SEED EXPENSES
  const expCats = [
    { name: "Rent", description: "Shop and warehouse monthly rent" },
    { name: "Electricity", description: "Commercial power bill" },
    { name: "Employee Salary", description: "Monthly staff payroll" },
    { name: "Internet & Utilities", description: "High speed fiber & drinking water" },
    { name: "Office Supplies", description: "Carrier bags & receipt paper rolls" },
    { name: "Shop Maintenance", description: "CCTV, furniture & hardware service" },
  ];
  for (const ec of expCats) {
    await supabase.from("expense_categories").upsert(ec, { onConflict: "name" });
  }
  const { data: savedExpCats } = await supabase.from("expense_categories").select("id, name");
  const expCatMap = Object.fromEntries((savedExpCats || []).map((ec) => [ec.name, ec.id]));

  const expensesData = [
    { expense_category_id: expCatMap["Rent"], title: "Shop Monthly Rent - August 2026", amount: 75000, expense_date: "2026-08-01", description: "Commercial plaza shop unit rent payment", payment_method: "cheque", added_by: 1, status: "active" },
    { expense_category_id: expCatMap["Employee Salary"], title: "Staff Payroll & Cashier Salaries", amount: 60000, expense_date: "2026-08-05", description: "Monthly salary for senior cashier", payment_method: "bank_transfer", added_by: 1, status: "active" },
    { expense_category_id: expCatMap["Electricity"], title: "LESCO Commercial Electricity Bill", amount: 38500, expense_date: "2026-08-10", description: "Commercial 3-phase electricity consumption bill", payment_method: "cash", added_by: 1, status: "active" },
    { expense_category_id: expCatMap["Internet & Utilities"], title: "StormFiber High-Speed Business Internet", amount: 4500, expense_date: "2026-08-12", description: "50 Mbps business dedicated optical fiber bill", payment_method: "mobile_wallet", added_by: 1, status: "active" },
    { expense_category_id: expCatMap["Office Supplies"], title: "Custom Printed Branding Bags & Bill Rolls", amount: 8200, expense_date: "2026-08-16", description: "1000 pcs carrier bags and thermal receipt rolls", payment_method: "cash", added_by: 1, status: "active" },
    { expense_category_id: expCatMap["Shop Maintenance"], title: "CCTV Cameras Servicing & POS Backup Maintenance", amount: 6000, expense_date: "2026-08-19", description: "Serviced security camera NVR and battery backup", payment_method: "cash", added_by: 1, status: "active" },
  ];

  for (const exp of expensesData) {
    if (exp.expense_category_id) {
      await supabase.from("expenses").insert(exp);
    }
  }
  results.expenses = expensesData.length;

  // 6. SEED NOTIFICATIONS
  const notifsData = [
    { notification_type: "announcement", severity: "info", title: "Welcome to Mobile Shop POS Live Cloud", message: "Your POS store is fully synchronized with Supabase database and ready for fast billing.", module: "system", related_type: "system", action_url: "/dashboard", source_key: "welcome_announcement", status: "unread", is_system_generated: 0 },
    { notification_type: "stock_out", severity: "critical", title: "Out of Stock: Tecno Spark 20 Pro", message: "Tecno Spark 20 Pro has 0 units remaining. Restock immediately to continue billing.", module: "inventory", related_type: "product", action_url: "/inventory?search=Tecno", source_key: "stock_out_seed_tec20", status: "unread", is_system_generated: 1 },
    { notification_type: "stock_out", severity: "critical", title: "Out of Stock: Baseus Blade 100W Power Bank", message: "Baseus Blade 100W 20000mAh Laptop Power Bank has 0 units remaining.", module: "inventory", related_type: "product", action_url: "/inventory?search=Baseus", source_key: "stock_out_seed_basbld", status: "unread", is_system_generated: 1 },
    { notification_type: "stock_low", severity: "warning", title: "Low Stock Alert: Ronin R-520 Earphones", message: "Ronin R-520 Earphones is running low with only 2 units remaining (Minimum threshold: 8).", module: "inventory", related_type: "product", action_url: "/inventory?filter=low", source_key: "stock_low_seed_ron520", status: "unread", is_system_generated: 1 },
    { notification_type: "stock_low", severity: "warning", title: "Low Stock Alert: Apple Lightning to 3.5mm Adapter", message: "Apple Lightning to 3.5mm Adapter has only 3 units remaining (Minimum threshold: 10).", module: "inventory", related_type: "product", action_url: "/inventory?filter=low", source_key: "stock_low_seed_ap35", status: "unread", is_system_generated: 1 },
    { notification_type: "supplier_balance", severity: "warning", title: "Outstanding Vendor Due: Airlink Communications", message: "Pending payable balance of Rs. 125,000 for Airlink Communications. Review ledger.", module: "suppliers", related_type: "supplier", action_url: "/suppliers?search=Airlink", source_key: "supp_balance_seed_airlink", status: "unread", is_system_generated: 1 },
    { notification_type: "supplier_balance", severity: "warning", title: "Outstanding Vendor Due: Mega Cellular & Accessories", message: "Pending payable balance of Rs. 50,000 for Mega Cellular. Review ledger.", module: "suppliers", related_type: "supplier", action_url: "/suppliers?search=Mega", source_key: "supp_balance_seed_mega", status: "unread", is_system_generated: 1 },
  ];

  for (const n of notifsData) {
    await supabase.from("notifications").upsert(n, { onConflict: "source_key" });
  }
  results.notifications = notifsData.length;

  return { success: true, results };
}
