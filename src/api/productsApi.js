import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getProducts(filters = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("products")
      .select("*, categories:category_id (name)")
      .order("created_at", { ascending: false });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (data || []).map((p) => ({
      ...p,
      category_name: p.categories?.name || "",
    }));

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const total = (data || []).length;
    const total_pages = Math.ceil(total / limit) || 1;

    return {
      products: formatted,
      total,
      pagination: {
        page,
        limit,
        total,
        total_pages,
      },
    };
  }

  const response = await apiClient.get("/products", { params: filters });
  return response.data.data;
}

export async function getProduct(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories:category_id (name)")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return { ...data, category_name: data.categories?.name || "" };
  }

  const response = await apiClient.get("/products/" + id);
  return response.data.data.product;
}

function sanitizeProductForDb(raw) {
  const {
    image_data,
    remove_image,
    categories,
    category_name,
    ...rest
  } = raw;

  return {
    ...rest,
    category_id: Number(rest.category_id),
    purchase_cost: parseFloat(rest.purchase_cost) || 0,
    selling_price: parseFloat(rest.selling_price) || 0,
    quantity: parseFloat(rest.quantity) || 0,
    minimum_stock: parseFloat(rest.minimum_stock) || 0,
    base_unit_id: rest.base_unit_id ? Number(rest.base_unit_id) : null,
    default_purchase_unit_id: rest.default_purchase_unit_id ? Number(rest.default_purchase_unit_id) : null,
    default_sale_unit_id: rest.default_sale_unit_id ? Number(rest.default_sale_unit_id) : null,
    stock_source_id: rest.stock_source_id ? Number(rest.stock_source_id) : null,
    consumption_quantity: rest.consumption_quantity ? parseFloat(rest.consumption_quantity) : null,
    consumption_unit_id: rest.consumption_unit_id ? Number(rest.consumption_unit_id) : null,
    consumption_quantity_base: rest.consumption_quantity_base ? parseFloat(rest.consumption_quantity_base) : null,
    allow_custom_sale: rest.allow_custom_sale ? 1 : 0,
    track_stock: rest.track_stock === false || rest.track_stock === 0 ? 0 : 1,
    track_batches: rest.track_batches ? 1 : 0,
    track_expiry: rest.track_expiry ? 1 : 0,
    barcode: rest.barcode?.trim() || null,
  };
}

export async function createProduct(productData) {
  if (isSupabaseConfigured()) {
    const payload = sanitizeProductForDb(productData);
    const { data, error } = await supabase
      .from("products")
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Product created successfully.", data };
  }

  const response = await apiClient.post("/products", productData);
  return response.data;
}

export async function updateProduct(id, productData) {
  if (isSupabaseConfigured()) {
    const payload = sanitizeProductForDb(productData);
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Product updated successfully.", data };
  }

  const response = await apiClient.put("/products/" + id, productData);
  return response.data;
}

export async function updateProductStatus(id, status) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("products")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Product status updated.", data };
  }

  const response = await apiClient.patch(`/products/${id}/status`, { status });
  return response.data;
}

export async function generateProductBarcode(id) {
  if (isSupabaseConfigured()) {
    const autoBarcode = "890" + Date.now().toString().slice(-9);
    const { data, error } = await supabase
      .from("products")
      .update({ barcode: autoBarcode, barcode_type: "CODE128" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, barcode: autoBarcode, data };
  }

  const response = await apiClient.post(`/products/${id}/barcode/generate`);
  return response.data;
}

export async function deleteProduct(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    return { success: true, message: "Product deleted.", data };
  }

  const response = await apiClient.delete("/products/" + id);
  return response.data;
}

export function productImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  if (isSupabaseConfigured()) {
    const { data } = supabase.storage.from("product_images").getPublicUrl(path);
    return data?.publicUrl || path;
  }

  let baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  return baseUrl + "/" + path.replace(/^\/+/, "");
}
