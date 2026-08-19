import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const data = (r) => r.data.data;

export async function getSuppliers(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase.from("suppliers").select("*").order("name", { ascending: true });
    if (params.search) query = query.ilike("name", `%${params.search}%`);
    if (params.status) query = query.eq("status", params.status);

    const { data: list, error } = await query;
    if (error) throw new Error(error.message);

    return {
      suppliers: list || [],
      total: (list || []).length,
      pagination: { page: 1, per_page: (list || []).length, total: (list || []).length, total_pages: 1 },
    };
  }

  return data(await apiClient.get("/suppliers", { params }));
}

export async function getSupplierOptions() {
  if (isSupabaseConfigured()) {
    const { data: list, error } = await supabase.from("suppliers").select("id, name, phone, current_balance").eq("status", "active");
    if (error) throw new Error(error.message);
    return list || [];
  }

  return data(await apiClient.get("/suppliers/options")).suppliers;
}

export async function getSupplier(id) {
  if (isSupabaseConfigured()) {
    const { data: sup, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return { supplier: sup };
  }

  return data(await apiClient.get(`/suppliers/${id}`));
}

export async function createSupplier(values) {
  if (isSupabaseConfigured()) {
    const { data: sup, error } = await supabase.from("suppliers").insert([values]).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Supplier created.", data: sup };
  }

  return (await apiClient.post("/suppliers", values)).data;
}

export async function updateSupplier(id, values) {
  if (isSupabaseConfigured()) {
    const { data: sup, error } = await supabase.from("suppliers").update(values).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Supplier updated.", data: sup };
  }

  return (await apiClient.put(`/suppliers/${id}`, values)).data;
}

export async function changeSupplierStatus(id, status) {
  if (isSupabaseConfigured()) {
    const { data: sup, error } = await supabase.from("suppliers").update({ status }).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Supplier status updated.", data: sup };
  }

  return (await apiClient.patch(`/suppliers/${id}/status`, { status })).data;
}

export async function deleteSupplier(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true, message: "Supplier deleted." };
  }

  return (await apiClient.delete(`/suppliers/${id}`)).data;
}

export async function getSupplierStatement(id, params = {}) {
  if (isSupabaseConfigured()) {
    const { data: sup } = await supabase.from("suppliers").select("*").eq("id", id).single();
    const { data: purchases } = await supabase.from("purchases").select("*").eq("supplier_id", id);
    const { data: payments } = await supabase.from("purchase_payments").select("*").eq("supplier_id", id);

    return {
      supplier: sup,
      purchases: purchases || [],
      payments: payments || [],
      statement: [],
    };
  }

  return data(await apiClient.get(`/suppliers/${id}/statement`, { params }));
}
