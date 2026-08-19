import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getPosProducts(params = {}, signal) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("products")
      .select("*, categories:category_id (name)")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (params.category_id) {
      query = query.eq("category_id", params.category_id);
    }
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,product_code.ilike.%${params.search}%,barcode.ilike.%${params.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (data || []).map((p) => ({
      ...p,
      category_name: p.categories?.name || "",
    }));

    return {
      products: formatted,
    };
  }

  const response = await apiClient.get("/pos/products", { params, signal });
  return response.data.data;
}

export async function getPosCategories() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  const response = await apiClient.get("/pos/categories");
  return response.data.data.categories;
}
