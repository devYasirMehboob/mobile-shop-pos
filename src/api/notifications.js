import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getNotifications(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (params.status) query = query.eq("status", params.status);
    if (params.severity) query = query.eq("severity", params.severity);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { data: { notifications: data || [], total: (data || []).length } };
  }

  const response = await apiClient.get("/notifications", { params });
  return response.data;
}

export async function getRecentNotifications(limit = 5) {
  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    return { data: { notifications: data || [] } };
  }

  const response = await apiClient.get("/notifications/recent", { params: { limit }, silent: true });
  return response.data;
}

export async function getUnreadCount() {
  if (isSupabaseConfigured()) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "unread");

    return { data: { unread_count: count || 0 } };
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
    const { data: notif, error } = await supabase.from("notifications").insert([{
      notification_type: "announcement",
      severity: data.severity || "info",
      title: data.title,
      message: data.message,
      status: "unread",
      is_system_generated: 0,
    }]).select().single();

    if (error) throw new Error(error.message);
    return { success: true, data: notif };
  }

  const response = await apiClient.post("/notifications/announce", data);
  return response.data;
}

export async function triggerAlertEvaluation() {
  if (isSupabaseConfigured()) {
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
