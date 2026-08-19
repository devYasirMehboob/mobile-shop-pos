import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

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
    const { data: newUnit, error } = await supabase.from("units").insert([data]).select().single();
    if (error) throw new Error(error.message);
    return newUnit;
  }

  const response = await apiClient.post("/units", data);
  return response.data.data;
}

export async function updateUnit(id, data) {
  if (isSupabaseConfigured()) {
    const { data: updated, error } = await supabase.from("units").update(data).eq("id", id).select().single();
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
