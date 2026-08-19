import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getDashboard() {
  if (isSupabaseConfigured()) {
    const today = new Date().toISOString().split("T")[0];

    // Today sales
    const { data: sales } = await supabase
      .from("sales")
      .select("grand_total, status, created_at")
      .eq("status", "completed");

    const todaySalesList = (sales || []).filter((s) => s.created_at?.startsWith(today));
    const todaySales = todaySalesList.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
    const todayOrders = todaySalesList.length;

    // Total products & low stock
    const { data: products } = await supabase
      .from("products")
      .select("id, name, quantity, minimum_stock, track_stock, selling_price");

    const lowStock = (products || []).filter(
      (p) => p.track_stock === 1 && Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minimum_stock)
    );

    // Recent sales
    const { data: recentSales } = await supabase
      .from("sales")
      .select("id, invoice_number, grand_total, payment_method, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Expenses
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount, status, expense_date")
      .eq("status", "active");

    const todayExpenses = (expenses || [])
      .filter((e) => e.expense_date === today)
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    return {
      today_sales: todaySales,
      today_orders: todayOrders,
      today_expenses: todayExpenses,
      net_sales: todaySales - todayExpenses,
      low_stock_products: lowStock.slice(0, 5),
      recent_sales: recentSales || [],
      total_products: (products || []).length,
    };
  }

  const response = await apiClient.get("/dashboard");
  return response.data.data;
}
