import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const data = (r) => r.data.data;

const BASE_SUPPLIER_COLUMNS = new Set([
  "id",
  "name",
  "contact_person",
  "phone",
  "alternate_phone",
  "email",
  "address",
  "opening_balance",
  "current_balance",
  "notes",
  "status",
  "created_at",
  "updated_at",
]);

let knownSupplierColumns = null;

async function getAvailableSupplierColumns() {
  if (knownSupplierColumns) return knownSupplierColumns;
  try {
    const { data: cols, error } = await supabase.from("suppliers").select("*").limit(1);
    if (!error && cols && cols.length > 0) {
      knownSupplierColumns = new Set(Object.keys(cols[0]));
      return knownSupplierColumns;
    }
  } catch (e) {
    console.warn("Supplier column detection warning:", e);
  }
  knownSupplierColumns = new Set(BASE_SUPPLIER_COLUMNS);
  return knownSupplierColumns;
}

function sanitizeSupplierForDb(raw) {
  const { id, created_at, updated_at, ...rest } = raw;
  return {
    ...rest,
    name: rest.name ? String(rest.name).trim() : "",
    contact_person: rest.contact_person ? String(rest.contact_person).trim() : null,
    email: rest.email ? String(rest.email).trim() : null,
    phone: rest.phone ? String(rest.phone).trim() : null,
    alternate_phone: rest.alternate_phone ? String(rest.alternate_phone).trim() : null,
    address: rest.address ? String(rest.address).trim() : null,
    notes: rest.notes ? String(rest.notes).trim() : null,
    opening_balance: parseFloat(rest.opening_balance) || 0,
    current_balance: parseFloat(rest.current_balance ?? rest.opening_balance) || 0,
    status: rest.status || "active",
  };
}

function pruneSupplierPayload(payload, validCols) {
  if (!validCols || validCols.size === 0) return { ...payload };
  const pruned = {};
  for (const key of Object.keys(payload)) {
    if (validCols.has(key)) {
      pruned[key] = payload[key];
    }
  }
  return pruned;
}

export async function getSuppliers(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase.from("suppliers").select("*", { count: "exact" }).order("name", { ascending: true });
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
    }
    if (params.status) {
      query = query.eq("status", params.status);
    }

    const { data: list, count, error } = await query;
    if (error) throw new Error(error.message);

    const total = count ?? (list || []).length;
    return {
      suppliers: list || [],
      total,
      pagination: {
        page: params.page || 1,
        per_page: params.limit || 10,
        total,
        total_pages: Math.ceil(total / (params.limit || 10)) || 1,
      },
    };
  }

  return data(await apiClient.get("/suppliers", { params }));
}

export async function getSupplierOptions() {
  if (isSupabaseConfigured()) {
    const { data: list, error } = await supabase
      .from("suppliers")
      .select("id, name, phone, current_balance, status")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return list || [];
  }

  return data(await apiClient.get("/suppliers/options")).suppliers;
}

export async function getSupplier(id) {
  if (isSupabaseConfigured()) {
    const { data: sup, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error) throw new Error(error.message);
    return { supplier: sup };
  }

  return data(await apiClient.get(`/suppliers/${id}`));
}

export async function createSupplier(values) {
  if (isSupabaseConfigured()) {
    const validCols = await getAvailableSupplierColumns();
    let current = pruneSupplierPayload(sanitizeSupplierForDb(values), validCols);

    for (let attempt = 0; attempt < 15; attempt++) {
      const { data: sup, error } = await supabase
        .from("suppliers")
        .insert([current])
        .select()
        .single();

      if (!error) return { success: true, message: "Supplier created successfully.", data: sup };

      const match = error.message?.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        delete current[match[1]];
        if (knownSupplierColumns) knownSupplierColumns.delete(match[1]);
        continue;
      }

      throw new Error(error.message);
    }
  }

  return (await apiClient.post("/suppliers", values)).data;
}

export async function updateSupplier(id, values) {
  if (isSupabaseConfigured()) {
    const validCols = await getAvailableSupplierColumns();
    let current = pruneSupplierPayload(sanitizeSupplierForDb(values), validCols);

    for (let attempt = 0; attempt < 15; attempt++) {
      const { data: sup, error } = await supabase
        .from("suppliers")
        .update(current)
        .eq("id", Number(id))
        .select()
        .single();

      if (!error) return { success: true, message: "Supplier updated successfully.", data: sup };

      const match = error.message?.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        delete current[match[1]];
        if (knownSupplierColumns) knownSupplierColumns.delete(match[1]);
        continue;
      }

      throw new Error(error.message);
    }
  }

  return (await apiClient.put(`/suppliers/${id}`, values)).data;
}

export async function changeSupplierStatus(id, status) {
  if (isSupabaseConfigured()) {
    const { data: sup, error } = await supabase
      .from("suppliers")
      .update({ status })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: `Supplier status changed to ${status}.`, data: sup };
  }

  return (await apiClient.patch(`/suppliers/${id}/status`, { status })).data;
}

export async function deleteSupplier(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", Number(id));

    if (error) throw new Error(error.message);
    return { success: true, message: "Supplier deleted successfully." };
  }

  return (await apiClient.delete(`/suppliers/${id}`)).data;
}

export async function getSupplierStatement(id, params = {}) {
  if (isSupabaseConfigured()) {
    const { data: sup } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", Number(id))
      .single();

    const { data: purchases } = await supabase
      .from("purchases")
      .select("*")
      .eq("supplier_id", Number(id))
      .order("created_at", { ascending: false });

    const { data: payments } = await supabase
      .from("purchase_payments")
      .select("*")
      .eq("supplier_id", Number(id))
      .order("payment_date", { ascending: false });

    return {
      supplier: sup,
      purchases: purchases || [],
      payments: payments || [],
      statement: [],
    };
  }

  return data(await apiClient.get(`/suppliers/${id}/statement`, { params }));
}
