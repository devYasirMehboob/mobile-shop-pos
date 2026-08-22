import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const data = (r) => r.data?.data || r.data;

export async function getPurchases(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("purchases")
      .select("*, suppliers:supplier_id (name, phone)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.purchase_status && params.purchase_status !== "all") {
      query = query.eq("purchase_status", params.purchase_status);
    }
    if (params.payment_status && params.payment_status !== "all") {
      query = query.eq("payment_status", params.payment_status);
    }
    if (params.supplier_id && params.supplier_id !== "all") {
      query = query.eq("supplier_id", Number(params.supplier_id));
    }
    if (params.date_from) {
      query = query.gte("purchase_date", params.date_from);
    }
    if (params.date_to) {
      query = query.lte("purchase_date", params.date_to);
    }
    if (params.search) {
      query = query.or(
        `purchase_number.ilike.%${params.search}%,supplier_invoice_number.ilike.%${params.search}%`
      );
    }

    const { data: list, count, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (list || []).map((p) => ({
      ...p,
      supplier_name: p.suppliers?.name || "General Supplier",
      paid_amount: Number(p.amount_paid || 0),
      due_amount: Number(p.balance_due ?? (Number(p.grand_total || 0) - Number(p.amount_paid || 0))),
    }));

    // Calculate all-time / filtered summary metrics
    const totalPurchases = formatted.reduce(
      (acc, p) => acc + Number(p.grand_total || p.subtotal || 0),
      0
    );
    const totalPaid = formatted.reduce((acc, p) => acc + Number(p.paid_amount || 0), 0);
    const totalDue = formatted.reduce((acc, p) => acc + Number(p.due_amount || 0), 0);

    const { data: suppliersList } = await supabase
      .from("suppliers")
      .select("id, name")
      .order("name", { ascending: true });

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const total = count ?? formatted.length;
    const paginated = formatted.slice((page - 1) * limit, page * limit);

    return {
      purchases: paginated,
      all_purchases: formatted,
      total,
      summary: {
        total_purchases: totalPurchases,
        total_paid: totalPaid,
        total_due: totalDue,
        purchase_count: total,
      },
      suppliers: suppliersList || [],
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  return data(await apiClient.get("/purchases", { params }));
}

export async function getPurchase(id) {
  if (isSupabaseConfigured()) {
    const { data: purchase, error: pErr } = await supabase
      .from("purchases")
      .select("*, suppliers:supplier_id (name, phone, address, contact_person)")
      .eq("id", Number(id))
      .single();
    if (pErr) throw new Error(pErr.message);

    const { data: items, error: iErr } = await supabase
      .from("purchase_items")
      .select("*")
      .eq("purchase_id", Number(id));
    if (iErr) throw new Error(iErr.message);

    const { data: payments } = await supabase
      .from("purchase_payments")
      .select("*")
      .eq("purchase_id", Number(id));

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
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = String(now.getTime()).slice(-4);
    const purchaseNum = `PUR-${dateStr}-${timeStr}`;

    const grandTotal = parseFloat(values.grand_total || values.subtotal || 0);
    const amountPaid = parseFloat(values.amount_paid || 0);
    const balanceDue = Math.max(0, grandTotal - amountPaid);
    const paymentStatus =
      amountPaid >= grandTotal ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
    const purchaseStatus = draft ? "draft" : "received";

    const { data: purchase, error: pErr } = await supabase
      .from("purchases")
      .insert([
        {
          purchase_number: purchaseNum,
          request_token: values.request_token || crypto.randomUUID(),
          supplier_id: Number(values.supplier_id),
          supplier_invoice_number: values.supplier_invoice_number || null,
          purchase_date: values.purchase_date || now.toISOString().split("T")[0],
          subtotal: parseFloat(values.subtotal || grandTotal),
          discount_amount: parseFloat(values.discount_amount || 0),
          tax_amount: parseFloat(values.tax_amount || 0),
          shipping_amount: parseFloat(values.shipping_amount || 0),
          other_charges: parseFloat(values.other_charges || 0),
          grand_total: grandTotal,
          amount_paid: amountPaid,
          balance_due: balanceDue,
          payment_status: paymentStatus,
          purchase_status: purchaseStatus,
          notes: values.notes || null,
          created_by: values.created_by || 1,
        },
      ])
      .select()
      .single();

    if (pErr) throw new Error(pErr.message);

    // Items insertion & inward stock increment
    const items = values.items || [];
    if (items.length > 0) {
      const itemsToInsert = items.map((it) => ({
        purchase_id: purchase.id,
        product_id: Number(it.product_id || it.id),
        product_name: it.product_name || it.name,
        product_code: it.product_code || `PRD-${it.product_id || it.id}`,
        quantity: parseFloat(it.quantity || 1),
        unit_cost: parseFloat(it.unit_cost || it.purchase_cost || 0),
        line_discount: parseFloat(it.line_discount || 0),
        tax_amount: parseFloat(it.tax_amount || 0),
        line_total:
          parseFloat(it.line_total) ||
          parseFloat(it.quantity || 1) * parseFloat(it.unit_cost || it.purchase_cost || 0),
      }));

      await supabase.from("purchase_items").insert(itemsToInsert);

      if (!draft) {
        for (const it of items) {
          const prodId = Number(it.product_id || it.id);
          const addedQty = parseFloat(it.quantity || 1);
          const unitCost = parseFloat(it.unit_cost || it.purchase_cost || 0);

          const { data: prod } = await supabase
            .from("products")
            .select("id, quantity, purchase_cost")
            .eq("id", prodId)
            .single();

          if (prod) {
            const prev = Number(prod.quantity || 0);
            const next = prev + addedQty;

            await supabase
              .from("products")
              .update({
                quantity: next,
                ...(unitCost > 0 ? { purchase_cost: unitCost } : {}),
              })
              .eq("id", prodId);

            await supabase.from("stock_transactions").insert([
              {
                product_id: prodId,
                user_id: values.created_by || 1,
                transaction_type: "purchase",
                quantity: addedQty,
                previous_stock: prev,
                new_stock: next,
                reason: `Procured via Purchase #${purchaseNum}`,
                reference_type: "purchase",
                reference_id: purchase.id,
              },
            ]);
          }
        }
      }
    }

    // Insert Initial Payment Record if paid > 0
    if (amountPaid > 0) {
      await supabase.from("purchase_payments").insert([
        {
          purchase_id: purchase.id,
          supplier_id: Number(values.supplier_id),
          amount: amountPaid,
          payment_method: values.payment_method || "cash",
          reference_number: values.payment_reference || null,
          payment_date: values.purchase_date || now.toISOString().split("T")[0],
          notes: "Initial payment at purchase creation",
          paid_by: values.created_by || 1,
        },
      ]);
    }

    return {
      success: true,
      message: "Purchase order created successfully.",
      data: purchase,
    };
  }

  return (await apiClient.post(draft ? "/purchases/drafts" : "/purchases", values)).data;
}

export async function addPurchasePayment(id, values) {
  if (isSupabaseConfigured()) {
    const purchaseId = Number(id);
    const amount = parseFloat(values.amount || 0);

    const { data: purchase } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", purchaseId)
      .single();

    if (!purchase) throw new Error("Purchase order not found.");

    const { data: pay, error } = await supabase
      .from("purchase_payments")
      .insert([
        {
          purchase_id: purchaseId,
          supplier_id: purchase.supplier_id,
          amount,
          payment_method: values.payment_method || "cash",
          reference_number: values.reference_number || null,
          payment_date: values.payment_date || new Date().toISOString().split("T")[0],
          notes: values.notes || null,
          paid_by: values.paid_by || 1,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const newPaid = Number(purchase.amount_paid || 0) + amount;
    const grandTotal = Number(purchase.grand_total || purchase.subtotal || 0);
    const newDue = Math.max(0, grandTotal - newPaid);
    const newPaymentStatus = newPaid >= grandTotal ? "paid" : "partial";

    await supabase
      .from("purchases")
      .update({
        amount_paid: newPaid,
        balance_due: newDue,
        payment_status: newPaymentStatus,
      })
      .eq("id", purchaseId);

    return { success: true, message: "Payment added successfully.", data: pay };
  }

  return (await apiClient.post(`/purchases/${id}/payments`, values)).data;
}

export async function cancelPurchase(id, reason) {
  if (isSupabaseConfigured()) {
    const purchaseId = Number(id);
    const { data: updated, error } = await supabase
      .from("purchases")
      .update({
        purchase_status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", purchaseId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Purchase order cancelled.", data: updated };
  }

  return (await apiClient.post(`/purchases/${id}/cancel`, { reason })).data;
}

export async function getPurchaseReturns(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("purchase_returns")
      .select(
        "*, purchases:purchase_id (purchase_number), suppliers:supplier_id (name, phone)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (params.supplier_id && params.supplier_id !== "all") {
      query = query.eq("supplier_id", Number(params.supplier_id));
    }
    if (params.date_from) {
      query = query.gte("return_date", params.date_from);
    }
    if (params.date_to) {
      query = query.lte("return_date", params.date_to);
    }
    if (params.search) {
      query = query.or(
        `return_number.ilike.%${params.search}%,reason.ilike.%${params.search}%`
      );
    }

    const { data: list, count, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (list || []).map((r) => ({
      ...r,
      purchase_number: r.purchases?.purchase_number || `PUR-${r.purchase_id}`,
      supplier_name: r.suppliers?.name || "General Supplier",
    }));

    const totalReturned = formatted.reduce((acc, r) => acc + Number(r.subtotal || 0), 0);
    const totalRefund = formatted.reduce(
      (acc, r) => acc + Number(r.refund_amount || 0),
      0
    );
    const totalAdjustment = formatted.reduce(
      (acc, r) => acc + Number(r.balance_adjustment || 0),
      0
    );

    const { data: suppliersList } = await supabase
      .from("suppliers")
      .select("id, name")
      .order("name", { ascending: true });

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const total = count ?? formatted.length;
    const paginated = formatted.slice((page - 1) * limit, page * limit);

    return {
      returns: paginated,
      all_returns: formatted,
      total,
      summary: {
        total_returned: totalReturned,
        total_refund: totalRefund,
        total_adjustment: totalAdjustment,
        return_count: total,
      },
      suppliers: suppliersList || [],
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  return data(await apiClient.get("/purchase-returns", { params }));
}

export async function createPurchaseReturn(values) {
  if (isSupabaseConfigured()) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = String(now.getTime()).slice(-4);
    const retNum = `PRET-${dateStr}-${timeStr}`;

    const subtotal = parseFloat(values.subtotal || 0);
    const refundAmount = parseFloat(values.refund_amount || 0);
    const balanceAdj = parseFloat(values.balance_adjustment || 0);

    const { data: ret, error } = await supabase
      .from("purchase_returns")
      .insert([
        {
          return_number: retNum,
          purchase_id: Number(values.purchase_id),
          supplier_id: Number(values.supplier_id),
          return_date: values.return_date || now.toISOString().split("T")[0],
          subtotal,
          refund_amount: refundAmount,
          balance_adjustment: balanceAdj,
          reason: values.reason || "Supplier return",
          processed_by: values.processed_by || 1,
          status: "completed",
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If purchase items returned, reduce stock
    const items = values.items || [];
    for (const it of items) {
      const prodId = Number(it.product_id || it.id);
      const retQty = parseFloat(it.quantity || 1);

      const { data: prod } = await supabase
        .from("products")
        .select("id, quantity")
        .eq("id", prodId)
        .single();

      if (prod) {
        const prev = Number(prod.quantity || 0);
        const next = Math.max(0, prev - retQty);

        await supabase.from("products").update({ quantity: next }).eq("id", prodId);

        await supabase.from("stock_transactions").insert([
          {
            product_id: prodId,
            user_id: values.processed_by || 1,
            transaction_type: "manual_reduction",
            quantity: -retQty,
            previous_stock: prev,
            new_stock: next,
            reason: `Returned to Supplier — Return #${retNum}`,
            reference_type: "purchase_return",
            reference_id: ret.id,
          },
        ]);
      }
    }

    return { success: true, message: "Purchase return recorded successfully.", data: ret };
  }

  return (await apiClient.post("/purchase-returns", values)).data;
}

export async function exportPurchases(params = {}) {
  return apiClient.get("/purchases/export", { params, responseType: "blob" });
}
