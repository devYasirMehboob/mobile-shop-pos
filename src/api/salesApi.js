import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function completeSale(payload) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc("complete_sale_rpc", { payload });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.message || "Failed to complete sale.");
    return data;
  }

  const response = await apiClient.post("/sales", payload);
  return response.data;
}

export async function getSales(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("sales")
      .select("*, access_credentials:cashier_id (name)")
      .order("created_at", { ascending: false });

    if (params.status) query = query.eq("status", params.status);
    if (params.payment_method) query = query.eq("payment_method", params.payment_method);
    if (params.date_from) query = query.gte("created_at", `${params.date_from}T00:00:00`);
    if (params.date_to) query = query.lte("created_at", `${params.date_to}T23:59:59`);
    if (params.search) {
      query = query.or(`invoice_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,customer_phone.ilike.%${params.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (data || []).map((s) => ({
      ...s,
      cashier_name: s.access_credentials?.name || "Cashier",
    }));

    return {
      sales: formatted,
      total: formatted.length,
      pagination: {
        page: 1,
        per_page: formatted.length,
        total: formatted.length,
        total_pages: 1,
      },
    };
  }

  const response = await apiClient.get("/sales", { params });
  return response.data.data;
}

export async function getSalesSummary(params = {}) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("sales").select("grand_total, status, payment_method");
    if (error) throw new Error(error.message);

    const completed = (data || []).filter((s) => s.status === "completed");
    const totalSales = completed.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
    const count = completed.length;

    return {
      total_sales: totalSales,
      total_orders: count,
      average_order_value: count ? totalSales / count : 0,
    };
  }

  const response = await apiClient.get("/sales/summary", { params });
  return response.data.data;
}

export async function getSale(id) {
  if (isSupabaseConfigured()) {
    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .select("*, access_credentials:cashier_id (name)")
      .eq("id", id)
      .single();
    if (saleErr) throw new Error(saleErr.message);

    const { data: items, error: itemsErr } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", id);
    if (itemsErr) throw new Error(itemsErr.message);

    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("sale_id", id);

    return {
      ...sale,
      cashier_name: sale.access_credentials?.name || "Cashier",
      items: items || [],
      payments: payments || [],
    };
  }

  const response = await apiClient.get(`/sales/${id}`);
  return response.data.data;
}

export async function getSaleReceipt(id) {
  if (isSupabaseConfigured()) {
    const saleData = await getSale(id);
    const { data: shopSettings } = await supabase.from("settings").select("*");

    const settingsMap = {};
    (shopSettings || []).forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    return {
      sale: saleData,
      shop: {
        shop_name: settingsMap.shop_name || "Mobile Shop POS",
        address: settingsMap.address || "",
        phone: settingsMap.phone || "",
        receipt_footer: settingsMap.receipt_footer || "Thank you for visiting Mobile Shop POS!",
        return_policy: settingsMap.return_policy || "",
      },
    };
  }

  const response = await apiClient.get(`/sales/${id}/receipt`);
  return response.data.data;
}

export async function cancelSale(id, reason) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("sales")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Sale cancelled successfully.", data };
  }

  const response = await apiClient.post(`/sales/${id}/cancel`, { reason });
  return response.data;
}

export async function refundSale(id, payload) {
  if (isSupabaseConfigured()) {
    const { error: refundErr } = await supabase.from("refunds").insert([
      {
        sale_id: id,
        processed_by: payload.processed_by || 1,
        refund_amount: payload.amount,
        refund_method: payload.payment_method || "cash",
        reason: payload.reason || "Customer refund",
        status: "completed",
      },
    ]);
    if (refundErr) throw new Error(refundErr.message);

    await supabase
      .from("sales")
      .update({ status: "refunded", refunded_at: new Date().toISOString() })
      .eq("id", id);

    return { success: true, message: "Sale refunded successfully." };
  }

  const response = await apiClient.post(`/sales/${id}/refund`, payload);
  return response.data;
}

export async function exportSales(params = {}) {
  return apiClient.get("/sales/export", { params, responseType: "blob" });
}
