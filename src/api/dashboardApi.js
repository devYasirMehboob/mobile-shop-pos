import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getDashboard() {
  if (isSupabaseConfigured()) {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.slice(0, 7);
    const currentYear = new Date().getFullYear();

    // 1. Fetch Sales
    const { data: salesData, error: salesErr } = await supabase
      .from("sales")
      .select("id, invoice_number, customer_name, customer_phone, subtotal, discount_amount, tax_amount, grand_total, payment_method, payment_status, status, created_at, cashier_id")
      .order("created_at", { ascending: false });

    if (salesErr) throw new Error(salesErr.message);

    const allSales = salesData || [];
    const completedSales = allSales.filter((s) => s.status === "completed");

    const todaySalesList = completedSales.filter((s) => s.created_at?.startsWith(today));
    const monthSalesList = completedSales.filter((s) => s.created_at?.startsWith(currentMonth));

    const totalSalesAll = completedSales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
    const todaySales = todaySalesList.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
    const todayGross = todaySalesList.reduce((acc, s) => acc + Number(s.subtotal || 0), 0);
    const todayDiscounts = todaySalesList.reduce((acc, s) => acc + Number(s.discount_amount || 0), 0);
    const todayOrders = todaySalesList.length;
    const totalOrdersCount = allSales.length;
    const monthSalesTotal = monthSalesList.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);

    // 2. Fetch Purchases
    const { data: purchasesData } = await supabase
      .from("purchases")
      .select("id, grand_total, purchase_status, payment_status, balance_due, amount_paid, created_at, supplier_id")
      .order("created_at", { ascending: false });

    const allPurchases = purchasesData || [];
    const receivedPurchases = allPurchases.filter((p) => p.purchase_status !== "cancelled");
    const totalPurchases = receivedPurchases.reduce((acc, p) => acc + Number(p.grand_total || 0), 0);
    const totalSupplierDue = receivedPurchases.reduce((acc, p) => acc + Number(p.balance_due || 0), 0);

    // 3. Fetch Sale Items
    const { data: saleItemsData } = await supabase
      .from("sale_items")
      .select("id, sale_id, product_id, product_name, quantity, unit_price, purchase_cost, line_total, created_at");

    const allItems = saleItemsData || [];
    const todaySaleIds = new Set(todaySalesList.map((s) => s.id));
    const todayItems = allItems.filter((i) => todaySaleIds.has(i.sale_id));

    const todayItemsSold = todayItems.reduce((acc, i) => acc + Number(i.quantity || 0), 0);
    const todayCostOfGoods = todayItems.reduce(
      (acc, i) => acc + Number(i.purchase_cost || 0) * Number(i.quantity || 0),
      0
    );

    // 4. Fetch Expenses
    const { data: expensesData } = await supabase
      .from("expenses")
      .select("id, title, amount, status, expense_date, category_id, created_at")
      .eq("status", "active")
      .order("expense_date", { ascending: false });

    const allExpenses = expensesData || [];
    const totalExpenses = allExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const todayExpensesList = allExpenses.filter((e) => e.expense_date === today);
    const todayExpenses = todayExpensesList.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const grossProfit = todaySales - todayCostOfGoods;
    const estimatedProfit = grossProfit - todayExpenses;

    // 5. Fetch Products
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, product_code, barcode, category_id, quantity, minimum_stock, track_stock, selling_price, purchase_cost, image, status, updated_at")
      .order("quantity", { ascending: true });

    const allProducts = productsData || [];
    const activeProducts = allProducts.filter((p) => p.status === "active");
    const lowStockProductsList = activeProducts.filter(
      (p) => p.track_stock === 1 && Number(p.quantity) <= Number(p.minimum_stock || 5) && Number(p.quantity) > 0
    );
    const lowStockCount = lowStockProductsList.length;
    const outOfStockCount = activeProducts.filter(
      (p) => p.track_stock === 1 && Number(p.quantity) <= 0
    ).length;

    // 6. Fetch Categories & Suppliers & Returns
    const [{ data: categoriesData }, { data: suppliersData }, { data: returnsData }] =
      await Promise.all([
        supabase.from("categories").select("id, name"),
        supabase.from("suppliers").select("id, name, phone"),
        supabase.from("purchase_returns").select("id, refund_amount"),
      ]);

    const allCategories = categoriesData || [];
    const categoryMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]));
    const totalCategoriesCount = allCategories.length;
    const totalSuppliersCount = (suppliersData || []).length;
    const totalPurchaseReturns = (returnsData || []).reduce((acc, r) => acc + Number(r.refund_amount || 0), 0);

    // 7. Calculate 12-Months Sales & Purchase Comparison
    const monthlyData = MONTH_NAMES.map((name, idx) => {
      const monthPrefix = `${currentYear}-${String(idx + 1).padStart(2, "0")}`;
      const mSales = completedSales
        .filter((s) => s.created_at?.startsWith(monthPrefix))
        .reduce((sum, s) => sum + Number(s.grand_total || 0), 0);
      const mPurchase = receivedPurchases
        .filter((p) => p.created_at?.startsWith(monthPrefix))
        .reduce((sum, p) => sum + Number(p.grand_total || 0), 0);
      const mExpense = allExpenses
        .filter((e) => e.expense_date?.startsWith(monthPrefix))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      return {
        name,
        sales: mSales,
        purchase: mPurchase,
        expense: mExpense,
        rev: mSales,
        exp: mExpense + mPurchase,
      };
    });

    // 8. Calculate Top Selling Products
    const productSoldMap = {};
    for (const item of allItems) {
      const pId = item.product_id;
      if (!productSoldMap[pId]) {
        productSoldMap[pId] = {
          id: pId,
          name: item.product_name || "Product",
          price: Number(item.unit_price || 0),
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

    // 9. Calculate Customer Analytics (First Time vs Returning)
    const customerOrderCounts = {};
    const customerSpendMap = {};
    for (const s of allSales) {
      const cName = s.customer_name?.trim() || (s.customer_phone ? `Customer (${s.customer_phone})` : "Walk-in Customer");
      customerOrderCounts[cName] = (customerOrderCounts[cName] || 0) + 1;
      customerSpendMap[cName] = (customerSpendMap[cName] || 0) + Number(s.grand_total || 0);
    }

    const uniqueCustomers = Object.keys(customerOrderCounts);
    const firstTimeCount = uniqueCustomers.filter((c) => customerOrderCounts[c] === 1).length;
    const returningCount = uniqueCustomers.filter((c) => customerOrderCounts[c] > 1).length;
    const totalCustCount = uniqueCustomers.length || 1;

    // Top Customers ranking
    const topCustomers = uniqueCustomers
      .map((name) => {
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "CU";
        return {
          name,
          country: "Verified Customer",
          orders: customerOrderCounts[name],
          total_spend: customerSpendMap[name],
          spend: `Rs. ${customerSpendMap[name].toLocaleString()}`,
          avatar: initials,
        };
      })
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 5);

    // 10. Top Categories Calculation
    const categorySalesMap = {};
    for (const item of allItems) {
      const prod = allProducts.find((p) => p.id === item.product_id);
      const catName = (prod && categoryMap[prod.category_id]) || "Mobile Phones";
      categorySalesMap[catName] = (categorySalesMap[catName] || 0) + Number(item.quantity || 0);
    }
    const totalCategorySales = Object.values(categorySalesMap).reduce((a, b) => a + b, 0) || 1;
    const topCategories = Object.entries(categorySalesMap)
      .map(([name, sales]) => ({
        name,
        sales,
        percentage: Math.round((sales / totalCategorySales) * 100),
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4);

    // 11. Recent Sales List
    const recentSalesFormatted = allSales.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.customer_name || `Invoice #${s.invoice_number || s.id}`,
      category: s.payment_method ? s.payment_method.toUpperCase() : "CASH",
      price: Number(s.grand_total || 0),
      status: s.status === "completed" ? "Completed" : s.status === "cancelled" ? "Cancelled" : "Draft",
      statusColor:
        s.status === "completed"
          ? "bg-emerald-100 text-emerald-700"
          : s.status === "cancelled"
          ? "bg-red-100 text-red-700"
          : "bg-pink-100 text-pink-700",
      time: s.created_at
        ? new Date(s.created_at).toLocaleDateString("en-PK", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Today",
      icon: "sales",
    }));

    // 12. Recent Transactions (Sales + Purchases + Expenses)
    const recentTransactionsFormatted = allSales.slice(0, 5).map((s) => {
      const initials = (s.customer_name || "Walk-in")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return {
        id: s.id,
        invoice_number: s.invoice_number || `#${s.id}`,
        customer: s.customer_name || "Walk-in Customer",
        status: s.status === "completed" ? "Completed" : "Draft",
        statusColor:
          s.status === "completed"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-pink-100 text-pink-700",
        total: Number(s.grand_total || 0),
        avatar: initials || "WK",
        date: s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-PK", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Today",
      };
    });

    // 13. Order Statistics Heatmap Grid
    const heatmapGrid = Array(9)
      .fill(0)
      .map(() => Array(7).fill(0));

    for (const s of allSales) {
      if (s.created_at) {
        const d = new Date(s.created_at);
        const dayIdx = (d.getDay() + 6) % 7; // Monday=0 .. Sunday=6
        const hour = d.getHours();
        const rowIdx = Math.min(Math.floor(hour / 3), 8);
        heatmapGrid[rowIdx][dayIdx] = Math.min((heatmapGrid[rowIdx][dayIdx] || 0) + 1, 2);
      }
    }

    return {
      summary: {
        total_sales: totalSalesAll,
        total_sales_return: 0,
        total_purchase: totalPurchases,
        total_purchase_return: totalPurchaseReturns,
        today_sales: todaySales,
        today_orders: todayOrders,
        total_orders_count: totalOrdersCount,
        total_suppliers_count: totalSuppliersCount,
        total_customers_count: uniqueCustomers.length,
        total_categories_count: totalCategoriesCount,
        total_products_count: allProducts.length,
        today_items_sold: todayItemsSold,
        net_sales: todaySales - todayExpenses,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        total_sales_month: monthSalesTotal,
        today_profit: estimatedProfit,
        invoice_due: totalSupplierDue,
        total_expenses: totalExpenses,
        total_payment_returns: 0,
      },
      customers_overview: {
        first_time_count: firstTimeCount,
        first_time_pct: Math.round((firstTimeCount / totalCustCount) * 100),
        returning_count: returningCount,
        returning_pct: Math.round((returningCount / totalCustCount) * 100),
      },
      monthly_chart: monthlyData,
      best_selling_products: bestSellingProducts,
      low_stock_products: lowStockProductsList,
      recent_sales: recentSalesFormatted,
      recent_transactions: recentTransactionsFormatted,
      top_customers: topCustomers,
      top_categories: topCategories,
      heatmap_grid: heatmapGrid,
    };
  }

  const response = await apiClient.get("/dashboard");
  return response.data.data;
}
