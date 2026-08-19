import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getCsrfToken() {
  if (isSupabaseConfigured()) {
    return "supabase-session-" + Math.random().toString(36).substring(2);
  }
  const response = await apiClient.get("/csrf-token");
  return response.data.data.csrfToken;
}

export async function loginUser(email, password) {
  if (isSupabaseConfigured()) {
    // Call Supabase RPC function for direct secure authentication
    const { data, error } = await supabase.rpc("verify_user_login_rpc", {
      p_email: email,
      p_password: password,
    });

    if (error) {
      throw new Error(error.message || "Failed to authenticate with Supabase.");
    }

    if (!data?.success) {
      throw new Error(data?.message || "Invalid credentials.");
    }

    // Save session in local storage
    localStorage.setItem("mobile_pos_user", JSON.stringify(data.data.user));
    return data.data;
  }

  const response = await apiClient.post("/auth/login", { email, password });
  return response.data.data;
}

export async function getCurrentUser() {
  if (isSupabaseConfigured()) {
    const cached = localStorage.getItem("mobile_pos_user");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  }

  const response = await apiClient.get("/auth/me");
  return response.data.data.user;
}

export async function logoutUser() {
  if (isSupabaseConfigured()) {
    localStorage.removeItem("mobile_pos_user");
    await supabase.auth.signOut().catch(() => {});
    return;
  }

  await apiClient.post("/auth/logout");
}
