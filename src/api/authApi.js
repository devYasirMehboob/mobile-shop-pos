import supabase from "./supabaseClient";

export async function getCsrfToken() {
  return "pos-token-" + crypto.randomUUID();
}

export async function loginUser(email, password) {
  // Call Supabase RPC function for direct secure authentication
  const { data, error } = await supabase.rpc("verify_user_login_rpc", {
    p_email: email.trim().toLowerCase(),
    p_password: password,
  });

  if (error) {
    throw new Error(error.message || "Failed to authenticate with Supabase database.");
  }

  if (!data || !data.success) {
    throw new Error(data?.message || "Invalid email or password. Access denied.");
  }

  // Save session in local storage
  localStorage.setItem("mobile_pos_user", JSON.stringify(data.data.user));
  return data.data;
}

export async function getCurrentUser() {
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

export async function logoutUser() {
  localStorage.removeItem("mobile_pos_user");
  sessionStorage.removeItem("csrfToken");
  await supabase.auth.signOut().catch(() => {});
}
