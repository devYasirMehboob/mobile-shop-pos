import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getInventory(filters = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("products")
      .select("*, categories:category_id (name)")
      .eq("track_stock", 1)
      .order("name", { ascending: true });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.category_id) query = query.eq("category_id", filters.category_id);
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let items = (data || []).map((p) => ({
      ...p,
      category_name: p.categories?.name || "Uncategorized",
    }));

    if (filters.stock_status === "low") {
      items = items.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minimum_stock));
    } else if (filters.stock_status === "out") {
      items = items.filter((p) => Number(p.quantity) <= 0);
    }

    return {
      products: items,
      total: items.length,
      pagination: { page: 1, per_page: items.length, total: items.length, total_pages: 1 },
    };
  }

  const response = await apiClient.get("/inventory", { params: filters });
  return response.data.data;
}

export async function getInventorySummary() {
  if (isSupabaseConfigured()) {
    const { data: products, error } = await supabase.from("products").select("quantity, minimum_stock, purchase_cost, selling_price, track_stock");
    if (error) throw new Error(error.message);

    const tracked = (products || []).filter((p) => p.track_stock === 1);
    const totalItems = tracked.length;
    const lowStock = tracked.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minimum_stock)).length;
    const outOfStock = tracked.filter((p) => Number(p.quantity) <= 0).length;
    const totalStockValue = tracked.reduce((acc, p) => acc + Number(p.quantity || 0) * Number(p.purchase_cost || 0), 0);

    return {
      total_products: totalItems,
      low_stock_count: lowStock,
      out_of_stock_count: outOfStock,
      total_stock_value: totalStockValue,
    };
  }

  const response = await apiClient.get("/inventory/summary");
  return response.data.data.summary;
}

export async function getStockTransactions(filters = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("stock_transactions")
      .select("*, products:product_id (name, product_code), access_credentials:user_id (name)")
      .order("created_at", { ascending: false });

    if (filters.product_id) query = query.eq("product_id", filters.product_id);
    if (filters.transaction_type) query = query.eq("transaction_type", filters.transaction_type);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (data || []).map((t) => ({
      ...t,
      product_name: t.products?.name || "Product",
      product_code: t.products?.product_code || "",
      user_name: t.access_credentials?.name || "System",
    }));

    return {
      transactions: formatted,
      total: formatted.length,
      pagination: { page: 1, per_page: formatted.length, total: formatted.length, total_pages: 1 },
    };
  }

  const response = await apiClient.get("/inventory/transactions", { params: filters });
  return response.data.data;
}

export async function getProductStockTransactions(productId, filters = {}) {
  return getStockTransactions({ ...filters, product_id: productId });
}

export async function recordStockMovement(endpoint, data) {
  if (isSupabaseConfigured()) {
    const { product_id, quantity, reason, user_id } = data;
    const { data: prod } = await supabase.from("products").select("quantity").eq("id", product_id).single();
    
    const prev = Number(prod?.quantity || 0);
    const qtyChange = Number(quantity || 0);
    const isAddition = endpoint.includes("addition") || endpoint.includes("opening");
    const delta = isAddition ? qtyChange : -qtyChange;
    const next = prev + delta;

    await supabase.from("products").update({ quantity: next }).eq("id", product_id);
    await supabase.from("stock_transactions").insert([{
      product_id,
      user_id: user_id || 1,
      transaction_type: endpoint.replace(/-/g, "_"),
      quantity: delta,
      previous_stock: prev,
      new_stock: next,
      reason: reason || endpoint,
    }]);

    return { success: true, message: "Stock updated successfully." };
  }

  const response = await apiClient.post("/inventory/" + endpoint, data);
  return response.data;
}
