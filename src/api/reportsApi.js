import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const endpoints = {
  overview: "/reports/overview",
  sales: "/reports/sales",
  daily_sales: "/reports/sales/daily",
  weekly_sales: "/reports/sales/weekly",
  monthly_sales: "/reports/sales/monthly",
  products: "/reports/products",
  categories: "/reports/categories",
  cashiers: "/reports/cashiers",
  payment_methods: "/reports/payment-methods",
  expenses: "/reports/expenses",
  profit: "/reports/profit",
  stock: "/reports/stock",
  packaging_stock: "/reports/packaging-stock",
  low_stock: "/reports/stock/low",
  out_of_stock: "/reports/stock/out",
  wastage: "/reports/wastage",
  best_selling_products: "/reports/best-selling-products",
  purchase_summary: "/reports/purchases",
  supplier_purchases: "/reports/purchases/suppliers",
  product_purchases: "/reports/purchases/products",
  monthly_purchases: "/reports/purchases/monthly",
  supplier_balances: "/reports/purchases/outstanding",
  purchase_payments: "/reports/purchases/payments",
  purchase_returns: "/reports/purchases/returns",
};

export async function getReport(type, params = {}, signal) {
  if (isSupabaseConfigured()) {
    if (type === "overview" || type === "sales") {
      const { data: sales } = await supabase.from("sales").select("*").eq("status", "completed");
      const { data: expenses } = await supabase.from("expenses").select("*").eq("status", "active");

      const totalSales = (sales || []).reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
      const totalExpenses = (expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);

      return {
        summary: {
          total_sales: totalSales,
          total_orders: (sales || []).length,
          total_expenses: totalExpenses,
          net_profit: totalSales - totalExpenses,
        },
        rows: sales || [],
      };
    }

    if (type === "stock" || type === "low_stock" || type === "out_of_stock") {
      const { data: prods } = await supabase.from("products").select("*, categories:category_id (name)").eq("track_stock", 1);
      let items = (prods || []).map((p) => ({
        ...p,
        category_name: p.categories?.name || "General",
      }));

      if (type === "low_stock") {
        items = items.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minimum_stock));
      } else if (type === "out_of_stock") {
        items = items.filter((p) => Number(p.quantity) <= 0);
      }

      return {
        products: items,
        summary: {
          total_items: items.length,
          total_valuation: items.reduce((acc, p) => acc + Number(p.quantity || 0) * Number(p.purchase_cost || 0), 0),
        },
      };
    }
  }

  const response = await apiClient.get(endpoints[type] || `/reports/${type}`, { params, signal });
  return response.data.data;
}

export async function getReportOptions() {
  if (isSupabaseConfigured()) {
    const { data: categories } = await supabase.from("categories").select("id, name");
    const { data: cashiers } = await supabase.from("access_credentials").select("id, name");
    return { categories: categories || [], cashiers: cashiers || [] };
  }

  const response = await apiClient.get("/reports/options");
  return response.data.data;
}

export async function exportReport(type, params = {}) {
  return apiClient.get("/reports/export", { params: { ...params, report_type: type }, responseType: "blob" });
}
