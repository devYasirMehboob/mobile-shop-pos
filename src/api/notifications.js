import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function evaluateStoreAlerts() {
  if (isSupabaseConfigured()) {
    const { data: prods } = await supabase.from("products").select("id, name, quantity, minimum_stock").eq("status", "active");
    const { data: existingNotifs } = await supabase.from("notifications").select("source_key, status");

    const existingKeys = new Set((existingNotifs || []).map((n) => n.source_key));
    const toInsert = [];

    (prods || []).forEach((p) => {
      const qty = Number(p.quantity || 0);
      const min = Number(p.minimum_stock || 5);

      if (qty <= 0) {
        const key = `stock_out_${p.id}`;
        if (!existingKeys.has(key)) {
          toInsert.push({
            notification_type: "stock_out",
            severity: "critical",
            title: `Out of Stock: ${p.name}`,
            message: `${p.name} has 0 units remaining. Restock immediately to continue billing in POS.`,
            module: "inventory",
            related_type: "product",
            related_id: p.id,
            action_url: `/inventory?search=${encodeURIComponent(p.name)}`,
            source_key: key,
            status: "unread",
          });
        }
      } else if (qty <= min) {
        const key = `stock_low_${p.id}`;
        if (!existingKeys.has(key)) {
          toInsert.push({
            notification_type: "stock_low",
            severity: "warning",
            title: `Low Stock Alert: ${p.name}`,
            message: `${p.name} is running low with only ${qty} units remaining (Minimum threshold: ${min}).`,
            module: "inventory",
            related_type: "product",
            related_id: p.id,
            action_url: `/inventory?filter=low`,
            source_key: key,
            status: "unread",
          });
        }
      }
    });

    if (toInsert.length > 0) {
      await supabase.from("notifications").insert(toInsert);
    }
  }
}

export async function getNotifications(params = {}) {
  if (isSupabaseConfigured()) {
    await evaluateStoreAlerts();

    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    if (params.severity && params.severity !== "all") {
      query = query.eq("severity", params.severity);
    }
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,message.ilike.%${params.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const list = data || [];
    const criticalCount = list.filter((n) => n.severity === "critical" && n.status === "unread").length;
    const warningCount = list.filter((n) => n.severity === "warning" && n.status === "unread").length;
    const infoCount = list.filter((n) => n.severity === "info" && n.status === "unread").length;
    const successCount = list.filter((n) => n.severity === "success" && n.status === "unread").length;
    const totalUnread = list.filter((n) => n.status === "unread").length;

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      data: {
        notifications: paginated,
        total,
        summary: {
          total: totalUnread,
          critical: criticalCount,
          warning: warningCount,
          info: infoCount,
          success: successCount,
        },
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit) || 1,
        },
      },
    };
  }

  const response = await apiClient.get("/notifications", { params });
  return response.data;
}

export async function getRecentNotifications(limit = 5) {
  if (isSupabaseConfigured()) {
    await evaluateStoreAlerts();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("status", "unread")
      .order("created_at", { ascending: false })
      .limit(limit);

    return { success: true, data: { notifications: data || [] } };
  }

  const response = await apiClient.get("/notifications/recent", { params: { limit }, silent: true });
  return response.data;
}

export async function getUnreadCount() {
  if (isSupabaseConfigured()) {
    const { data } = await supabase.from("notifications").select("severity, status").eq("status", "unread");
    const list = data || [];
    return {
      success: true,
      data: {
        summary: {
          total: list.length,
          critical: list.filter((n) => n.severity === "critical").length,
          warning: list.filter((n) => n.severity === "warning").length,
          info: list.filter((n) => n.severity === "info").length,
          success: list.filter((n) => n.severity === "success").length,
        },
      },
    };
  }

  const response = await apiClient.get("/notifications/unread-count", { silent: true });
  return response.data;
}

export async function markAsRead(id) {
  if (isSupabaseConfigured()) {
    await supabase.from("notifications").update({ status: "read" }).eq("id", id);
    return { success: true };
  }

  const response = await apiClient.post(`/notifications/${id}/read`);
  return response.data;
}

export async function markAsUnread(id) {
  if (isSupabaseConfigured()) {
    await supabase.from("notifications").update({ status: "unread" }).eq("id", id);
    return { success: true };
  }

  const response = await apiClient.post(`/notifications/${id}/unread`);
  return response.data;
}

export async function dismissNotification(id) {
  if (isSupabaseConfigured()) {
    await supabase.from("notifications").update({ status: "dismissed" }).eq("id", id);
    return { success: true };
  }

  const response = await apiClient.post(`/notifications/${id}/dismiss`);
  return response.data;
}

export async function resolveNotification(id) {
  if (isSupabaseConfigured()) {
    await supabase
      .from("notifications")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id);
    return { success: true };
  }

  const response = await apiClient.post(`/notifications/${id}/resolve`);
  return response.data;
}

export async function markAllAsRead() {
  if (isSupabaseConfigured()) {
    await supabase.from("notifications").update({ status: "read" }).eq("status", "unread");
    return { success: true };
  }

  const response = await apiClient.post("/notifications/mark-all-read");
  return response.data;
}

export async function dismissAll() {
  if (isSupabaseConfigured()) {
    await supabase.from("notifications").update({ status: "dismissed" });
    return { success: true };
  }

  const response = await apiClient.post("/notifications/dismiss-all");
  return response.data;
}

export async function createAnnouncement(data) {
  if (isSupabaseConfigured()) {
    const { data: notif, error } = await supabase.from("notifications").insert([
      {
        notification_type: "announcement",
        severity: data.severity || "info",
        title: data.title,
        message: data.message,
        status: "unread",
        is_system_generated: 0,
      },
    ]).select().single();

    if (error) throw new Error(error.message);
    return { success: true, data: notif };
  }

  const response = await apiClient.post("/notifications/announce", data);
  return response.data;
}

export async function triggerAlertEvaluation() {
  if (isSupabaseConfigured()) {
    await evaluateStoreAlerts();
    return { success: true, message: "Alerts evaluated." };
  }

  const response = await apiClient.post("/notifications/evaluate");
  return response.data;
}

export async function getNotificationPreferences() {
  if (isSupabaseConfigured()) {
    return { data: { in_app_enabled: true, sound_enabled: true } };
  }

  const response = await apiClient.get("/notifications/preferences");
  return response.data;
}

export async function updateNotificationPreferences(data) {
  if (isSupabaseConfigured()) {
    return { success: true, data };
  }

  const response = await apiClient.put("/notifications/preferences", data);
  return response.data;
}
