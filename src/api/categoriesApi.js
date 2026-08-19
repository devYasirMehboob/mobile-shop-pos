import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getCategories(search = "") {
  if (isSupabaseConfigured()) {
    let query = supabase.from("categories").select("*").order("name", { ascending: true });
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  const response = await apiClient.get("/categories", {
    params: search ? { search } : {},
  });
  return response.data.data.categories;
}

export async function getCategory(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("categories").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  }

  const response = await apiClient.get("/categories/" + id);
  return response.data.data.category;
}

export async function createCategory(categoryData) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("categories").insert([categoryData]).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Category created successfully.", data };
  }

  const response = await apiClient.post("/categories", categoryData);
  return response.data;
}

export async function updateCategory(id, categoryData) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("categories").update(categoryData).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Category updated successfully.", data };
  }

  const response = await apiClient.put("/categories/" + id, categoryData);
  return response.data;
}

export async function updateCategoryStatus(id, status) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("categories").update({ status }).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Category status updated.", data };
  }

  const response = await apiClient.patch("/categories/" + id + "/status", { status });
  return response.data;
}

export async function deleteCategory(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true, message: "Category deleted.", data };
  }

  const response = await apiClient.delete("/categories/" + id);
  return response.data;
}
