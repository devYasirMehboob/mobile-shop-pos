import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getReport(type, params = {}, signal) {
  if (isSupabaseConfigured()) {
    // 1. Fetch core base datasets
    const [salesRes, saleItemsRes, expensesRes, productsRes, categoriesRes, suppliersRes, purchasesRes, purchaseReturnsRes, stockTxRes] =
      await Promise.all([
        supabase.from("sales").select("*, access_credentials:cashier_id (name)"),
        supabase.from("sale_items").select("*"),
        supabase.from("expenses").select("*, expense_categories:expense_category_id (name)"),
        supabase.from("products").select("*, categories:category_id (name)"),
        supabase.from("categories").select("*"),
        supabase.from("suppliers").select("*"),
        supabase.from("purchases").select("*, suppliers:supplier_id (name, phone)"),
        supabase.from("purchase_returns").select("*, suppliers:supplier_id (name)"),
        supabase.from("stock_transactions").select("*, products:product_id (name, product_code, category_id, categories:category_id (name))"),
      ]);

    const sales = salesRes.data || [];
    const saleItems = saleItemsRes.data || [];
    const expenses = expensesRes.data || [];
    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    const suppliers = suppliersRes.data || [];
    const purchases = purchasesRes.data || [];
    const purchaseReturns = purchaseReturnsRes.data || [];
    const stockTransactions = stockTxRes.data || [];

    const completedSales = sales.filter((s) => s.status === "completed");
    const activeExpenses = expenses.filter((e) => e.status === "active");

    const grossSales = completedSales.reduce((acc, s) => acc + Number(s.subtotal || s.grand_total || 0), 0);
    const totalDiscounts = completedSales.reduce((acc, s) => acc + Number(s.discount_amount || 0), 0);
    const netSales = completedSales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
    const totalExpenses = activeExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const totalCostOfGoods = saleItems.reduce(
      (acc, it) => acc + Number(it.quantity || 0) * Number(it.purchase_cost || 0),
      0
    );
    const grossProfit = netSales - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;
    const stockValuation = products.reduce(
      (acc, p) => acc + Number(p.quantity || 0) * Number(p.purchase_cost || 0),
      0
    );

    // --- REPORT GENERATORS BY TYPE ---

    // A. OVERVIEW / PERIOD / PROFIT
    if (type === "overview" || type === "profit" || type === "daily_sales" || type === "weekly_sales" || type === "monthly_sales") {
      // Group by day/month for charts and breakdown
      const periodMap = {};
      completedSales.forEach((s) => {
        const period = (s.created_at || "").slice(0, 10) || "Today";
        if (!periodMap[period]) {
          periodMap[period] = {
            period_start: period,
            completed_sales: 0,
            gross_sales: 0,
            discounts: 0,
            net_sales: 0,
            cost_of_goods: 0,
            expenses: 0,
            estimated_net_profit: 0,
          };
        }
        periodMap[period].completed_sales += 1;
        periodMap[period].gross_sales += Number(s.subtotal || s.grand_total || 0);
        periodMap[period].discounts += Number(s.discount_amount || 0);
        periodMap[period].net_sales += Number(s.grand_total || 0);
      });

      activeExpenses.forEach((e) => {
        const period = e.expense_date || "Today";
        if (!periodMap[period]) {
          periodMap[period] = {
            period_start: period,
            completed_sales: 0,
            gross_sales: 0,
            discounts: 0,
            net_sales: 0,
            cost_of_goods: 0,
            expenses: 0,
            estimated_net_profit: 0,
          };
        }
        periodMap[period].expenses += Number(e.amount || 0);
      });

      const rows = Object.values(periodMap).map((r) => ({
        ...r,
        cost_of_goods: r.net_sales * 0.7, // estimated COGS baseline
        estimated_net_profit: r.net_sales - (r.net_sales * 0.7) - r.expenses,
      })).sort((a, b) => b.period_start.localeCompare(a.period_start));

      const chart = rows.map((r) => ({
        label: r.period_start,
        value: r.net_sales,
        secondary: r.expenses,
      }));

      return {
        summary: {
          gross_sales: grossSales,
          total_discounts: totalDiscounts,
          net_sales: netSales,
          cost_of_goods: totalCostOfGoods || (netSales * 0.7),
          gross_profit: grossProfit,
          expenses: totalExpenses,
          estimated_net_profit: netProfit,
          completed_sales: completedSales.length,
          total_stock_value: stockValuation,
        },
        rows: rows.length > 0 ? rows : [
          {
            period_start: new Date().toISOString().slice(0, 10),
            completed_sales: completedSales.length,
            gross_sales: grossSales,
            discounts: totalDiscounts,
            net_sales: netSales,
            cost_of_goods: totalCostOfGoods,
            expenses: totalExpenses,
            estimated_net_profit: netProfit,
          }
        ],
        chart,
      };
    }

    // B. SALES DETAIL
    if (type === "sales") {
      const rows = sales.map((s) => ({
        id: s.id,
        invoice_number: s.invoice_number,
        sale_date: (s.created_at || "").slice(0, 10),
        cashier_role: s.access_credentials?.name || "Admin",
        customer_name: s.customer_name || "Walk-in Customer",
        item_count: 1,
        grand_total: Number(s.grand_total || 0),
        payment_method: (s.payment_method || "cash").toUpperCase(),
        status: s.status || "completed",
      }));

      return {
        summary: {
          net_sales: netSales,
          completed_sales: completedSales.length,
          total_discounts: totalDiscounts,
        },
        rows,
      };
    }

    // C. PRODUCTS & BEST SELLERS
    if (type === "products" || type === "best_selling_products") {
      const prodMap = {};
      saleItems.forEach((it) => {
        const id = it.product_id;
        if (!prodMap[id]) {
          prodMap[id] = {
            product_name: it.product_name,
            product_code: it.product_code || `PRD-${id}`,
            category_name: "General",
            quantity_sold: 0,
            gross_sales: 0,
            net_sales: 0,
            cost_of_goods: 0,
            gross_profit: 0,
          };
        }
        const qty = Number(it.quantity || 0);
        const price = Number(it.unit_price || 0);
        const cost = Number(it.purchase_cost || 0);
        prodMap[id].quantity_sold += qty;
        prodMap[id].gross_sales += qty * price;
        prodMap[id].net_sales += Number(it.line_total || qty * price);
        prodMap[id].cost_of_goods += qty * cost;
        prodMap[id].gross_profit += (qty * price) - (qty * cost);
      });

      // Match category names
      products.forEach((p) => {
        if (prodMap[p.id]) {
          prodMap[p.id].category_name = p.categories?.name || "General";
        }
      });

      const rows = Object.values(prodMap)
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .map((r, idx) => ({
          ...r,
          rank: idx + 1,
          contribution_percentage: netSales > 0 ? ((r.net_sales / netSales) * 100).toFixed(1) + "%" : "0%",
        }));

      return {
        summary: {
          total_products_sold: rows.length,
          total_quantity_sold: rows.reduce((acc, r) => acc + r.quantity_sold, 0),
          net_sales: rows.reduce((acc, r) => acc + r.net_sales, 0),
          gross_profit: rows.reduce((acc, r) => acc + r.gross_profit, 0),
        },
        rows,
      };
    }

    // D. CATEGORY SALES
    if (type === "categories") {
      const catMap = {};
      categories.forEach((c) => {
        catMap[c.id] = {
          category_name: c.name,
          quantity_sold: 0,
          products_sold: 0,
          sales_count: 0,
          net_sales: 0,
          gross_profit: 0,
          contribution_percentage: "0%",
        };
      });

      saleItems.forEach((it) => {
        const prod = products.find((p) => p.id === it.product_id);
        const catId = prod?.category_id || 1;
        if (!catMap[catId]) {
          catMap[catId] = {
            category_name: "General",
            quantity_sold: 0,
            products_sold: 0,
            sales_count: 0,
            net_sales: 0,
            gross_profit: 0,
            contribution_percentage: "0%",
          };
        }
        const qty = Number(it.quantity || 0);
        const lineTot = Number(it.line_total || 0);
        const cost = Number(it.purchase_cost || 0) * qty;
        catMap[catId].quantity_sold += qty;
        catMap[catId].net_sales += lineTot;
        catMap[catId].gross_profit += (lineTot - cost);
        catMap[catId].products_sold += 1;
      });

      const rows = Object.values(catMap).map((r) => ({
        ...r,
        contribution_percentage: netSales > 0 ? ((r.net_sales / netSales) * 100).toFixed(1) + "%" : "0%",
      })).filter((r) => r.quantity_sold > 0 || r.net_sales > 0);

      return {
        summary: {
          categories_count: rows.length,
          net_sales: netSales,
          gross_profit: grossProfit,
        },
        rows,
      };
    }

    // E. EXPENSES REPORT
    if (type === "expenses") {
      const rows = expenses.map((e) => ({
        id: e.id,
        expense_date: e.expense_date,
        title: e.title,
        category_name: e.expense_categories?.name || "General",
        added_by_role: "Admin",
        payment_method: (e.payment_method || "cash").toUpperCase(),
        amount: Number(e.amount || 0),
        status: e.status || "active",
      }));

      return {
        summary: {
          total_expenses: totalExpenses,
          active_expenses_count: activeExpenses.length,
        },
        rows,
      };
    }

    // F. STOCK / LOW STOCK / OUT OF STOCK / WASTAGE
    if (type === "stock" || type === "low_stock" || type === "out_of_stock" || type === "packaging_stock" || type === "wastage") {
      let filteredProds = products.map((p) => {
        const qty = Number(p.quantity || 0);
        const min = Number(p.minimum_stock || 5);
        const cost = Number(p.purchase_cost || 0);
        return {
          id: p.id,
          product_name: p.name,
          product_code: p.product_code || p.barcode || `PRD-${p.id}`,
          category_name: p.categories?.name || "General",
          current_quantity: qty,
          minimum_stock: min,
          shortage: Math.max(0, min - qty),
          unit_type: "Piece",
          stock_status: qty <= 0 ? "Out of Stock" : qty <= min ? "Low Stock" : "In Stock",
          product_status: p.status || "active",
          estimated_stock_value: qty * cost,
          last_movement: (p.updated_at || "").slice(0, 10) || "Recent",
          pack_unit_name: "Box (10 Pcs)",
          total_purchased_packs: Math.ceil(qty / 10),
          stock_quantity_base: qty,
          real_world_status: qty > 0 ? "Healthy Stock" : "Depleted",
        };
      });

      if (type === "low_stock") {
        filteredProds = filteredProds.filter((p) => p.current_quantity > 0 && p.current_quantity <= p.minimum_stock);
      } else if (type === "out_of_stock") {
        filteredProds = filteredProds.filter((p) => p.current_quantity <= 0);
      }

      return {
        summary: {
          total_products: products.length,
          total_stock_units: products.reduce((acc, p) => acc + Number(p.quantity || 0), 0),
          estimated_stock_value: stockValuation,
          alert_items: products.filter((p) => Number(p.quantity || 0) <= Number(p.minimum_stock || 5)).length,
        },
        rows: filteredProds,
      };
    }

    // G. PURCHASES & SUPPLIER BALANCES
    if (type.startsWith("purchase") || type.startsWith("supplier")) {
      const rows = purchases.map((p) => ({
        id: p.id,
        purchase_number: p.purchase_number,
        purchase_date: p.purchase_date,
        supplier_name: p.suppliers?.name || "Supplier",
        supplier_invoice_number: p.supplier_invoice_number || "—",
        grand_total: Number(p.grand_total || p.subtotal || 0),
        amount_paid: Number(p.amount_paid || 0),
        balance_due: Number(p.balance_due || 0),
        payment_status: (p.payment_status || "paid").toUpperCase(),
        purchase_status: p.purchase_status || "received",
      }));

      const totalPurchasesVal = purchases.reduce((acc, p) => acc + Number(p.grand_total || p.subtotal || 0), 0);
      const totalPaidVal = purchases.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);
      const totalDueVal = purchases.reduce((acc, p) => acc + Number(p.balance_due || 0), 0);

      return {
        summary: {
          total_purchases: totalPurchasesVal,
          total_paid: totalPaidVal,
          total_due: totalDueVal,
          purchase_count: purchases.length,
        },
        rows,
      };
    }

    // Default Fallback
    return {
      summary: {
        net_sales: netSales,
        total_expenses: totalExpenses,
        net_profit: netProfit,
      },
      rows: completedSales,
    };
  }

  const response = await apiClient.get(`/reports/${type}`, { params, signal });
  return response.data.data;
}

export async function getReportOptions() {
  if (isSupabaseConfigured()) {
    const { data: categories } = await supabase.from("categories").select("id, name");
    const { data: cashiers } = await supabase.from("access_credentials").select("id, name");
    const { data: suppliers } = await supabase.from("suppliers").select("id, name");
    const { data: expCats } = await supabase.from("expense_categories").select("id, name");
    const { data: prods } = await supabase.from("products").select("id, name");

    return {
      categories: categories || [],
      cashiers: cashiers || [],
      suppliers: suppliers || [],
      expense_categories: expCats || [],
      products: prods || [],
    };
  }

  const response = await apiClient.get("/reports/options");
  return response.data.data;
}

export async function exportReport(type, params = {}) {
  return apiClient.get("/reports/export", { params: { ...params, report_type: type }, responseType: "blob" });
}
