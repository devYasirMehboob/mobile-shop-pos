import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getBatches(filters = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("product_batches")
      .select("*, products:product_id (id, name, product_code, barcode, image, selling_price)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.product_id) {
      query = query.eq("product_id", Number(filters.product_id));
    }
    if (filters.search) {
      query = query.or(
        `batch_number.ilike.%${filters.search}%`
      );
    }

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    let formatted = (data || []).map((b) => {
      const remaining = Number(b.remaining_quantity || 0);
      const received = Number(b.received_quantity || remaining);
      const unitCost = Number(b.unit_cost || 0);
      return {
        ...b,
        product_name: b.products?.name || "Product",
        product_code: b.products?.product_code || "",
        barcode: b.products?.barcode || "",
        product_image: b.products?.image || null,
        selling_price: b.products?.selling_price || 0,
        received_quantity: received,
        remaining_quantity: remaining,
        unit_cost: unitCost,
        total_value: remaining * unitCost,
        status: b.status || (remaining > 0 ? "active" : "depleted"),
        received_date: b.received_at || b.created_at,
      };
    });

    if (filters.search) {
      const q = filters.search.toLowerCase();
      formatted = formatted.filter(
        (b) =>
          b.batch_number?.toLowerCase().includes(q) ||
          b.product_name?.toLowerCase().includes(q) ||
          b.product_code?.toLowerCase().includes(q) ||
          b.barcode?.toLowerCase().includes(q)
      );
    }

    const total = count ?? formatted.length;
    return {
      batches: formatted,
      total,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total,
        total_pages: Math.ceil(total / (filters.limit || 10)) || 1,
      },
    };
  }

  const response = await apiClient.get("/batches", { params: filters });
  return response.data.data;
}

export async function createBatch(values) {
  if (isSupabaseConfigured()) {
    const { product_id, batch_number, received_quantity, unit_cost, received_at, notes, user_id } = values;
    const qty = Math.abs(parseFloat(received_quantity) || 0);
    const cost = parseFloat(unit_cost) || 0;

    const { data: prod, error: prodErr } = await supabase
      .from("products")
      .select("id, name, quantity")
      .eq("id", Number(product_id))
      .single();

    if (prodErr) throw new Error("Selected product not found: " + prodErr.message);

    const prevQty = Number(prod?.quantity || 0);
    const newQty = prevQty + qty;

    // 1. Insert into product_batches
    const { data: batch, error: batchErr } = await supabase
      .from("product_batches")
      .insert([
        {
          product_id: Number(product_id),
          batch_number: batch_number?.trim() || `BATCH-${Date.now().toString().slice(-6)}`,
          received_quantity: qty,
          remaining_quantity: qty,
          reserved_quantity: 0,
          unit_cost: cost,
          status: "active",
          received_at: received_at || new Date().toISOString(),
          created_by: user_id || 1,
        },
      ])
      .select()
      .single();

    if (batchErr) throw new Error(batchErr.message);

    // 2. Update product stock
    await supabase.from("products").update({ quantity: newQty }).eq("id", Number(product_id));

    // 3. Log stock movement
    await supabase.from("stock_transactions").insert([
      {
        product_id: Number(product_id),
        batch_id: batch.id,
        user_id: user_id || 1,
        transaction_type: "batch_inward",
        quantity: qty,
        previous_stock: prevQty,
        new_stock: newQty,
        reason: notes || `Incoming Batch: ${batch.batch_number}`,
      },
    ]);

    return {
      success: true,
      message: `Batch "${batch.batch_number}" received successfully. Stock updated to ${newQty} units.`,
      batch,
    };
  }

  const response = await apiClient.post("/batches", values);
  return response.data;
}

export async function toggleBatchStatus(id, newStatus) {
  if (isSupabaseConfigured()) {
    const { data: batch, error } = await supabase
      .from("product_batches")
      .update({ status: newStatus })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: `Batch status changed to ${newStatus}.`, batch };
  }

  const endpoint = newStatus === "blocked" ? `/batches/${id}/block` : `/batches/${id}/unblock`;
  const response = await apiClient.patch(endpoint);
  return response.data;
}

export async function disposeBatchStock(id, { quantity, reason, user_id }) {
  const qtyToDispose = Math.abs(parseFloat(quantity) || 0);

  if (isSupabaseConfigured()) {
    const { data: batch, error: bErr } = await supabase
      .from("product_batches")
      .select("*, products:product_id (id, name, quantity)")
      .eq("id", Number(id))
      .single();

    if (bErr) throw new Error(bErr.message);

    const currentBatchRemaining = Number(batch.remaining_quantity || 0);
    if (qtyToDispose > currentBatchRemaining) {
      throw new Error(`Cannot deduct ${qtyToDispose} units; batch only has ${currentBatchRemaining} units remaining.`);
    }

    const nextBatchRemaining = currentBatchRemaining - qtyToDispose;
    const batchStatus = nextBatchRemaining <= 0 ? "depleted" : batch.status;

    // Update batch remaining quantity
    await supabase
      .from("product_batches")
      .update({
        remaining_quantity: nextBatchRemaining,
        status: batchStatus,
      })
      .eq("id", Number(id));

    // Update product overall quantity
    const prodPrevStock = Number(batch.products?.quantity || 0);
    const prodNextStock = Math.max(0, prodPrevStock - qtyToDispose);

    await supabase
      .from("products")
      .update({ quantity: prodNextStock })
      .eq("id", Number(batch.product_id));

    // Insert stock transaction audit
    await supabase.from("stock_transactions").insert([
      {
        product_id: Number(batch.product_id),
        batch_id: Number(id),
        user_id: user_id || 1,
        transaction_type: "batch_adjustment",
        quantity: -qtyToDispose,
        previous_stock: prodPrevStock,
        new_stock: prodNextStock,
        reason: reason || `Adjustment from Batch: ${batch.batch_number}`,
      },
    ]);

    return {
      success: true,
      message: `${qtyToDispose} units deducted from batch ${batch.batch_number}.`,
    };
  }

  const response = await apiClient.post(`/batches/${id}/dispose`, { quantity: qtyToDispose, reason });
  return response.data;
}
