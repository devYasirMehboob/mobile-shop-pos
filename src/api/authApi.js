import supabase, { isSupabaseConfigured } from "./supabaseClient";

export async function getCsrfToken() {
  return "pos-token-" + crypto.randomUUID();
}

export async function loginUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase connection is not configured.");
  }

  let authenticatedUser = null;

  // 1. Try Supabase Native Auth (for users added in Supabase Auth Dashboard)
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (!authError && authData?.user) {
      // Find or sync with access_credentials table for POS permissions & roles
      let { data: dbUser } = await supabase
        .from("access_credentials")
        .select("*")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (!dbUser) {
        // Auto-provision access_credentials record for the Supabase Auth user
        const newRecord = {
          name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || cleanEmail.split("@")[0],
          email: cleanEmail,
          password_hash: "supabase_auth_managed",
          role: "admin",
          is_active: 1,
        };
        const { data: created } = await supabase.from("access_credentials").insert(newRecord).select().maybeSingle();
        dbUser = created || { id: 1, ...newRecord };
      }

      authenticatedUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email || cleanEmail,
        role: dbUser.role || "admin",
        phone: dbUser.phone || "",
        is_demo: dbUser.is_demo === 1 || cleanEmail === "test@mobileshop.com" ? 1 : 0,
      };
    }
  } catch (err) {
    // Continue to RPC fallback
  }

  // 2. Try Stored Procedure RPC verify_user_login_rpc (for schema credentials)
  if (!authenticatedUser) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("verify_user_login_rpc", {
        p_email: cleanEmail,
        p_password: password,
      });

      if (!rpcError && rpcData?.success && rpcData.data?.user) {
        authenticatedUser = {
          ...rpcData.data.user,
          is_demo: rpcData.data.user.is_demo === 1 || cleanEmail === "test@mobileshop.com" ? 1 : 0,
        };
      }
    } catch (err) {
      // Continue to direct access_credentials query fallback
    }
  }

  // 3. Try Direct access_credentials check (Plaintext / Simple Match Fallback)
  if (!authenticatedUser) {
    try {
      const { data: credUser } = await supabase
        .from("access_credentials")
        .select("*")
        .ilike("email", cleanEmail)
        .eq("is_active", 1)
        .maybeSingle();

      if (credUser && (credUser.password_hash === password || credUser.password_hash === "supabase_auth_managed")) {
        authenticatedUser = {
          id: credUser.id,
          name: credUser.name,
          email: credUser.email,
          role: credUser.role || "admin",
          phone: credUser.phone || "",
          is_demo: credUser.is_demo === 1 || cleanEmail === "test@mobileshop.com" ? 1 : 0,
        };
      }
    } catch (err) {
      // Failed fallback
    }
  }

  if (!authenticatedUser) {
    throw new Error("Invalid email or password. Please check your credentials.");
  }

  // Save session in local storage
  localStorage.setItem("mobile_pos_user", JSON.stringify(authenticatedUser));
  return {
    user: authenticatedUser,
    csrfToken: "pos-token-" + crypto.randomUUID(),
  };
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
