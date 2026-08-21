import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const dataOf = (response) => response.data.data;

export async function getExpenses(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("expenses")
      .select("*, expense_categories:expense_category_id (name)")
      .order("expense_date", { ascending: false });

    if (params.category_id) query = query.eq("expense_category_id", params.category_id);
    if (params.status) query = query.eq("status", params.status);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (data || []).map((e) => ({
      ...e,
      category_name: e.expense_categories?.name || "General",
    }));

    const { data: categoriesList } = await supabase
      .from("expense_categories")
      .select("id, name")
      .order("name", { ascending: true });

    return {
      expenses: formatted,
      total: formatted.length,
      categories: categoriesList || [],
      pagination: {
        page: 1,
        per_page: formatted.length,
        total: formatted.length,
        total_pages: 1,
      },
    };
  }

  return dataOf(await apiClient.get("/expenses", { params }));
}

export async function getExpenseSummary(params = {}) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("expenses").select("amount, status").eq("status", "active");
    if (error) throw new Error(error.message);

    const total = (data || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    return { total_expenses: total, count: (data || []).length };
  }

  return dataOf(await apiClient.get("/expenses/summary", { params }));
}

export async function getExpense(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expenses")
      .select("*, expense_categories:expense_category_id (name)")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return { ...data, category_name: data.expense_categories?.name || "General" };
  }

  return dataOf(await apiClient.get(`/expenses/${id}`)).expense;
}

function formData(values) {
  const body = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined) body.append(key, value);
  });
  return body;
}

export async function createExpense(values) {
  if (isSupabaseConfigured()) {
    const insertData = {
      expense_category_id: values.expense_category_id || values.category_id,
      title: values.title,
      amount: values.amount,
      expense_date: values.expense_date || new Date().toISOString().split("T")[0],
      description: values.description || "",
      payment_method: values.payment_method || "cash",
      added_by: values.added_by || 1,
      status: "active",
    };

    const { data, error } = await supabase.from("expenses").insert([insertData]).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Expense recorded successfully.", data };
  }

  return (await apiClient.post("/expenses", formData(values), { headers: { "Content-Type": undefined } })).data;
}

export async function updateExpense(id, values) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expenses")
      .update({
        title: values.title,
        amount: values.amount,
        expense_date: values.expense_date,
        description: values.description,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Expense updated.", data };
  }

  return (await apiClient.post(`/expenses/${id}`, formData(values), { headers: { "Content-Type": undefined, "X-HTTP-Method-Override": "PUT" } })).data;
}

export async function voidExpense(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expenses")
      .update({ status: "voided", voided_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Expense voided.", data };
  }

  return (await apiClient.delete(`/expenses/${id}`)).data;
}

export async function exportExpenses(params = {}) {
  return apiClient.get("/expenses/export", { params, responseType: "blob" });
}

export async function getExpenseCategories(search = "") {
  if (isSupabaseConfigured()) {
    let query = supabase.from("expense_categories").select("*").order("name", { ascending: true });
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  return dataOf(await apiClient.get("/expense-categories", { params: search ? { search } : {} })).categories;
}

export async function createExpenseCategory(values) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("expense_categories").insert([values]).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Expense category created.", data };
  }

  return (await apiClient.post("/expense-categories", values)).data;
}

export async function updateExpenseCategory(id, values) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("expense_categories").update(values).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Expense category updated.", data };
  }

  return (await apiClient.put(`/expense-categories/${id}`, values)).data;
}

export async function updateExpenseCategoryStatus(id, status) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("expense_categories").update({ status }).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { success: true, message: "Category status updated.", data };
  }

  return (await apiClient.patch(`/expense-categories/${id}/status`, { status })).data;
}

export async function deleteExpenseCategory(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("expense_categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true, message: "Category deleted.", data };
  }

  return (await apiClient.delete(`/expense-categories/${id}`)).data;
}

export function receiptUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
  return `${base}/${path}`;
}
