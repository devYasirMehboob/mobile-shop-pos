import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const dataOf = (response) => response.data?.data || response.data;

export async function getExpenses(params = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from("expenses")
      .select("*, expense_categories:expense_category_id (name)", { count: "exact" })
      .order("expense_date", { ascending: false });

    if (params.category_id && params.category_id !== "all") {
      query = query.eq("expense_category_id", Number(params.category_id));
    }
    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    if (params.payment_method && params.payment_method !== "all") {
      query = query.eq("payment_method", params.payment_method);
    }
    if (params.date_from) {
      query = query.gte("expense_date", params.date_from);
    }
    if (params.date_to) {
      query = query.lte("expense_date", params.date_to);
    }
    if (params.search) {
      query = query.or(
        `title.ilike.%${params.search}%,description.ilike.%${params.search}%,reference_number.ilike.%${params.search}%`
      );
    }

    const { data: list, count, error } = await query;
    if (error) throw new Error(error.message);

    const formatted = (list || []).map((e) => ({
      ...e,
      category_name: e.expense_categories?.name || "General",
      expense_number: `EXP-${String(e.id).padStart(4, "0")}`,
    }));

    // Calculate Summary
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthStr = todayStr.slice(0, 7);

    const totalAmount = formatted.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const todayAmount = formatted
      .filter((e) => e.expense_date === todayStr)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const monthAmount = formatted
      .filter((e) => (e.expense_date || "").startsWith(monthStr))
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const { data: categoriesList } = await supabase
      .from("expense_categories")
      .select("id, name")
      .order("name", { ascending: true });

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const total = count ?? formatted.length;
    const paginated = formatted.slice((page - 1) * limit, page * limit);

    return {
      expenses: paginated,
      all_expenses: formatted,
      total,
      categories: categoriesList || [],
      summary: {
        total_amount: totalAmount,
        today_amount: todayAmount,
        month_amount: monthAmount,
        expense_count: total,
      },
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  return dataOf(await apiClient.get("/expenses", { params }));
}

export async function getExpenseSummary(params = {}) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount, status, expense_date")
      .eq("status", "active");

    if (error) throw new Error(error.message);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthStr = todayStr.slice(0, 7);

    const list = data || [];
    const total = list.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const today = list
      .filter((e) => e.expense_date === todayStr)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const month = list
      .filter((e) => (e.expense_date || "").startsWith(monthStr))
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    return {
      total_amount: total,
      today_amount: today,
      month_amount: month,
      total_expenses: total,
      count: list.length,
    };
  }

  return dataOf(await apiClient.get("/expenses/summary", { params }));
}

export async function getExpense(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expenses")
      .select("*, expense_categories:expense_category_id (name)")
      .eq("id", Number(id))
      .single();

    if (error) throw new Error(error.message);
    return {
      ...data,
      category_name: data.expense_categories?.name || "General",
      expense_number: `EXP-${String(data.id).padStart(4, "0")}`,
    };
  }

  return dataOf(await apiClient.get(`/expenses/${id}`)).expense;
}

export async function createExpense(values) {
  if (isSupabaseConfigured()) {
    const insertData = {
      expense_category_id: Number(values.expense_category_id || values.category_id),
      title: values.title,
      amount: parseFloat(values.amount || 0),
      expense_date: values.expense_date || new Date().toISOString().split("T")[0],
      description: values.description || values.note || "",
      payment_method: values.payment_method || "cash",
      reference_number: values.reference_number || null,
      added_by: values.added_by || 1,
      status: "active",
    };

    const { data, error } = await supabase
      .from("expenses")
      .insert([insertData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Expense recorded successfully.", data };
  }

  const body = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined) body.append(key, value);
  });
  return (await apiClient.post("/expenses", body, { headers: { "Content-Type": undefined } })).data;
}

export async function updateExpense(id, values) {
  if (isSupabaseConfigured()) {
    const updateData = {
      expense_category_id: Number(values.expense_category_id || values.category_id),
      title: values.title,
      amount: parseFloat(values.amount || 0),
      expense_date: values.expense_date,
      description: values.description || values.note || "",
      payment_method: values.payment_method || "cash",
      reference_number: values.reference_number || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Expense updated successfully.", data };
  }

  const body = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined) body.append(key, value);
  });
  return (await apiClient.post(`/expenses/${id}`, body, { headers: { "Content-Type": undefined } })).data;
}

export async function voidExpense(id, reason = "") {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expenses")
      .update({
        status: "voided",
        voided_at: new Date().toISOString(),
        voided_by: 1,
      })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Expense marked as voided.", data };
  }

  return (await apiClient.post(`/expenses/${id}/void`, { reason })).data;
}

export async function getExpenseCategories() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  return dataOf(await apiClient.get("/expense-categories"));
}

export async function createExpenseCategory(values) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expense_categories")
      .insert([
        {
          name: values.name,
          description: values.description || "",
          status: "active",
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Expense category created.", data };
  }

  return (await apiClient.post("/expense-categories", values)).data;
}

export async function updateExpenseCategory(id, values) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expense_categories")
      .update({
        name: values.name,
        description: values.description || "",
      })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Category updated.", data };
  }

  return (await apiClient.put(`/expense-categories/${id}`, values)).data;
}

export async function updateExpenseCategoryStatus(id, status) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("expense_categories")
      .update({ status })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, message: "Category status updated.", data };
  }

  return (await apiClient.patch(`/expense-categories/${id}/status`, { status })).data;
}

export async function deleteExpenseCategory(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from("expense_categories")
      .delete()
      .eq("id", Number(id));

    if (error) throw new Error(error.message);
    return { success: true, message: "Category deleted." };
  }

  return (await apiClient.delete(`/expense-categories/${id}`)).data;
}

export async function exportExpenses(params = {}) {
  return apiClient.get("/expenses/export", { params, responseType: "blob" });
}
