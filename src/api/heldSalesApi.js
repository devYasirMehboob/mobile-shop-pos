import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getHeldSales() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("held_sales")
      .select("*, held_sale_items (*)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  const response = await apiClient.get("/held-sales");
  return response.data.data.held_sales;
}

export async function getHeldSale(id) {
  if (isSupabaseConfigured()) {
    const { data: sale, error: saleErr } = await supabase.from("held_sales").select("*").eq("id", id).single();
    if (saleErr) throw new Error(saleErr.message);

    const { data: items } = await supabase.from("held_sale_items").select("*").eq("held_sale_id", id);
    return { ...sale, items: items || [] };
  }

  const response = await apiClient.get(`/held-sales/${id}`);
  return response.data.data;
}

export async function createHeldSale(payload) {
  if (isSupabaseConfigured()) {
    const ref = "HOLD-" + Date.now().toString().slice(-6);
    const { data: sale, error } = await supabase.from("held_sales").insert([{
      reference_number: ref,
      held_by: payload.held_by || 1,
      request_token: payload.request_token || Math.random().toString(36),
      customer_name: payload.customer_name || "",
      customer_phone: payload.customer_phone || "",
      discount_type: payload.discount_type || "none",
      discount_value: payload.discount_value || 0,
      payment_method: payload.payment_method || "cash",
      notes: payload.notes || "",
      status: "active",
    }]).select().single();

    if (error) throw new Error(error.message);

    if (payload.items?.length) {
      const itemsToInsert = payload.items.map((item) => ({
        held_sale_id: sale.id,
        product_id: item.product_id || item.id,
        product_name: item.name || item.product_name,
        product_code: item.product_code || item.code || "",
        unit_price_snapshot: item.selling_price || item.unit_price,
        quantity_base: item.quantity,
      }));
      await supabase.from("held_sale_items").insert(itemsToInsert);
    }

    return { success: true, message: "Cart held successfully.", data: sale };
  }

  const response = await apiClient.post("/held-sales", payload);
  return response.data;
}

export async function updateHeldSale(id, payload) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("held_sales").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Held sale updated.", data };
  }

  const response = await apiClient.put(`/held-sales/${id}`, payload);
  return response.data;
}

export async function deleteHeldSale(id) {
  if (isSupabaseConfigured()) {
    await supabase.from("held_sales").delete().eq("id", id);
    return { success: true, message: "Held sale deleted." };
  }

  const response = await apiClient.delete(`/held-sales/${id}`);
  return response.data;
}
