import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

function sanitizeUnitForDb(raw) {
  return {
    name: raw.name?.trim(),
    symbol: raw.symbol?.trim(),
    unit_type: raw.unit_type || "count",
    precision: parseInt(raw.precision, 10) || 0,
    status: raw.status || "active",
  };
}

export async function getUnits(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase.from("units").select("*").order("name", { ascending: true });
    if (params.status) query = query.eq("status", params.status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { units: data || [], total: (data || []).length };
  }

  const response = await apiClient.get("/units", { params });
  return response.data.data;
}

export async function getUnit(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("units").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  }

  const response = await apiClient.get(`/units/${id}`);
  return response.data.data;
}

export async function createUnit(data) {
  if (isSupabaseConfigured()) {
    const payload = sanitizeUnitForDb(data);
    const { data: newUnit, error } = await supabase.from("units").insert([payload]).select().single();
    if (error) throw new Error(error.message);
    return newUnit;
  }

  const response = await apiClient.post("/units", data);
  return response.data.data;
}

export async function updateUnit(id, data) {
  if (isSupabaseConfigured()) {
    const payload = sanitizeUnitForDb(data);
    const { data: updated, error } = await supabase.from("units").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return updated;
  }

  const response = await apiClient.put(`/units/${id}`, data);
  return response.data.data;
}

export async function deleteUnit(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("units").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  const response = await apiClient.delete(`/units/${id}`);
  return response.data.data;
}
