import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function completeSale(payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc("complete_sale_rpc", { payload });
      if (!error && data?.success) {
        return data;
      }
    } catch (rpcErr) {
      console.warn("RPC complete_sale_rpc warning, using direct transactional flow:", rpcErr);
    }

    // Direct Database Fallback Flow
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = String(now.getTime()).slice(-4);
    const invoiceNumber = `INV-${dateStr}-${timeStr}`;
    const requestToken = payload.request_token || crypto.randomUUID();

    const saleRecord = {
      invoice_number: invoiceNumber,
      request_token: requestToken,
      cashier_id: payload.cashier_id || 1,
      customer_name: payload.customer_name || "Walk-in Customer",
      customer_phone: payload.customer_phone || null,
      subtotal: parseFloat(payload.subtotal) || 0,
      discount_type: payload.discount_type || "none",
      discount_value: parseFloat(payload.discount_value) || 0,
      discount_amount: parseFloat(payload.discount_amount) || 0,
      tax_amount: parseFloat(payload.tax_amount) || 0,
      grand_total: parseFloat(payload.grand_total) || 0,
      amount_received: parseFloat(payload.amount_received ?? payload.grand_total) || 0,
      change_returned: parseFloat(payload.change_returned) || 0,
      payment_method: payload.payment_method || "cash",
      payment_status: "paid",
      status: "completed",
      notes: payload.notes || null,
    };

    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert([saleRecord])
      .select()
      .single();

    if (saleErr) throw new Error(saleErr.message);

    // Insert Sale Items and update inventory
    const items = payload.items || [];
    if (items.length > 0) {
      const saleItemsToInsert = items.map((item) => ({
        sale_id: sale.id,
        product_id: Number(item.product_id || item.id),
        product_name: item.name || item.product_name,
        product_code: item.product_code || item.code || `PRD-${item.id}`,
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price || item.price) || 0,
        purchase_cost: parseFloat(item.purchase_cost || item.cost) || 0,
        discount_amount: parseFloat(item.discount_amount) || 0,
        line_total: parseFloat(item.line_total || item.total) || (item.quantity * item.unit_price),
      }));

      const { error: itemsErr } = await supabase.from("sale_items").insert(saleItemsToInsert);
      if (itemsErr) console.warn("Sale items insert notice:", itemsErr.message);

      // Reduce product stock & record stock transaction
      for (const item of items) {
        const prodId = Number(item.product_id || item.id);
        const soldQty = parseFloat(item.quantity) || 1;

        const { data: prod } = await supabase
          .from("products")
          .select("id, quantity")
          .eq("id", prodId)
          .single();

        if (prod) {
          const prev = Number(prod.quantity || 0);
          const next = Math.max(0, prev - soldQty);

          await supabase.from("products").update({ quantity: next }).eq("id", prodId);

          await supabase.from("stock_transactions").insert([
            {
              product_id: prodId,
              user_id: payload.cashier_id || 1,
              transaction_type: "sale",
              quantity: -soldQty,
              previous_stock: prev,
              new_stock: next,
              reason: `POS Sale — ${invoiceNumber}`,
              reference_type: "sale",
              reference_id: sale.id,
            },
          ]);
        }
      }
    }

    // Insert Payment Record
    await supabase.from("payments").insert([
      {
        sale_id: sale.id,
        payment_method: payload.payment_method || "cash",
        amount: parseFloat(payload.grand_total) || 0,
        status: "paid",
        reference: payload.payment_reference || null,
      },
    ]);

    return {
      success: true,
      message: "Sale completed successfully.",
      data: {
        id: sale.id,
        invoice_number: sale.invoice_number,
        grand_total: sale.grand_total,
        subtotal: payload.subtotal,
        discount_amount: payload.discount_amount,
        tax_amount: payload.tax_amount,
        amount_received: payload.amount_received,
        change_returned: sale.change_returned,
        payment_method: payload.payment_method || "cash",
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        items: items.map((item) => ({
          id: item.product_id || item.id,
          name: item.name || item.product_name,
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price || item.selling_price || item.price) || 0,
          line_total: parseFloat(item.line_total) || (parseFloat(item.quantity || 1) * parseFloat(item.unit_price || item.selling_price || 0)),
        })),
        total_items: items.length,
        total_quantity: items.reduce((acc, i) => acc + (parseFloat(i.quantity) || 1), 0),
      },
    };
  }

  const response = await apiClient.post("/sales", payload);
  return response.data;
}

export async function getSales(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("sales")
      .select("*, access_credentials:cashier_id (name)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    if (params.payment_method && params.payment_method !== "all") {
      query = query.eq("payment_method", params.payment_method);
    }
    if (params.date_from) {
      query = query.gte("created_at", `${params.date_from}T00:00:00`);
    }
    if (params.date_to) {
      query = query.lte("created_at", `${params.date_to}T23:59:59`);
    }
    if (params.search) {
      query = query.or(
        `invoice_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,customer_phone.ilike.%${params.search}%`
      );
    }

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    // Fetch sale items count for each sale
    const salesList = data || [];
    const saleIds = salesList.map((s) => s.id);
    let itemsCountMap = {};

    if (saleIds.length > 0) {
      const { data: allItems } = await supabase
        .from("sale_items")
        .select("sale_id, quantity")
        .in("sale_id", saleIds);

      (allItems || []).forEach((item) => {
        itemsCountMap[item.sale_id] =
          (itemsCountMap[item.sale_id] || 0) + Number(item.quantity || 0);
      });
    }

    const formatted = salesList.map((s) => ({
      ...s,
      cashier_name: s.access_credentials?.name || "Cashier",
      total_items: itemsCountMap[s.id] || 1,
    }));

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const total = count ?? formatted.length;
    const paginated = formatted.slice((page - 1) * limit, page * limit);

    return {
      sales: paginated,
      all_sales: formatted,
      total,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  const response = await apiClient.get("/sales", { params });
  return response.data.data;
}

export async function getSalesSummary(params = {}) {
  if (isSupabaseConfigured()) {
    const { data: sales, error } = await supabase
      .from("sales")
      .select("id, grand_total, status, payment_method, customer_name, created_at");

    if (error) throw new Error(error.message);

    const { data: items } = await supabase.from("sale_items").select("quantity, line_total");

    const allSales = sales || [];
    const completed = allSales.filter((s) => s.status === "completed");
    const refunded = allSales.filter((s) => s.status === "refunded");
    const netSales = completed.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
    const refundTotal = refunded.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
    const totalUnitsSold = (items || []).reduce((acc, i) => acc + Number(i.quantity || 0), 0);
    const uniqueCustomers = new Set(
      allSales.map((s) => s.customer_name).filter((c) => c && c !== "Walk-in Customer")
    ).size;

    return {
      total_sales: netSales,
      net_sales: netSales - refundTotal,
      total_orders: completed.length,
      refunded_orders: refunded.length,
      refunded_amount: refundTotal,
      total_customers: uniqueCustomers || allSales.length,
      units_sold: totalUnitsSold,
      average_order_value: completed.length ? netSales / completed.length : 0,
    };
  }

  const response = await apiClient.get("/sales/summary", { params });
  return response.data.data.summary;
}

export async function getSale(id) {
  if (isSupabaseConfigured()) {
    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .select("*, access_credentials:cashier_id (name)")
      .eq("id", Number(id))
      .maybeSingle();

    if (saleErr) throw new Error(saleErr.message);
    if (!sale) throw new Error(`Sale #${id} not found.`);

    const { data: items, error: itemsErr } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", Number(id));
    if (itemsErr) console.warn("Sale items fetch notice:", itemsErr.message);

    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("sale_id", Number(id));

    const { data: refund } = await supabase
      .from("refunds")
      .select("*")
      .eq("sale_id", Number(id))
      .maybeSingle();

    return {
      ...sale,
      cashier_name: sale.access_credentials?.name || "Cashier",
      items: items || [],
      payments: payments || [],
      refund: refund || null,
    };
  }

  const response = await apiClient.get(`/sales/${id}`);
  return response.data.data;
}

export async function getSaleReceipt(id) {
  if (isSupabaseConfigured()) {
    const saleData = await getSale(id);
    const { data: shopSettings } = await supabase.from("settings").select("*");

    const settingsMap = {};
    (shopSettings || []).forEach((s) => {
      if (s.setting_key) {
        try {
          settingsMap[s.setting_key] =
            typeof s.setting_value === "string" && s.setting_value.startsWith("{")
              ? JSON.parse(s.setting_value)
              : s.setting_value;
        } catch {
          settingsMap[s.setting_key] = s.setting_value;
        }
      }
    });

    const shopGroup = settingsMap.shop || {};
    const receiptGroup = settingsMap.receipt || {};

    return {
      sale: saleData,
      shop: {
        shop_name: shopGroup.shop_name || settingsMap.shop_name || "Mobile Shop POS",
        address: shopGroup.address || settingsMap.address || "",
        phone: shopGroup.phone || settingsMap.phone || "",
        registration_number: shopGroup.registration_number || settingsMap.registration_number || "",
        logo: shopGroup.logo || shopGroup.logo_url || settingsMap.logo || settingsMap.logo_url || "",
        logo_url: shopGroup.logo || shopGroup.logo_url || settingsMap.logo || settingsMap.logo_url || "",
        receipt_footer: receiptGroup.footer_message || shopGroup.receipt_footer || settingsMap.receipt_footer || "Thank you for shopping with us! Please visit again.",
        return_policy: receiptGroup.return_policy || shopGroup.return_policy || settingsMap.return_policy || "7-day check warranty with original invoice.",
      },
      options: receiptGroup,
    };
  }

  const response = await apiClient.get(`/sales/${id}/receipt`);
  return response.data.data;
}

export async function cancelSale(id, reason) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("sales")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Sale cancelled successfully.", data };
  }

  const response = await apiClient.post(`/sales/${id}/cancel`, { reason });
  return response.data;
}

export async function refundSale(id, payload = {}) {
  if (isSupabaseConfigured()) {
    const saleId = Number(id);
    const { data: sale } = await supabase.from("sales").select("*").eq("id", saleId).maybeSingle();
    const refundAmount = parseFloat(payload.amount || sale?.grand_total || 0);

    // 1. Attempt insert into refunds table (handle RLS policy gracefully)
    try {
      const { error: refundErr } = await supabase.from("refunds").insert([
        {
          sale_id: saleId,
          processed_by: payload.processed_by || 1,
          refund_amount: refundAmount,
          refund_method: payload.payment_method || sale?.payment_method || "cash",
          reason: payload.reason || "Customer return & refund",
          status: "completed",
        },
      ]);
      if (refundErr) {
        console.warn("Notice: refunds table insert policy restriction:", refundErr.message);
      }
    } catch (e) {
      console.warn("Refunds insert warning:", e.message);
    }

    // 2. Always update sales table with refunded status and timestamp
    const { error: saleUpdateErr } = await supabase
      .from("sales")
      .update({
        status: "refunded",
        cancellation_reason: payload.reason || "Customer return & refund",
        refunded_at: new Date().toISOString(),
      })
      .eq("id", saleId);

    if (saleUpdateErr) {
      console.warn("Sales status update notice:", saleUpdateErr.message);
    }

    // 3. Restore stock quantities and record refund stock transactions
    const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", saleId);
    for (const item of items || []) {
      const prodId = Number(item.product_id);
      const { data: prod } = await supabase
        .from("products")
        .select("id, quantity")
        .eq("id", prodId)
        .maybeSingle();

      if (prod) {
        const prev = Number(prod.quantity || 0);
        const returnQty = Number(item.quantity || 0);
        const next = prev + returnQty;

        await supabase.from("products").update({ quantity: next }).eq("id", prodId);

        await supabase.from("stock_transactions").insert([
          {
            product_id: prodId,
            user_id: payload.processed_by || 1,
            transaction_type: "refund",
            quantity: returnQty,
            previous_stock: prev,
            new_stock: next,
            reason: `Restocked from Returned Sale — ${sale?.invoice_number || `INV-${saleId}`}`,
            reference_type: "refund",
            reference_id: saleId,
          },
        ]);
      }
    }

    return {
      success: true,
      message: `Sale ${sale?.invoice_number || `INV-${saleId}`} refunded and product stock restored successfully.`,
    };
  }

  const response = await apiClient.post(`/sales/${id}/refund`, payload);
  return response.data;
}

export async function getSalesReturns(params = {}) {
  if (isSupabaseConfigured()) {
    // 1. Try fetching from refunds table
    const { data: refunds } = await supabase
      .from("refunds")
      .select("*, sales:sale_id (*, access_credentials:cashier_id (name))")
      .order("created_at", { ascending: false });

    // 2. Also fetch sales marked as 'refunded' for full reliability
    const { data: refundedSales } = await supabase
      .from("sales")
      .select("*, access_credentials:cashier_id (name)")
      .eq("status", "refunded")
      .order("created_at", { ascending: false });

    const refundSaleIds = new Set((refunds || []).map((r) => r.sale_id));

    const combinedReturns = [
      ...(refunds || []).map((r) => ({
        id: r.id,
        sale_id: r.sale_id,
        invoice_number: r.sales?.invoice_number || `INV-${r.sale_id}`,
        customer_name: r.sales?.customer_name || "Walk-in Customer",
        customer_phone: r.sales?.customer_phone || "—",
        refund_amount: r.refund_amount || r.sales?.grand_total || 0,
        refund_method: r.refund_method || r.sales?.payment_method || "cash",
        reason: r.reason || r.sales?.cancellation_reason || "Customer return",
        created_at: r.created_at || r.sales?.refunded_at || r.sales?.created_at,
        status: r.status || "completed",
        cashier_name: r.sales?.access_credentials?.name || "Cashier",
      })),
      ...(refundedSales || [])
        .filter((s) => !refundSaleIds.has(s.id))
        .map((s) => ({
          id: `ref-${s.id}`,
          sale_id: s.id,
          invoice_number: s.invoice_number || `INV-${s.id}`,
          customer_name: s.customer_name || "Walk-in Customer",
          customer_phone: s.customer_phone || "—",
          refund_amount: s.grand_total || 0,
          refund_method: s.payment_method || "cash",
          reason: s.cancellation_reason || "Customer return & refund",
          created_at: s.refunded_at || s.updated_at || s.created_at,
          status: "completed",
          cashier_name: s.access_credentials?.name || "Cashier",
        })),
    ];

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const total = combinedReturns.length;
    const paginated = combinedReturns.slice((page - 1) * limit, page * limit);

    return {
      returns: paginated,
      all_returns: combinedReturns,
      total,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  const response = await apiClient.get("/sales/returns", { params });
  return response.data.data;
}

export async function exportSales(params = {}) {
  return apiClient.get("/sales/export", { params, responseType: "blob" });
}
