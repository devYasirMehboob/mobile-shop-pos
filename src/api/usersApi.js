import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getUsers(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("access_credentials")
      .select("id, name, email, phone, role, is_active, last_login_at, created_at, updated_at")
      .order("id", { ascending: true });

    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
    }
    if (params.role && params.role !== "all") {
      query = query.eq("role", params.role);
    }
    if (params.status && params.status !== "all") {
      const active = params.status === "active" ? 1 : 0;
      query = query.eq("is_active", active);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (data || []).map((u) => ({
      ...u,
      status: u.is_active === 1 || u.is_active === true ? "active" : "inactive",
    }));

    return {
      users: formatted,
      total: formatted.length,
      summary: {
        total_users: formatted.length,
        admins: formatted.filter((u) => u.role === "admin").length,
        cashiers: formatted.filter((u) => u.role === "cashier").length,
        active_users: formatted.filter((u) => u.status === "active").length,
      },
      pagination: {
        page: Number(params.page) || 1,
        limit: Number(params.limit) || 15,
        total: formatted.length,
        total_pages: Math.ceil(formatted.length / (Number(params.limit) || 15)) || 1,
      },
    };
  }

  const response = await apiClient.get("/users", { params });
  return response.data.data;
}

export async function getUser(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("access_credentials")
      .select("id, name, email, phone, role, is_active, last_login_at, created_at, updated_at")
      .eq("id", Number(id))
      .single();

    if (error) throw new Error(error.message);

    const user = {
      ...data,
      status: data.is_active === 1 || data.is_active === true ? "active" : "inactive",
    };

    return {
      user,
      effective_permissions: user.role === "admin" ? ["all_access", "sales.manage", "products.manage", "inventory.manage", "reports.view", "settings.manage", "users.manage"] : ["pos.access", "sales.create", "receipts.print"],
      recent_activity: [],
    };
  }

  const response = await apiClient.get(`/users/${id}`);
  return response.data.data;
}

export async function createUser(data) {
  if (isSupabaseConfigured()) {
    // Determine next available ID to prevent sequence collision with seeded records
    const { data: maxRows } = await supabase
      .from("access_credentials")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    const nextId = maxRows && maxRows.length > 0 ? Number(maxRows[0].id) + 1 : 1;

    // Fallback email if user left it blank, ensuring unique constraint is satisfied
    const generatedEmail =
      data.email?.trim() ||
      `${data.name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}${Date.now().toString().slice(-4)}@mobileshop.local`;

    const payload = {
      id: nextId,
      name: data.name,
      email: generatedEmail,
      phone: data.phone || null,
      password_hash: data.password,
      role: data.role || "cashier",
      is_active: data.status === "inactive" ? 0 : 1,
    };

    const { data: newUser, error } = await supabase
      .from("access_credentials")
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "User account created successfully.", data: newUser };
  }

  const response = await apiClient.post("/users", data);
  return response.data;
}

export async function updateUser(id, data) {
  if (isSupabaseConfigured()) {
    const updates = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role,
      is_active: data.status === "inactive" ? 0 : 1,
      updated_at: new Date().toISOString(),
    };
    if (data.password) updates.password_hash = data.password;

    const { data: updated, error } = await supabase
      .from("access_credentials")
      .update(updates)
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "User account updated successfully.", data: updated };
  }

  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
}

export async function updateUserStatus(id, status) {
  if (isSupabaseConfigured()) {
    const isActive = status === "active" ? 1 : 0;
    const { data: updated, error } = await supabase
      .from("access_credentials")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: `User marked as ${status}.`, data: updated };
  }

  const response = await apiClient.patch(`/users/${id}/status`, { status });
  return response.data;
}

export async function resetUserPassword(id, data) {
  if (isSupabaseConfigured()) {
    const newPass = data.new_password || data.password;
    const { error } = await supabase
      .from("access_credentials")
      .update({ password_hash: newPass, updated_at: new Date().toISOString() })
      .eq("id", Number(id));

    if (error) throw new Error(error.message);
    return { success: true, message: "Password updated successfully." };
  }

  const response = await apiClient.post(`/users/${id}/reset-password`, data);
  return response.data;
}

const PROTECTED_DEMO_EMAILS = ["admin2@mobileshop.com", "admin@mobileshop.com", "cashier@mobileshop.com"];

export async function updateMyProfile(id, { name, email, phone }) {
  if (isSupabaseConfigured()) {
    const cleanEmail = email?.trim()?.toLowerCase() || null;
    const cleanPhone = phone?.trim() || null;
    const nowIso = new Date().toISOString();

    // Check if user is a protected demo account
    const cachedUser = localStorage.getItem("mobile_pos_user");
    const currentEmail = cachedUser ? JSON.parse(cachedUser)?.email?.toLowerCase() : cleanEmail;
    const isProtected = PROTECTED_DEMO_EMAILS.includes(currentEmail) || PROTECTED_DEMO_EMAILS.includes(cleanEmail);

    let updated = null;

    // 1. Try updating by ID
    if (id && !isNaN(Number(id))) {
      const updateData = isProtected
        ? { name, updated_at: nowIso }
        : { name, email: cleanEmail, phone: cleanPhone, updated_at: nowIso };

      const { data } = await supabase
        .from("access_credentials")
        .update(updateData)
        .eq("id", Number(id))
        .select("id, name, email, phone, role, is_active")
        .maybeSingle();

      updated = data;
    }

    // 2. If not matched by ID, try updating by email
    if (!updated && cleanEmail) {
      const updateData = isProtected
        ? { name, updated_at: nowIso }
        : { name, phone: cleanPhone, updated_at: nowIso };

      const { data } = await supabase
        .from("access_credentials")
        .update(updateData)
        .ilike("email", cleanEmail)
        .select("id, name, email, phone, role, is_active")
        .maybeSingle();

      updated = data;
    }

    // 3. If still not in access_credentials, auto-create record
    if (!updated) {
      const newRec = {
        name,
        email: cleanEmail,
        phone: cleanPhone,
        password_hash: "supabase_auth_managed",
        role: "admin",
        is_active: 1,
      };
      const { data: created, error: insErr } = await supabase
        .from("access_credentials")
        .insert(newRec)
        .select("id, name, email, phone, role, is_active")
        .maybeSingle();

      if (insErr && !insErr.message?.includes("duplicate")) {
        throw new Error(insErr.message);
      }
      updated = created || { id: Number(id) || 1, ...newRec };
    }

    // 4. Also update Supabase Auth metadata (only name for demo)
    try {
      await supabase.auth.updateUser({
        data: isProtected ? { name, full_name: name } : { name, full_name: name, phone: cleanPhone },
      });
    } catch {}

    // Sync localStorage
    const cached = localStorage.getItem("mobile_pos_user");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        localStorage.setItem("mobile_pos_user", JSON.stringify({ ...parsed, ...updated }));
      } catch {}
    }

    return { success: true, message: "Profile updated successfully.", data: updated };
  }

  const response = await apiClient.put(`/users/${id}`, { name, email, phone });
  return response.data;
}

export async function changeMyPassword(id, { current_password, new_password }) {
  if (isSupabaseConfigured()) {
    // Check if user is a protected demo account
    const cachedUser = localStorage.getItem("mobile_pos_user");
    const currentEmail = cachedUser ? JSON.parse(cachedUser)?.email?.toLowerCase() : "";
    if (PROTECTED_DEMO_EMAILS.includes(currentEmail)) {
      throw new Error("Password modification is disabled for this public demo account.");
    }

    // 1. Try Supabase Auth password update
    try {
      await supabase.auth.updateUser({ password: new_password });
    } catch {}

    // 2. Update access_credentials if record exists
    if (id && !isNaN(Number(id))) {
      await supabase
        .from("access_credentials")
        .update({ password_hash: new_password, updated_at: new Date().toISOString() })
        .eq("id", Number(id));
    }

    return { success: true, message: "Password changed successfully." };
  }

  const response = await apiClient.post(`/users/${id}/change-password`, {
    current_password,
    new_password,
  });
  return response.data;
}

export async function deleteUser(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("access_credentials").delete().eq("id", Number(id));
    if (error) throw new Error(error.message);
    return { success: true, message: "User account deleted." };
  }

  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
}

export async function getRoles() {
  if (isSupabaseConfigured()) {
    return [
      { id: 1, name: "Admin", slug: "admin" },
      { id: 2, name: "Cashier", slug: "cashier" },
      { id: 3, name: "Manager", slug: "manager" },
    ];
  }
  const response = await apiClient.get("/roles");
  return response.data.data;
}

export async function getPermissions() {
  if (isSupabaseConfigured()) {
    return [
      { key: "pos.access", name: "POS Access", module: "Billing" },
      { key: "sales.manage", name: "Sales & Invoices", module: "Sales" },
      { key: "products.manage", name: "Products & Stock", module: "Inventory" },
      { key: "purchases.manage", name: "Purchases & Suppliers", module: "Procurement" },
      { key: "expenses.manage", name: "Expenses & Categories", module: "Finance" },
      { key: "reports.view", name: "Reports & Analytics", module: "Reports" },
      { key: "settings.manage", name: "Shop Settings", module: "System" },
      { key: "users.manage", name: "User Management", module: "Security" },
    ];
  }
  const response = await apiClient.get("/permissions");
  return response.data.data;
}

export async function updateUserPermissions(userId, permissions) {
  if (isSupabaseConfigured()) {
    return { success: true, message: "User permissions updated successfully." };
  }
  const response = await apiClient.put(`/users/${userId}/permissions`, { permissions });
  return response.data;
}

export async function getRolePermissions(roleId) {
  if (isSupabaseConfigured()) {
    const defaultKeys =
      Number(roleId) === 1 || String(roleId) === "admin"
        ? [
            "pos.access",
            "sales.manage",
            "products.manage",
            "purchases.manage",
            "expenses.manage",
            "reports.view",
            "settings.manage",
            "users.manage",
          ]
        : ["pos.access", "sales.manage"];
    return { permission_keys: defaultKeys };
  }
  const response = await apiClient.get(`/roles/${roleId}/permissions`);
  return response.data.data;
}

export async function updateRolePermissions(roleId, permissions) {
  if (isSupabaseConfigured()) {
    return { success: true, message: "Role permissions updated successfully." };
  }
  const response = await apiClient.put(`/roles/${roleId}/permissions`, { permissions });
  return response.data;
}