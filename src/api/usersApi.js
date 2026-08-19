import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getUsers(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase.from("access_credentials").select("id, name, email, phone, role, is_active, last_login_at, created_at").order("id", { ascending: true });
    if (params.search) query = query.ilike("name", `%${params.search}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { users: data || [], total: (data || []).length };
  }

  const response = await apiClient.get("/users", { params });
  return response.data.data;
}

export async function getUser(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("access_credentials").select("id, name, email, phone, role, is_active").eq("id", id).single();
    if (error) throw new Error(error.message);
    return { user: data, permissions: [] };
  }

  const response = await apiClient.get(`/users/${id}`);
  return response.data.data;
}

export async function createUser(data) {
  if (isSupabaseConfigured()) {
    const { data: newUser, error } = await supabase.from("access_credentials").insert([{
      name: data.name,
      email: data.email,
      phone: data.phone,
      password_hash: data.password,
      role: data.role || "cashier",
      is_active: 1,
    }]).select().single();

    if (error) throw new Error(error.message);
    return { success: true, message: "User created.", data: newUser };
  }

  const response = await apiClient.post("/users", data);
  return response.data;
}

export async function updateUser(id, data) {
  if (isSupabaseConfigured()) {
    const updates = { name: data.name, email: data.email, phone: data.phone, role: data.role };
    if (data.password) updates.password_hash = data.password;

    const { data: updated, error } = await supabase.from("access_credentials").update(updates).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "User updated.", data: updated };
  }

  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
}

export async function updateUserStatus(id, status) {
  if (isSupabaseConfigured()) {
    const isActive = status === "active" ? 1 : 0;
    const { data: updated, error } = await supabase.from("access_credentials").update({ is_active: isActive }).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "User status updated.", data: updated };
  }

  const response = await apiClient.patch(`/users/${id}/status`, { status });
  return response.data;
}

export async function resetUserPassword(id, data) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("access_credentials").update({ password_hash: data.new_password || data.password }).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true, message: "Password updated successfully." };
  }

  const response = await apiClient.post(`/users/${id}/reset-password`, data);
  return response.data;
}

export async function deleteUser(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("access_credentials").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true, message: "User deleted." };
  }

  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
}

export async function getRoles() {
  if (isSupabaseConfigured()) {
    const { data } = await supabase.from("roles").select("*");
    return data || [{ id: 1, name: "Admin", slug: "admin" }, { id: 2, name: "Cashier", slug: "cashier" }];
  }
  const response = await apiClient.get("/roles");
  return response.data.data.roles;
}

export async function getPermissions() {
  if (isSupabaseConfigured()) {
    const { data } = await supabase.from("permissions").select("*");
    return data || [];
  }
  const response = await apiClient.get("/permissions");
  return response.data.data.permissions;
}

export async function getRolePermissions(id) {
  const response = await apiClient.get(`/roles/${id}/permissions`);
  return response.data.data;
}

export async function updateRolePermissions(id, permissionKeys) {
  const response = await apiClient.put(`/roles/${id}/permissions`, { permission_keys: permissionKeys });
  return response.data;
}

export async function updateUserPermissions(id, overrides) {
  const response = await apiClient.put(`/users/${id}/permissions`, { overrides });
  return response.data;
}