import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

function inDateRange(dateStr, dateFrom, dateTo) {
  if (!dateStr) return true;
  const d = String(dateStr).slice(0, 10);
  if (dateFrom && d < dateFrom) return false;
  if (dateTo && d > dateTo) return false;
  return true;
}

export async function getReport(type, params = {}, signal) {
  if (isSupabaseConfigured()) {
    const dateFrom = params.date_from || "";
    const dateTo = params.date_to || "";
    const searchQuery = (params.search || "").toLowerCase();

    // 1. Fetch base tables
    const [
      salesRes,
      saleItemsRes,
      expensesRes,
      productsRes,
      categoriesRes,
      suppliersRes,
      purchasesRes,
      purchaseItemsRes,
      purchaseReturnsRes,
      stockTxRes,
      cashiersRes,
    ] = await Promise.all([
      supabase.from("sales").select("*, access_credentials:cashier_id (name)"),
      supabase.from("sale_items").select("*"),
      supabase.from("expenses").select("*, expense_categories:expense_category_id (name)"),
      supabase.from("products").select("*, categories:category_id (name)"),
      supabase.from("categories").select("*"),
      supabase.from("suppliers").select("*"),
      supabase.from("purchases").select("*, suppliers:supplier_id (name, phone)"),
      supabase.from("purchase_items").select("*"),
      supabase.from("purchase_returns").select("*, suppliers:supplier_id (name)"),
      supabase.from("stock_transactions").select("*, products:product_id (name, product_code, category_id, categories:category_id (name))"),
      supabase.from("access_credentials").select("id, name, username, role"),
    ]);

    let rawSales = salesRes.data || [];
    let rawSaleItems = saleItemsRes.data || [];
    let rawExpenses = expensesRes.data || [];
    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    const suppliers = suppliersRes.data || [];
    let rawPurchases = purchasesRes.data || [];
    const purchaseItems = purchaseItemsRes.data || [];
    let rawPurchaseReturns = purchaseReturnsRes.data || [];
    let rawStockTransactions = stockTxRes.data || [];
    const cashiers = cashiersRes.data || [];

    // Date-Filtered Sets
    const sales = rawSales.filter((s) => inDateRange(s.created_at || s.sale_date, dateFrom, dateTo));
    const completedSales = sales.filter((s) => s.status === "completed");
    const validSaleIds = new Set(completedSales.map((s) => s.id));
    const saleItems = rawSaleItems.filter((it) => validSaleIds.has(it.sale_id));

    const expenses = rawExpenses.filter((e) => inDateRange(e.expense_date || e.created_at, dateFrom, dateTo));
    const activeExpenses = expenses.filter((e) => e.status === "active");

    const purchases = rawPurchases.filter((p) => inDateRange(p.purchase_date || p.created_at, dateFrom, dateTo));
    const purchaseReturns = rawPurchaseReturns.filter((r) => inDateRange(r.return_date || r.created_at, dateFrom, dateTo));
    const stockTransactions = rawStockTransactions.filter((st) => inDateRange(st.created_at, dateFrom, dateTo));

    // Core Metrics
    const grossSales = completedSales.reduce((acc, s) => acc + Number(s.subtotal || s.grand_total || 0), 0);
    const totalDiscounts = completedSales.reduce((acc, s) => acc + Number(s.discount_amount || 0), 0);
    const netSales = completedSales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
    const totalExpenses = activeExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    
    // Accurate COGS
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

    // ==========================================
    // A. OVERVIEW / PERIOD / PROFIT REPORTS
    // ==========================================
    if (
      type === "overview" ||
      type === "profit" ||
      type === "daily_sales" ||
      type === "weekly_sales" ||
      type === "monthly_sales"
    ) {
      const periodMap = {};

      completedSales.forEach((s) => {
        const fullDate = (s.created_at || s.sale_date || "").slice(0, 10) || "Today";
        let periodKey = fullDate;
        if (type === "monthly_sales") {
          periodKey = fullDate.slice(0, 7); // YYYY-MM
        }

        if (!periodMap[periodKey]) {
          periodMap[periodKey] = {
            period_start: periodKey,
            completed_sales: 0,
            gross_sales: 0,
            discounts: 0,
            net_sales: 0,
            cost_of_goods: 0,
            expenses: 0,
            estimated_net_profit: 0,
          };
        }
        periodMap[periodKey].completed_sales += 1;
        periodMap[periodKey].gross_sales += Number(s.subtotal || s.grand_total || 0);
        periodMap[periodKey].discounts += Number(s.discount_amount || 0);
        periodMap[periodKey].net_sales += Number(s.grand_total || 0);
      });

      // Calculate cost per period
      saleItems.forEach((it) => {
        const parentSale = completedSales.find((s) => s.id === it.sale_id);
        if (parentSale) {
          const fullDate = (parentSale.created_at || parentSale.sale_date || "").slice(0, 10) || "Today";
          const periodKey = type === "monthly_sales" ? fullDate.slice(0, 7) : fullDate;
          if (periodMap[periodKey]) {
            periodMap[periodKey].cost_of_goods += Number(it.quantity || 0) * Number(it.purchase_cost || 0);
          }
        }
      });

      activeExpenses.forEach((e) => {
        const fullDate = (e.expense_date || e.created_at || "").slice(0, 10) || "Today";
        const periodKey = type === "monthly_sales" ? fullDate.slice(0, 7) : fullDate;
        if (!periodMap[periodKey]) {
          periodMap[periodKey] = {
            period_start: periodKey,
            completed_sales: 0,
            gross_sales: 0,
            discounts: 0,
            net_sales: 0,
            cost_of_goods: 0,
            expenses: 0,
            estimated_net_profit: 0,
          };
        }
        periodMap[periodKey].expenses += Number(e.amount || 0);
      });

      const rows = Object.values(periodMap)
        .map((r) => {
          const cogs = r.cost_of_goods > 0 ? r.cost_of_goods : r.net_sales * 0.7;
          return {
            ...r,
            cost_of_goods: cogs,
            estimated_net_profit: r.net_sales - cogs - r.expenses,
          };
        })
        .sort((a, b) => b.period_start.localeCompare(a.period_start));

      const chart = rows.slice(0, 15).reverse().map((r) => ({
        label: r.period_start,
        value: r.net_sales,
        secondary: r.expenses,
        primaryLabel: "Net Sales",
        secondaryLabel: "Expenses",
      }));

      return {
        summary: {
          gross_sales: grossSales,
          total_discounts: totalDiscounts,
          net_sales: netSales,
          cost_of_goods: totalCostOfGoods || netSales * 0.7,
          gross_profit: grossProfit,
          expenses: totalExpenses,
          estimated_net_profit: netProfit,
          completed_sales: completedSales.length,
          total_stock_value: stockValuation,
        },
        rows: rows.length > 0 ? rows : [
          {
            period_start: dateFrom || new Date().toISOString().slice(0, 10),
            completed_sales: completedSales.length,
            gross_sales: grossSales,
            discounts: totalDiscounts,
            net_sales: netSales,
            cost_of_goods: totalCostOfGoods,
            expenses: totalExpenses,
            estimated_net_profit: netProfit,
          },
        ],
        chart,
      };
    }

    // ==========================================
    // B. SALES DETAIL REPORT
    // ==========================================
    if (type === "sales") {
      let filtered = sales;
      if (params.payment_method && params.payment_method !== "all") {
        filtered = filtered.filter((s) => s.payment_method === params.payment_method);
      }
      if (params.cashier_id && params.cashier_id !== "all") {
        filtered = filtered.filter((s) => String(s.cashier_id) === String(params.cashier_id));
      }
      if (params.sale_status && params.sale_status !== "all") {
        filtered = filtered.filter((s) => s.status === params.sale_status);
      }
      if (searchQuery) {
        filtered = filtered.filter(
          (s) =>
            (s.invoice_number && s.invoice_number.toLowerCase().includes(searchQuery)) ||
            (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery))
        );
      }

      const rows = filtered.map((s) => ({
        id: s.id,
        invoice_number: s.invoice_number,
        sale_date: (s.created_at || s.sale_date || "").slice(0, 10),
        cashier_role: s.access_credentials?.name || "Cashier",
        customer_name: s.customer_name || "Walk-in Customer",
        item_count: rawSaleItems.filter((i) => i.sale_id === s.id).length || 1,
        grand_total: Number(s.grand_total || 0),
        payment_method: (s.payment_method || "cash").toUpperCase().replaceAll("_", " "),
        status: s.status || "completed",
      }));

      const chart = rows.slice(0, 12).map((r) => ({
        label: r.invoice_number,
        value: r.grand_total,
        primaryLabel: "Invoice Amount",
      }));

      return {
        summary: {
          net_sales: rows.reduce((acc, r) => acc + (r.status === "completed" ? r.grand_total : 0), 0),
          completed_sales: rows.filter((r) => r.status === "completed").length,
          total_discounts: totalDiscounts,
        },
        rows,
        chart,
      };
    }

    // ==========================================
    // C. PRODUCT SALES & BEST SELLERS
    // ==========================================
    if (type === "products" || type === "best_selling_products") {
      const prodMap = {};

      saleItems.forEach((it) => {
        const id = it.product_id;
        if (!prodMap[id]) {
          prodMap[id] = {
            product_name: it.product_name || "Product",
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
        prodMap[id].gross_profit += (it.line_total || qty * price) - qty * cost;
      });

      products.forEach((p) => {
        if (prodMap[p.id]) {
          prodMap[p.id].category_name = p.categories?.name || "General";
          prodMap[p.id].product_code = p.product_code || p.barcode || prodMap[p.id].product_code;
        }
      });

      let rows = Object.values(prodMap);
      if (params.category_id && params.category_id !== "all") {
        const selectedCat = categories.find((c) => String(c.id) === String(params.category_id));
        if (selectedCat) {
          rows = rows.filter((r) => r.category_name === selectedCat.name);
        }
      }
      if (searchQuery) {
        rows = rows.filter(
          (r) =>
            r.product_name.toLowerCase().includes(searchQuery) ||
            r.product_code.toLowerCase().includes(searchQuery)
        );
      }

      rows = rows
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .map((r, idx) => ({
          ...r,
          rank: idx + 1,
          contribution_percentage: netSales > 0 ? ((r.net_sales / netSales) * 100).toFixed(1) + "%" : "0%",
        }));

      const chart = rows.slice(0, 10).map((r) => ({
        label: r.product_name,
        value: r.net_sales,
        secondary: r.gross_profit,
        primaryLabel: "Revenue",
        secondaryLabel: "Gross Profit",
      }));

      return {
        summary: {
          total_products_sold: rows.length,
          total_quantity_sold: rows.reduce((acc, r) => acc + r.quantity_sold, 0),
          net_sales: rows.reduce((acc, r) => acc + r.net_sales, 0),
          gross_profit: rows.reduce((acc, r) => acc + r.gross_profit, 0),
        },
        rows,
        chart,
      };
    }

    // ==========================================
    // D. CATEGORY SALES
    // ==========================================
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
        const catId = prod?.category_id || categories[0]?.id || 1;
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
        catMap[catId].gross_profit += lineTot - cost;
        catMap[catId].products_sold += 1;
        catMap[catId].sales_count += 1;
      });

      let rows = Object.values(catMap)
        .map((r) => ({
          ...r,
          contribution_percentage: netSales > 0 ? ((r.net_sales / netSales) * 100).toFixed(1) + "%" : "0%",
        }))
        .filter((r) => r.quantity_sold > 0 || r.net_sales > 0);

      if (searchQuery) {
        rows = rows.filter((r) => r.category_name.toLowerCase().includes(searchQuery));
      }

      const chart = rows.slice(0, 10).map((r) => ({
        label: r.category_name,
        value: r.net_sales,
        secondary: r.gross_profit,
        primaryLabel: "Category Revenue",
        secondaryLabel: "Profit",
      }));

      return {
        summary: {
          categories_count: rows.length,
          net_sales: netSales,
          gross_profit: grossProfit,
        },
        rows,
        chart,
      };
    }

    // ==========================================
    // E. CASHIERS REPORT
    // ==========================================
    if (type === "cashiers") {
      const cashierMap = {};
      cashiers.forEach((c) => {
        cashierMap[c.id] = {
          cashier_role: c.name || c.username || "Cashier",
          completed_sales: 0,
          cancelled_sales: 0,
          refunded_sales: 0,
          net_sales: 0,
          average_sale_value: 0,
          cash_payments: 0,
          non_cash_payments: 0,
        };
      });

      sales.forEach((s) => {
        const cId = s.cashier_id || cashiers[0]?.id || 1;
        if (!cashierMap[cId]) {
          cashierMap[cId] = {
            cashier_role: s.access_credentials?.name || "Cashier",
            completed_sales: 0,
            cancelled_sales: 0,
            refunded_sales: 0,
            net_sales: 0,
            average_sale_value: 0,
            cash_payments: 0,
            non_cash_payments: 0,
          };
        }

        if (s.status === "completed") {
          cashierMap[cId].completed_sales += 1;
          const amt = Number(s.grand_total || 0);
          cashierMap[cId].net_sales += amt;
          if ((s.payment_method || "cash") === "cash") {
            cashierMap[cId].cash_payments += amt;
          } else {
            cashierMap[cId].non_cash_payments += amt;
          }
        } else if (s.status === "cancelled") {
          cashierMap[cId].cancelled_sales += 1;
        } else if (s.status === "refunded") {
          cashierMap[cId].refunded_sales += 1;
        }
      });

      let rows = Object.values(cashierMap).map((r) => ({
        ...r,
        average_sale_value: r.completed_sales > 0 ? r.net_sales / r.completed_sales : 0,
      })).filter((r) => r.completed_sales > 0 || r.cancelled_sales > 0 || r.refunded_sales > 0);

      if (searchQuery) {
        rows = rows.filter((r) => r.cashier_role.toLowerCase().includes(searchQuery));
      }

      const chart = rows.map((r) => ({
        label: r.cashier_role,
        value: r.net_sales,
        secondary: r.cash_payments,
        primaryLabel: "Total Sales",
        secondaryLabel: "Cash Collected",
      }));

      return {
        summary: {
          total_cashiers: rows.length,
          net_sales: netSales,
          completed_sales: completedSales.length,
        },
        rows,
        chart,
      };
    }

    // ==========================================
    // F. PAYMENT METHODS REPORT
    // ==========================================
    if (type === "payment_methods") {
      const methodMap = {
        cash: { payment_method: "Cash", transaction_count: 0, gross_amount: 0, refunded_amount: 0, net_collected: 0, percentage: "0%" },
        card: { payment_method: "Card / POS", transaction_count: 0, gross_amount: 0, refunded_amount: 0, net_collected: 0, percentage: "0%" },
        bank_transfer: { payment_method: "Bank Transfer", transaction_count: 0, gross_amount: 0, refunded_amount: 0, net_collected: 0, percentage: "0%" },
        mobile_wallet: { payment_method: "JazzCash / EasyPaisa", transaction_count: 0, gross_amount: 0, refunded_amount: 0, net_collected: 0, percentage: "0%" },
        cheque: { payment_method: "Cheque", transaction_count: 0, gross_amount: 0, refunded_amount: 0, net_collected: 0, percentage: "0%" },
        other: { payment_method: "Other", transaction_count: 0, gross_amount: 0, refunded_amount: 0, net_collected: 0, percentage: "0%" },
      };

      sales.forEach((s) => {
        const m = s.payment_method || "cash";
        if (!methodMap[m]) {
          methodMap[m] = { payment_method: m.toUpperCase(), transaction_count: 0, gross_amount: 0, refunded_amount: 0, net_collected: 0, percentage: "0%" };
        }
        const tot = Number(s.grand_total || 0);
        if (s.status === "completed") {
          methodMap[m].transaction_count += 1;
          methodMap[m].gross_amount += tot;
          methodMap[m].net_collected += tot;
        } else if (s.status === "refunded") {
          methodMap[m].refunded_amount += tot;
        }
      });

      const rows = Object.values(methodMap)
        .map((r) => ({
          ...r,
          percentage: netSales > 0 ? ((r.net_collected / netSales) * 100).toFixed(1) + "%" : "0%",
        }))
        .filter((r) => r.transaction_count > 0 || r.gross_amount > 0);

      const chart = rows.map((r) => ({
        label: r.payment_method,
        value: r.net_collected,
        primaryLabel: "Collected Volume",
      }));

      return {
        summary: {
          net_collected: netSales,
          total_transactions: completedSales.length,
        },
        rows,
        chart,
      };
    }

    // ==========================================
    // G. EXPENSES REPORT
    // ==========================================
    if (type === "expenses") {
      let filtered = expenses;
      if (params.expense_category_id && params.expense_category_id !== "all") {
        filtered = filtered.filter((e) => String(e.expense_category_id) === String(params.expense_category_id));
      }
      if (params.expense_status && params.expense_status !== "all") {
        filtered = filtered.filter((e) => (e.status || "active") === params.expense_status);
      }
      if (searchQuery) {
        filtered = filtered.filter(
          (e) =>
            (e.title && e.title.toLowerCase().includes(searchQuery)) ||
            (e.description && e.description.toLowerCase().includes(searchQuery))
        );
      }

      const rows = filtered.map((e) => ({
        id: e.id,
        expense_date: e.expense_date,
        title: e.title,
        category_name: e.expense_categories?.name || "General",
        added_by_role: "Admin",
        payment_method: (e.payment_method || "cash").toUpperCase().replaceAll("_", " "),
        amount: Number(e.amount || 0),
        status: e.status || "active",
      }));

      const chart = rows.slice(0, 12).map((r) => ({
        label: r.title,
        value: r.amount,
        primaryLabel: "Expense Amount",
      }));

      return {
        summary: {
          total_expenses: rows.filter((r) => r.status === "active").reduce((acc, r) => acc + r.amount, 0),
          active_expenses_count: rows.filter((r) => r.status === "active").length,
        },
        rows,
        chart,
      };
    }

    // ==========================================
    // H. STOCK / INVENTORY REPORTS
    // ==========================================
    if (
      type === "stock" ||
      type === "low_stock" ||
      type === "out_of_stock" ||
      type === "packaging_stock" ||
      type === "wastage"
    ) {
      if (type === "wastage") {
        const wastageTxs = stockTransactions.filter((st) =>
          ["damaged", "expired", "wastage", "loss"].includes(st.transaction_type)
        );

        let rows = wastageTxs.map((st) => {
          const prod = st.products || {};
          const cost = Number(prod.purchase_cost || 100);
          const qty = Math.abs(Number(st.quantity || 0));
          return {
            id: st.id,
            transaction_date: (st.created_at || "").slice(0, 10),
            product_name: prod.name || "Product",
            product_code: prod.product_code || `PRD-${st.product_id}`,
            category_name: prod.categories?.name || "General",
            transaction_type: (st.transaction_type || "Damaged").toUpperCase(),
            quantity: qty,
            unit_type: "Piece",
            reason: st.reason || "Defective / Expired",
            user_role: "Admin",
            cost_impact: qty * cost,
          };
        });

        if (params.transaction_type && params.transaction_type !== "all") {
          rows = rows.filter((r) => r.transaction_type.toLowerCase() === params.transaction_type.toLowerCase());
        }
        if (searchQuery) {
          rows = rows.filter(
            (r) =>
              r.product_name.toLowerCase().includes(searchQuery) ||
              r.product_code.toLowerCase().includes(searchQuery) ||
              r.reason.toLowerCase().includes(searchQuery)
          );
        }

        const chart = rows.slice(0, 10).map((r) => ({
          label: r.product_name,
          value: r.cost_impact,
          secondary: r.quantity,
          primaryLabel: "Cost Impact",
          secondaryLabel: "Wastage Qty",
        }));

        return {
          summary: {
            total_wastage_cost: rows.reduce((acc, r) => acc + r.cost_impact, 0),
            total_wastage_items: rows.reduce((acc, r) => acc + r.quantity, 0),
          },
          rows,
          chart,
        };
      }

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
          last_movement: (p.updated_at || p.created_at || "").slice(0, 10),
          pack_unit_name: "Master Box (10 Pcs)",
          total_purchased_packs: Math.ceil(qty / 10),
          stock_quantity_base: qty,
          real_world_status: qty > 0 ? "Healthy Stock" : "Depleted",
        };
      });

      if (params.category_id && params.category_id !== "all") {
        filteredProds = filteredProds.filter((p) => String(p.category_id) === String(params.category_id));
      }
      if (searchQuery) {
        filteredProds = filteredProds.filter(
          (p) =>
            p.product_name.toLowerCase().includes(searchQuery) ||
            p.product_code.toLowerCase().includes(searchQuery)
        );
      }

      if (type === "low_stock") {
        filteredProds = filteredProds.filter((p) => p.current_quantity > 0 && p.current_quantity <= p.minimum_stock);
      } else if (type === "out_of_stock") {
        filteredProds = filteredProds.filter((p) => p.current_quantity <= 0);
      }

      const chart = filteredProds.slice(0, 10).map((p) => ({
        label: p.product_name,
        value: p.estimated_stock_value,
        secondary: p.current_quantity,
        primaryLabel: "Stock Value",
        secondaryLabel: "Quantity",
      }));

      return {
        summary: {
          total_products: products.length,
          total_stock_units: products.reduce((acc, p) => acc + Number(p.quantity || 0), 0),
          estimated_stock_value: stockValuation,
          alert_items: products.filter((p) => Number(p.quantity || 0) <= Number(p.minimum_stock || 5)).length,
        },
        rows: filteredProds,
        chart,
      };
    }

    // ==========================================
    // I. PURCHASES & SUPPLIER REPORTS
    // ==========================================

    // 1. Purchases by Supplier (supplier_purchases)
    if (type === "supplier_purchases") {
      const suppMap = {};
      suppliers.forEach((s) => {
        suppMap[s.id] = {
          id: s.id,
          supplier_name: s.name,
          phone: s.phone || "—",
          purchase_count: 0,
          total_purchases: 0,
          amount_paid: 0,
          balance_due: 0,
          current_balance: Number(s.opening_balance || 0),
        };
      });

      purchases.forEach((p) => {
        const sId = p.supplier_id;
        if (!suppMap[sId]) {
          suppMap[sId] = {
            id: sId,
            supplier_name: p.suppliers?.name || "Supplier",
            phone: p.suppliers?.phone || "—",
            purchase_count: 0,
            total_purchases: 0,
            amount_paid: 0,
            balance_due: 0,
            current_balance: 0,
          };
        }
        const tot = Number(p.grand_total || p.subtotal || 0);
        const paid = Number(p.amount_paid || 0);
        const due = Number(p.balance_due || 0);

        suppMap[sId].purchase_count += 1;
        suppMap[sId].total_purchases += tot;
        suppMap[sId].amount_paid += paid;
        suppMap[sId].balance_due += due;
        suppMap[sId].current_balance += due;
      });

      let rows = Object.values(suppMap).filter((r) => r.purchase_count > 0 || r.total_purchases > 0);
      if (searchQuery) {
        rows = rows.filter((r) => r.supplier_name.toLowerCase().includes(searchQuery) || r.phone.includes(searchQuery));
      }

      const chart = rows.slice(0, 10).map((r) => ({
        label: r.supplier_name,
        value: r.total_purchases,
        secondary: r.amount_paid,
        primaryLabel: "Total Purchases",
        secondaryLabel: "Amount Paid",
      }));

      return {
        summary: {
          total_purchases: rows.reduce((acc, r) => acc + r.total_purchases, 0),
          total_paid: rows.reduce((acc, r) => acc + r.amount_paid, 0),
          total_due: rows.reduce((acc, r) => acc + r.balance_due, 0),
          total_suppliers: rows.length,
        },
        rows,
        chart,
      };
    }

    // 2. Purchases by Product (product_purchases)
    if (type === "product_purchases") {
      const prodMap = {};
      purchaseItems.forEach((it) => {
        const pId = it.product_id;
        if (!prodMap[pId]) {
          prodMap[pId] = {
            id: pId,
            product_name: it.product_name || "Product",
            product_code: `PRD-${pId}`,
            unit_type: "Piece",
            purchased_quantity: 0,
            returned_quantity: 0,
            net_quantity: 0,
            net_purchase_value: 0,
            average_unit_cost: 0,
          };
        }
        const qty = Number(it.quantity || 0);
        const cost = Number(it.unit_cost || it.purchase_cost || 0);
        prodMap[pId].purchased_quantity += qty;
        prodMap[pId].net_purchase_value += Number(it.subtotal || qty * cost);
      });

      products.forEach((p) => {
        if (prodMap[p.id]) {
          prodMap[p.id].product_name = p.name;
          prodMap[p.id].product_code = p.product_code || p.barcode || prodMap[p.id].product_code;
          prodMap[p.id].unit_type = p.unit || "Piece";
        }
      });

      let rows = Object.values(prodMap).map((r) => {
        const netQty = r.purchased_quantity - r.returned_quantity;
        return {
          ...r,
          net_quantity: netQty,
          average_unit_cost: r.purchased_quantity > 0 ? r.net_purchase_value / r.purchased_quantity : 0,
        };
      });

      if (searchQuery) {
        rows = rows.filter(
          (r) =>
            r.product_name.toLowerCase().includes(searchQuery) ||
            r.product_code.toLowerCase().includes(searchQuery)
        );
      }

      const chart = rows.slice(0, 10).map((r) => ({
        label: r.product_name,
        value: r.net_purchase_value,
        secondary: r.purchased_quantity,
        primaryLabel: "Purchase Value",
        secondaryLabel: "Units",
      }));

      return {
        summary: {
          total_purchase_value: rows.reduce((acc, r) => acc + r.net_purchase_value, 0),
          total_purchased_units: rows.reduce((acc, r) => acc + r.purchased_quantity, 0),
        },
        rows,
        chart,
      };
    }

    // 3. Monthly Purchases (monthly_purchases)
    if (type === "monthly_purchases") {
      const monthMap = {};
      purchases.forEach((p) => {
        const period = (p.purchase_date || p.created_at || "").slice(0, 7) || "This Month";
        if (!monthMap[period]) {
          monthMap[period] = {
            period,
            purchase_count: 0,
            total_purchases: 0,
            amount_paid: 0,
            balance_due: 0,
          };
        }
        monthMap[period].purchase_count += 1;
        monthMap[period].total_purchases += Number(p.grand_total || p.subtotal || 0);
        monthMap[period].amount_paid += Number(p.amount_paid || 0);
        monthMap[period].balance_due += Number(p.balance_due || 0);
      });

      const rows = Object.values(monthMap).sort((a, b) => b.period.localeCompare(a.period));

      const chart = rows.map((r) => ({
        label: r.period,
        value: r.total_purchases,
        secondary: r.amount_paid,
        primaryLabel: "Purchases",
        secondaryLabel: "Paid",
      }));

      return {
        summary: {
          total_purchases: rows.reduce((acc, r) => acc + r.total_purchases, 0),
          total_paid: rows.reduce((acc, r) => acc + r.amount_paid, 0),
          total_due: rows.reduce((acc, r) => acc + r.balance_due, 0),
        },
        rows,
        chart,
      };
    }

    // 4. Supplier Balances (supplier_balances)
    if (type === "supplier_balances") {
      let rows = suppliers.map((s) => {
        const suppPurchases = rawPurchases.filter((p) => p.supplier_id === s.id);
        const balanceDue = suppPurchases.reduce((acc, p) => acc + Number(p.balance_due || 0), 0);

        return {
          id: s.id,
          supplier_name: s.name,
          phone: s.phone || "—",
          email: s.email || "—",
          purchase_count: suppPurchases.length,
          opening_balance: Number(s.opening_balance || 0),
          current_balance: balanceDue,
          status: balanceDue > 0 ? "Outstanding Due" : "Settled",
        };
      });

      if (searchQuery) {
        rows = rows.filter((r) => r.supplier_name.toLowerCase().includes(searchQuery) || r.phone.includes(searchQuery));
      }

      const chart = rows.slice(0, 10).map((r) => ({
        label: r.supplier_name,
        value: r.current_balance,
        primaryLabel: "Outstanding Balance",
      }));

      return {
        summary: {
          total_supplier_balance: rows.reduce((acc, r) => acc + r.current_balance, 0),
          total_suppliers: rows.length,
        },
        rows,
        chart,
      };
    }

    // 5. Purchase Payments History (purchase_payments)
    if (type === "purchase_payments") {
      const rows = purchases
        .filter((p) => Number(p.amount_paid || 0) > 0)
        .map((p) => ({
          id: p.id,
          payment_date: (p.purchase_date || p.created_at || "").slice(0, 10),
          purchase_number: p.purchase_number || `PUR-${p.id}`,
          supplier_name: p.suppliers?.name || "Supplier",
          amount: Number(p.amount_paid || 0),
          payment_method: (p.payment_method || "cash").toUpperCase().replaceAll("_", " "),
          reference_number: p.supplier_invoice_number || `TXN-${p.id}`,
          notes: p.notes || "Supplier purchase settlement",
        }));

      const chart = rows.slice(0, 10).map((r) => ({
        label: r.supplier_name,
        value: r.amount,
        primaryLabel: "Payment Amount",
      }));

      return {
        summary: {
          total_paid: rows.reduce((acc, r) => acc + r.amount, 0),
          payment_count: rows.length,
        },
        rows,
        chart,
      };
    }

    // 6. Purchase Returns (purchase_returns)
    if (type === "purchase_returns") {
      let filtered = purchaseReturns;
      if (params.supplier_id && params.supplier_id !== "all") {
        filtered = filtered.filter((r) => String(r.supplier_id) === String(params.supplier_id));
      }
      if (searchQuery) {
        filtered = filtered.filter((r) =>
          (r.return_number && r.return_number.toLowerCase().includes(searchQuery)) ||
          (r.suppliers?.name && r.suppliers.name.toLowerCase().includes(searchQuery)) ||
          (r.reason && r.reason.toLowerCase().includes(searchQuery))
        );
      }

      const rows = filtered.map((r) => ({
        id: r.id,
        return_number: r.return_number || `PRET-${r.id}`,
        return_date: (r.return_date || r.created_at || "").slice(0, 10),
        purchase_number: r.purchase_id ? `PUR-${r.purchase_id}` : "PO Reference",
        supplier_name: r.suppliers?.name || "Supplier",
        return_value: Number(r.subtotal || r.total_amount || 0),
        refund_amount: Number(r.refund_amount || 0),
        reason: r.reason || "Vendor Return",
      }));

      const chart = rows.slice(0, 10).map((r) => ({
        label: r.return_number,
        value: r.return_value,
        secondary: r.refund_amount,
        primaryLabel: "Return Value",
        secondaryLabel: "Refund",
      }));

      return {
        summary: {
          total_returned: rows.reduce((acc, r) => acc + r.return_value, 0),
          total_refunded: rows.reduce((acc, r) => acc + r.refund_amount, 0),
          return_count: rows.length,
        },
        rows,
        chart,
      };
    }

    // 7. Purchase Summary (purchase_summary)
    if (type === "purchase_summary" || type.startsWith("purchase") || type.startsWith("supplier")) {
      let filtered = purchases;
      if (params.supplier_id && params.supplier_id !== "all") {
        filtered = filtered.filter((p) => String(p.supplier_id) === String(params.supplier_id));
      }
      if (searchQuery) {
        filtered = filtered.filter((p) =>
          (p.purchase_number && p.purchase_number.toLowerCase().includes(searchQuery)) ||
          (p.suppliers?.name && p.suppliers.name.toLowerCase().includes(searchQuery)) ||
          (p.supplier_invoice_number && p.supplier_invoice_number.toLowerCase().includes(searchQuery))
        );
      }

      const rows = filtered.map((p) => ({
        id: p.id,
        purchase_number: p.purchase_number || `PUR-${p.id}`,
        purchase_date: (p.purchase_date || p.created_at || "").slice(0, 10),
        supplier_name: p.suppliers?.name || "Supplier",
        supplier_invoice_number: p.supplier_invoice_number || "—",
        grand_total: Number(p.grand_total || p.subtotal || 0),
        amount_paid: Number(p.amount_paid || 0),
        balance_due: Number(p.balance_due || 0),
        payment_status: (p.payment_status || "paid").toUpperCase(),
        purchase_status: (p.purchase_status || "received").toUpperCase(),
      }));

      const chart = rows.slice(0, 10).map((r) => ({
        label: r.purchase_number,
        value: r.grand_total,
        secondary: r.amount_paid,
        primaryLabel: "Purchase Value",
        secondaryLabel: "Paid",
      }));

      return {
        summary: {
          total_purchases: rows.reduce((acc, r) => acc + r.grand_total, 0),
          total_paid: rows.reduce((acc, r) => acc + r.amount_paid, 0),
          total_due: rows.reduce((acc, r) => acc + r.balance_due, 0),
          purchase_count: rows.length,
        },
        rows,
        chart,
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
      chart: [],
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
  if (isSupabaseConfigured()) {
    const reportData = await getReport(type, params);
    const rows = reportData.rows || [];
    if (rows.length === 0) {
      return { data: "No data available for export" };
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] ?? "";
            return `"${String(val).replaceAll('"', '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    return { data: csvContent };
  }

  return apiClient.get("/reports/export", {
    params: { ...params, report_type: type },
    responseType: "blob",
  });
}
