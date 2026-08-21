import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getInventory(filters = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("products")
      .select("*, categories:category_id (name)", { count: "exact" })
      .eq("track_stock", 1)
      .order("name", { ascending: true });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.category_id) query = query.eq("category_id", Number(filters.category_id));
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
    }

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    let items = (data || []).map((p) => ({
      ...p,
      category_name: p.categories?.name || "Uncategorized",
    }));

    if (filters.stock_status === "low_stock" || filters.stock_status === "low") {
      items = items.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minimum_stock || 5));
    } else if (filters.stock_status === "out_of_stock" || filters.stock_status === "out") {
      items = items.filter((p) => Number(p.quantity) <= 0);
    }

    const total = items.length;
    return {
      products: items,
      total,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total,
        total_pages: Math.ceil(total / (filters.limit || 10)) || 1,
      },
    };
  }

  const response = await apiClient.get("/inventory", { params: filters });
  return response.data.data;
}

export async function getInventorySummary() {
  if (isSupabaseConfigured()) {
    const { data: products, error } = await supabase
      .from("products")
      .select("quantity, minimum_stock, purchase_cost, selling_price, track_stock");

    if (error) throw new Error(error.message);

    const tracked = (products || []).filter((p) => p.track_stock === 1 || p.track_stock === true);
    const totalItems = tracked.length;
    const lowStock = tracked.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minimum_stock || 5)).length;
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
      .select("*, products:product_id (name, product_code, barcode, category_id, categories:category_id (name))", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.product_id) query = query.eq("product_id", Number(filters.product_id));
    if (filters.transaction_type) query = query.eq("transaction_type", filters.transaction_type);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    let formatted = (data || []).map((t) => ({
      ...t,
      product_name: t.products?.name || "Product",
      product_code: t.products?.product_code || `PRD-${t.product_id}`,
      barcode: t.products?.barcode || "—",
      category_name: t.products?.categories?.name || "General",
      person: t.user_name || "Admin",
      warehouse: t.warehouse || "Main Shop Warehouse",
      store: t.store || "Main Store",
      date: t.created_at,
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      formatted = formatted.filter(
        (t) =>
          t.product_name?.toLowerCase().includes(q) ||
          t.product_code?.toLowerCase().includes(q) ||
          t.reason?.toLowerCase().includes(q)
      );
    }

    const total = count ?? formatted.length;
    return {
      transactions: formatted,
      total,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total,
        total_pages: Math.ceil(total / (filters.limit || 10)) || 1,
      },
    };
  }

  const response = await apiClient.get("/inventory/transactions", { params: filters });
  return response.data.data;
}

export async function getProductStockTransactions(productId, filters = {}) {
  return getStockTransactions({ ...filters, product_id: productId });
}

export async function recordStockMovement(endpointOrData, maybeData) {
  let endpoint = typeof endpointOrData === "string" ? endpointOrData : (endpointOrData.action || "adjustment");
  let payloadData = typeof endpointOrData === "object" ? endpointOrData : maybeData;

  if (isSupabaseConfigured()) {
    const { product_id, quantity, reason, user_id, action } = payloadData;
    const { data: prod, error: prodErr } = await supabase
      .from("products")
      .select("id, name, quantity, product_code")
      .eq("id", Number(product_id))
      .single();

    if (prodErr) throw new Error(prodErr.message);

    const prev = Number(prod?.quantity || 0);
    const qtyChange = Math.abs(Number(quantity || 0));
    const act = (action || endpoint).toLowerCase();
    const isAddition = act.includes("add") || act.includes("open") || act === "inward";
    const delta = isAddition ? qtyChange : -qtyChange;
    const next = Math.max(0, prev + delta);

    await supabase
      .from("products")
      .update({ quantity: next })
      .eq("id", Number(product_id));

    const transPayload = {
      product_id: Number(product_id),
      user_id: user_id || 1,
      transaction_type: isAddition
        ? "addition"
        : act.includes("damag")
        ? "damaged"
        : act.includes("expir")
        ? "expired"
        : "manual_reduction",
      quantity: delta,
      previous_stock: prev,
      new_stock: next,
      reason: reason || "Stock adjustment audit",
    };

    const { error: transErr } = await supabase.from("stock_transactions").insert([transPayload]);
    if (transErr) console.warn("Stock transaction insert notice:", transErr.message);

    return {
      success: true,
      message: `Stock updated successfully (${prev} → ${next} units).`,
      previous_stock: prev,
      new_stock: next,
    };
  }

  const response = await apiClient.post("/inventory/" + endpoint, payloadData);
  return response.data;
}
