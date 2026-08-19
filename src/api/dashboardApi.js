import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getDashboard() {
  if (isSupabaseConfigured()) {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.slice(0, 7);

    // 1. Fetch Sales
    const { data: salesData, error: salesErr } = await supabase
      .from("sales")
      .select("id, invoice_number, subtotal, discount_amount, tax_amount, grand_total, payment_method, status, created_at, cashier_id")
      .order("created_at", { ascending: false });

    if (salesErr) throw new Error(salesErr.message);

    const allSales = salesData || [];
    const completedSales = allSales.filter((s) => s.status === "completed");

    const todaySalesList = completedSales.filter((s) => s.created_at?.startsWith(today));
    const monthSalesList = completedSales.filter((s) => s.created_at?.startsWith(currentMonth));

    const todaySales = todaySalesList.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
    const todayGross = todaySalesList.reduce((acc, s) => acc + Number(s.subtotal || 0), 0);
    const todayDiscounts = todaySalesList.reduce((acc, s) => acc + Number(s.discount_amount || 0), 0);
    const todayOrders = todaySalesList.length;
    const monthSalesTotal = monthSalesList.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);

    // 2. Fetch Sale Items for today's costs and best selling
    const { data: saleItemsData } = await supabase
      .from("sale_items")
      .select("id, sale_id, product_id, product_name, quantity, unit_price, purchase_cost, line_total, created_at");

    const allItems = saleItemsData || [];
    const todaySaleIds = new Set(todaySalesList.map((s) => s.id));
    const todayItems = allItems.filter((i) => todaySaleIds.has(i.sale_id));

    const todayItemsSold = todayItems.reduce((acc, i) => acc + Number(i.quantity || 0), 0);
    const todayCostOfGoods = todayItems.reduce((acc, i) => acc + Number(i.purchase_cost || 0) * Number(i.quantity || 0), 0);

    // 3. Fetch Expenses
    const { data: expensesData } = await supabase
      .from("expenses")
      .select("amount, status, expense_date")
      .eq("status", "active");

    const allExpenses = expensesData || [];
    const todayExpensesList = allExpenses.filter((e) => e.expense_date === today);
    const todayExpenses = todayExpensesList.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const grossProfit = todaySales - todayCostOfGoods;
    const estimatedProfit = grossProfit - todayExpenses;

    // 4. Fetch Products for Stock counts
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, quantity, minimum_stock, track_stock, selling_price, status");

    const allProducts = productsData || [];
    const activeProducts = allProducts.filter((p) => p.status === "active");
    const lowStockCount = activeProducts.filter(
      (p) => p.track_stock === 1 && Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minimum_stock || 5)
    ).length;
    const outOfStockCount = activeProducts.filter(
      (p) => p.track_stock === 1 && Number(p.quantity) <= 0
    ).length;

    // 5. Calculate Best Selling Products
    const productSoldMap = {};
    for (const item of allItems) {
      const pId = item.product_id;
      if (!productSoldMap[pId]) {
        productSoldMap[pId] = {
          id: pId,
          name: item.product_name || "Unknown Product",
          sold_quantity: 0,
          total_revenue: 0,
        };
      }
      productSoldMap[pId].sold_quantity += Number(item.quantity || 0);
      productSoldMap[pId].total_revenue += Number(item.line_total || 0);
    }
    const bestSellingProducts = Object.values(productSoldMap)
      .sort((a, b) => b.sold_quantity - a.sold_quantity)
      .slice(0, 5);

    // 6. Payment methods breakdown
    const methodCounts = {};
    for (const sale of todaySalesList) {
      const m = sale.payment_method || "cash";
      if (!methodCounts[m]) methodCounts[m] = { method: m, total: 0, count: 0 };
      methodCounts[m].total += Number(sale.grand_total || 0);
      methodCounts[m].count += 1;
    }
    const paymentMethods = Object.values(methodCounts).map((pm) => ({
      ...pm,
      payment_method: pm.method,
      sales_count: pm.count,
      label: pm.method.charAt(0).toUpperCase() + pm.method.slice(1).replace("_", " "),
      percentage: todaySales > 0 ? Math.round((pm.total / todaySales) * 100) : 0,
    }));

    // 7. Hourly sales for today
    const hourlyMap = {};
    for (let h = 8; h <= 22; h++) {
      const label = `${String(h).padStart(2, "0")}:00`;
      hourlyMap[label] = { label, total: 0, count: 0 };
    }
    for (const s of todaySalesList) {
      if (s.created_at) {
        const hourNum = new Date(s.created_at).getHours();
        const label = `${String(hourNum).padStart(2, "0")}:00`;
        if (hourlyMap[label]) {
          hourlyMap[label].total += Number(s.grand_total || 0);
          hourlyMap[label].count += 1;
        }
      }
    }
    const hourlySales = Object.values(hourlyMap);

    // 8. Monthly daily sales
    const monthlyMap = {};
    for (let d = 1; d <= 31; d++) {
      const dStr = `${currentMonth}-${String(d).padStart(2, "0")}`;
      monthlyMap[dStr] = { label: `${d}`, date: dStr, total: 0, count: 0 };
    }
    for (const s of monthSalesList) {
      if (s.created_at) {
        const dStr = s.created_at.slice(0, 10);
        if (monthlyMap[dStr]) {
          monthlyMap[dStr].total += Number(s.grand_total || 0);
          monthlyMap[dStr].count += 1;
        }
      }
    }
    const monthlySales = Object.values(monthlyMap);

    return {
      summary: {
        today_sales: todaySales,
        today_orders: todayOrders,
        today_items_sold: todayItemsSold,
        net_sales: todaySales - todayExpenses,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        total_sales_month: monthSalesTotal,
        today_profit: estimatedProfit,
        monthly_profit: monthSalesTotal - todayExpenses,
        today_expenses: todayExpenses,
      },
      permissions: {
        view_financials: true,
        view_profit: true,
        view_costs: true,
      },
      profit_breakdown: {
        gross_sales: todayGross,
        discounts: todayDiscounts,
        net_sales: todaySales,
        cost_of_goods_sold: todayCostOfGoods,
        gross_profit: grossProfit,
        expenses: todayExpenses,
        estimated_profit: estimatedProfit,
      },
      hourly_sales: hourlySales,
      monthly_sales: monthlySales,
      payment_methods: paymentMethods.length > 0 ? paymentMethods : [
        { method: "cash", label: "Cash", total: todaySales, count: todayOrders, percentage: 100 }
      ],
      recent_sales: allSales.slice(0, 6).map((s) => ({
        ...s,
        cashier_name: "Staff",
      })),
      best_selling_products: bestSellingProducts,
    };
  }

  const response = await apiClient.get("/dashboard");
  return response.data.data;
}
