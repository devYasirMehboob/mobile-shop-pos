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
    product_type_select,
    created_at,
    updated_at,
    id,
    ...rest
  } = raw;

  if (image_data) {
    rest.image = image_data;
  } else if (remove_image) {
    rest.image = null;
  }

  return {
    ...rest,
    category_id: Number(rest.category_id),
    name: rest.name ? String(rest.name).trim() : "",
    product_code: rest.product_code ? String(rest.product_code).trim() : `PRD-${Date.now()}`,
    barcode: rest.barcode ? String(rest.barcode).trim() : null,
    brand: rest.brand ? String(rest.brand).trim() : null,
    description: rest.description ? String(rest.description).trim() : null,
    purchase_cost: parseFloat(rest.purchase_cost) || 0,
    selling_price: parseFloat(rest.selling_price) || 0,
    quantity: parseFloat(rest.quantity) || 0,
    minimum_stock: parseFloat(rest.minimum_stock) || 0,
    tax: parseFloat(rest.tax) || 0,
    discount_type: rest.discount_type || "fixed",
    discount_value: parseFloat(rest.discount_value) || 0,
    warranty: rest.warranty || null,
    manufacturer: rest.manufacturer ? String(rest.manufacturer).trim() : null,
    manufactured_date: rest.manufactured_date || null,
    expiry_date: rest.expiry_date || null,
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
    status: rest.status || "active",
  };
}

async function uploadProductImageBase64(base64Str) {
  if (!base64Str || typeof base64Str !== "string") return null;
  if (base64Str.startsWith("http://") || base64Str.startsWith("https://")) return base64Str;
  if (!base64Str.startsWith("data:")) return null;

  try {
    const [header, content] = base64Str.split(",");
    const mimeMatch = header?.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const ext = mime.split("/")[1] || "jpg";
    const byteCharacters = atob(content);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    const blob = new Blob(byteArrays, { type: mime });
    const fileName = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product_images")
      .upload(fileName, blob, { contentType: mime, upsert: true });

    if (uploadError) {
      console.warn("Storage upload error (fallback):", uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("product_images")
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (e) {
    console.warn("Image conversion failed:", e);
    return null;
  }
}

let knownValidColumns = null;

async function getAvailableProductColumns() {
  if (knownValidColumns) return knownValidColumns;
  try {
    const { data, error } = await supabase.from("products").select("*").limit(1);
    if (!error && data && data.length > 0) {
      knownValidColumns = new Set(Object.keys(data[0]));
      return knownValidColumns;
    }
  } catch (e) {
    console.warn("Column detection warning:", e);
  }
  return null;
}

function pruneToExistingColumns(payload, validColumns) {
  if (!validColumns || validColumns.size === 0) return { ...payload };
  const pruned = {};
  for (const key of Object.keys(payload)) {
    if (validColumns.has(key)) {
      pruned[key] = payload[key];
    }
  }
  return pruned;
}

async function executeSupabaseInsert(payload) {
  const validCols = await getAvailableProductColumns();
  let current = pruneToExistingColumns(payload, validCols);

  for (let attempt = 0; attempt < 35; attempt++) {
    const { data, error } = await supabase
      .from("products")
      .insert([current])
      .select("id, name, product_code, selling_price")
      .single();

    if (!error) return data;

    // Check if error is due to a missing column in remote Supabase table
    const match = error.message?.match(/Could not find the '([^']+)' column/i);
    if (match && match[1]) {
      const col = match[1];
      delete current[col];
      if (knownValidColumns) knownValidColumns.delete(col);
      continue;
    }

    // Check if value too long (VARCHAR 255 constraint)
    if (error.code === "22001" || error.message?.includes("too long")) {
      if (current.image && current.image.length > 255) {
        delete current.image;
      }
      for (const key of Object.keys(current)) {
        if (typeof current[key] === "string" && current[key].length > 255) {
          current[key] = current[key].substring(0, 250);
        }
      }
      continue;
    }

    throw new Error(error.message);
  }
}

async function executeSupabaseUpdate(id, payload) {
  const validCols = await getAvailableProductColumns();
  let current = pruneToExistingColumns(payload, validCols);

  for (let attempt = 0; attempt < 35; attempt++) {
    const { data, error } = await supabase
      .from("products")
      .update(current)
      .eq("id", Number(id))
      .select("id, name, product_code, selling_price")
      .single();

    if (!error) return data;

    const match = error.message?.match(/Could not find the '([^']+)' column/i);
    if (match && match[1]) {
      const col = match[1];
      delete current[col];
      if (knownValidColumns) knownValidColumns.delete(col);
      continue;
    }

    // Check if value too long (VARCHAR 255 constraint)
    if (error.code === "22001" || error.message?.includes("too long")) {
      if (current.image && current.image.length > 255) {
        delete current.image;
      }
      for (const key of Object.keys(current)) {
        if (typeof current[key] === "string" && current[key].length > 255) {
          current[key] = current[key].substring(0, 250);
        }
      }
      continue;
    }

    throw new Error(error.message);
  }
}

export async function createProduct(productData) {
  if (isSupabaseConfigured()) {
    let payload = sanitizeProductForDb(productData);
    if (productData.image_data && productData.image_data.startsWith("data:")) {
      const uploadedUrl = await uploadProductImageBase64(productData.image_data);
      if (uploadedUrl) payload.image = uploadedUrl;
      else delete payload.image;
    }
    const data = await executeSupabaseInsert(payload);
    return { success: true, message: "Product created successfully.", data };
  }

  const response = await apiClient.post("/products", productData);
  return response.data;
}

export async function updateProduct(id, productData) {
  if (isSupabaseConfigured()) {
    let payload = sanitizeProductForDb(productData);
    if (productData.image_data && productData.image_data.startsWith("data:")) {
      const uploadedUrl = await uploadProductImageBase64(productData.image_data);
      if (uploadedUrl) payload.image = uploadedUrl;
      else delete payload.image;
    }
    const data = await executeSupabaseUpdate(id, payload);
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
