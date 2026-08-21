import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const data = (r) => r.data.data;

export async function getPurchases(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("purchases")
      .select("*, suppliers:supplier_id (name)")
      .order("created_at", { ascending: false });

    if (params.status) query = query.eq("purchase_status", params.status);
    if (params.supplier_id) query = query.eq("supplier_id", params.supplier_id);
    if (params.date_from) query = query.gte("purchase_date", params.date_from);
    if (params.date_to) query = query.lte("purchase_date", params.date_to);

    const { data: list, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (list || []).map((p) => ({
      ...p,
      supplier_name: p.suppliers?.name || "Supplier",
    }));

    const totalPurchases = formatted.reduce((acc, p) => acc + Number(p.grand_total || p.subtotal || 0), 0);
    const totalPaid = formatted.reduce((acc, p) => acc + Number(p.paid_amount || 0), 0);
    const totalDue = formatted.reduce((acc, p) => acc + Number(p.due_amount || 0), 0);

    const { data: suppliersList } = await supabase
      .from("suppliers")
      .select("id, name")
      .order("name", { ascending: true });

    return {
      purchases: formatted,
      total: formatted.length,
      summary: {
        total_purchases: totalPurchases,
        total_paid: totalPaid,
        total_due: totalDue,
        purchase_count: formatted.length,
      },
      suppliers: suppliersList || [],
      pagination: { page: 1, per_page: formatted.length, total: formatted.length, total_pages: 1 },
    };
  }

  return data(await apiClient.get("/purchases", { params }));
}

export async function getPurchase(id) {
  if (isSupabaseConfigured()) {
    const { data: purchase, error: pErr } = await supabase
      .from("purchases")
      .select("*, suppliers:supplier_id (name, phone, address)")
      .eq("id", id)
      .single();
    if (pErr) throw new Error(pErr.message);

    const { data: items, error: iErr } = await supabase
      .from("purchase_items")
      .select("*")
      .eq("purchase_id", id);
    if (iErr) throw new Error(iErr.message);

    const { data: payments } = await supabase
      .from("purchase_payments")
      .select("*")
      .eq("purchase_id", id);

    return {
      purchase: {
        ...purchase,
        supplier_name: purchase.suppliers?.name || "Supplier",
        items: items || [],
        payments: payments || [],
      },
    };
  }

  return data(await apiClient.get(`/purchases/${id}`));
}

export async function createPurchase(values, draft = false) {
  if (isSupabaseConfigured()) {
    const purchaseNum = "PUR-" + Date.now().toString().slice(-8);
    const { data: purchase, error: pErr } = await supabase
      .from("purchases")
      .insert([{
        purchase_number: purchaseNum,
        request_token: values.request_token || Math.random().toString(36),
        supplier_id: values.supplier_id,
        supplier_invoice_number: values.supplier_invoice_number || null,
        purchase_date: values.purchase_date || new Date().toISOString().split("T")[0],
        subtotal: values.subtotal || 0,
        discount_amount: values.discount_amount || 0,
        tax_amount: values.tax_amount || 0,
        shipping_amount: values.shipping_amount || 0,
        grand_total: values.grand_total || 0,
        amount_paid: values.amount_paid || 0,
        balance_due: (values.grand_total || 0) - (values.amount_paid || 0),
        payment_status: values.amount_paid >= values.grand_total ? "paid" : values.amount_paid > 0 ? "partially_paid" : "unpaid",
        purchase_status: draft ? "draft" : "completed",
        notes: values.notes || null,
        created_by: values.created_by || 1,
      }])
      .select()
      .single();

    if (pErr) throw new Error(pErr.message);

    // Items insertion & stock addition if completed
    if (values.items?.length) {
      const itemsToInsert = values.items.map((it) => ({
        purchase_id: purchase.id,
        product_id: it.product_id || it.id,
        product_name: it.product_name || it.name,
        product_code: it.product_code || "",
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        line_discount: it.line_discount || 0,
        tax_amount: it.tax_amount || 0,
        line_total: it.line_total || it.quantity * it.unit_cost,
      }));

      await supabase.from("purchase_items").insert(itemsToInsert);

      if (!draft) {
        for (const it of values.items) {
          const prodId = it.product_id || it.id;
          const { data: prod } = await supabase.from("products").select("quantity").eq("id", prodId).single();
          const prev = Number(prod?.quantity || 0);
          const next = prev + Number(it.quantity);
          await supabase.from("products").update({ quantity: next, purchase_cost: it.unit_cost }).eq("id", prodId);

          await supabase.from("stock_transactions").insert([{
            product_id: prodId,
            user_id: values.created_by || 1,
            transaction_type: "purchase",
            quantity: it.quantity,
            previous_stock: prev,
            new_stock: next,
            reason: `Purchase #${purchaseNum}`,
            reference_type: "purchase",
            reference_id: purchase.id,
          }]);
        }
      }
    }

    return { success: true, message: "Purchase created successfully.", data: purchase };
  }

  return (await apiClient.post(draft ? "/purchases/drafts" : "/purchases", values)).data;
}

export async function updateDraftPurchase(id, values) {
  if (isSupabaseConfigured()) {
    const { data: updated, error } = await supabase.from("purchases").update(values).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Draft purchase updated.", data: updated };
  }

  return (await apiClient.put(`/purchases/${id}`, values)).data;
}

export async function completeDraftPurchase(id, values) {
  if (isSupabaseConfigured()) {
    return createPurchase({ ...values, id }, false);
  }
  return (await apiClient.post(`/purchases/${id}/complete`, values)).data;
}

export async function addPurchasePayment(id, values) {
  if (isSupabaseConfigured()) {
    const { data: pay, error } = await supabase.from("purchase_payments").insert([{
      purchase_id: id,
      supplier_id: values.supplier_id,
      amount: values.amount,
      payment_method: values.payment_method || "cash",
      reference_number: values.reference_number || null,
      payment_date: values.payment_date || new Date().toISOString().split("T")[0],
      notes: values.notes || null,
      paid_by: values.paid_by || 1,
    }]).select().single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Payment added successfully.", data: pay };
  }

  return (await apiClient.post(`/purchases/${id}/payments`, values)).data;
}

export async function cancelPurchase(id, reason) {
  if (isSupabaseConfigured()) {
    const { data: updated, error } = await supabase
      .from("purchases")
      .update({
        purchase_status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Purchase cancelled.", data: updated };
  }

  return (await apiClient.post(`/purchases/${id}/cancel`, { reason })).data;
}

export async function getReturnableItems(id) {
  if (isSupabaseConfigured()) {
    const { data: items } = await supabase.from("purchase_items").select("*").eq("purchase_id", id);
    return items || [];
  }
  return data(await apiClient.get(`/purchases/${id}/returnable-items`));
}

export async function exportPurchases(params = {}) {
  return apiClient.get("/purchases/export", { params, responseType: "blob" });
}

export async function getPurchaseReturns(params = {}) {
  if (isSupabaseConfigured()) {
    const { data: list, error } = await supabase
      .from("purchase_returns")
      .select("*, suppliers:supplier_id (name)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    const formatted = (list || []).map((r) => ({
      ...r,
      supplier_name: r.suppliers?.name || "Supplier",
    }));

    return {
      returns: formatted,
      total: formatted.length,
      pagination: { page: 1, per_page: formatted.length, total: formatted.length, total_pages: 1 },
    };
  }

  return data(await apiClient.get("/purchase-returns", { params }));
}

export async function getPurchaseReturn(id) {
  if (isSupabaseConfigured()) {
    const { data: ret, error } = await supabase.from("purchase_returns").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    const { data: items } = await supabase.from("purchase_return_items").select("*").eq("purchase_return_id", id);
    return { return: { ...ret, items: items || [] } };
  }

  return data(await apiClient.get(`/purchase-returns/${id}`));
}

export async function createPurchaseReturn(values) {
  if (isSupabaseConfigured()) {
    const retNum = "PRET-" + Date.now().toString().slice(-8);
    const { data: ret, error } = await supabase.from("purchase_returns").insert([{
      return_number: retNum,
      purchase_id: values.purchase_id,
      supplier_id: values.supplier_id,
      return_date: values.return_date || new Date().toISOString().split("T")[0],
      subtotal: values.subtotal || 0,
      refund_amount: values.refund_amount || 0,
      balance_adjustment: values.balance_adjustment || 0,
      reason: values.reason || "Supplier return",
      processed_by: values.processed_by || 1,
      status: "completed",
    }]).select().single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Purchase return processed.", data: ret };
  }

  return (await apiClient.post("/purchase-returns", values)).data;
}
