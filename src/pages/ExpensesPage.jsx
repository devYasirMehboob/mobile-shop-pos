import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  createExpense,
  exportExpenses,
  getExpense,
  getExpenses,
  getExpenseSummary,
  updateExpense,
  voidExpense,
} from "../api/expensesApi";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import ExpenseCategoriesManager from "../components/expenses/ExpenseCategoriesManager";
import ExpenseDetailsModal from "../components/expenses/ExpenseDetailsModal";
import ExpenseForm from "../components/expenses/ExpenseForm";
import { formatCurrency, formatDate } from "../utils/calculateSaleTotals";
import usePermissions from "../hooks/usePermissions";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";

const initialFilters = {
  search: "",
  category_id: "all",
  payment_method: "all",
  status: "all",
  date_from: "",
  date_to: "",
  page: 1,
  limit: 10,
};

function ExpensesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();
  const canManage = can("expenses.manage");
  const alert = useAlert();

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [data, setData] = useState({
    expenses: [],
    pagination: null,
    summary: {
      total_amount: 0,
      today_amount: 0,
      month_amount: 0,
      expense_count: 0,
    },
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync URL routes with modal states
  useEffect(() => {
    const path = location.pathname;
    if (path === "/expenses/create" || path === "/expenses/new") {
      setEditing(null);
      setFormOpen(true);
      setDetails(null);
      setCategoriesOpen(false);
    } else if (path === "/expenses/categories") {
      setCategoriesOpen(true);
      setFormOpen(false);
      setDetails(null);
    } else if (path.startsWith("/expenses/") && path.endsWith("/edit")) {
      const editId = Number(path.split("/")[2]);
      if (editId) {
        getExpense(editId)
          .then((res) => {
            setEditing(res.expense || res);
            setFormOpen(true);
            setDetails(null);
            setCategoriesOpen(false);
          })
          .catch(() => {
            navigate("/expenses");
          });
      }
    } else if (
      path.startsWith("/expenses/") &&
      !path.includes("/categories") &&
      !path.includes("/create") &&
      !path.includes("/new")
    ) {
      const viewId = Number(path.split("/")[2]);
      if (viewId) {
        getExpense(viewId)
          .then((res) => {
            setDetails(res.expense || res);
            setFormOpen(false);
            setCategoriesOpen(false);
          })
          .catch(() => {
            navigate("/expenses");
          });
      }
    } else if (path === "/expenses") {
      setFormOpen(false);
      setCategoriesOpen(false);
      setEditing(null);
      setDetails(null);
    }
  }, [location.pathname, navigate]);

  const loadData = useCallback(
    async (f, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setLoading(true);
      try {
        const res = await getExpenses(f);
        setData({
          expenses: res.expenses || [],
          categories: res.categories || [],
          summary: res.summary || {
            total_amount: 0,
            today_amount: 0,
            month_amount: 0,
            expense_count: 0,
          },
          pagination: res.pagination || {
            page: 1,
            limit: 10,
            total: (res.expenses || []).length,
            total_pages: Math.ceil((res.expenses || []).length / 10) || 1,
          },
        });
        setAppliedFilters(f);
      } catch (e) {
        alert.error(normalizeApiError(e).message);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [alert]
  );

  useEffect(() => {
    document.title = "Expenses | BiteBlix POS";
    loadData(initialFilters);
  }, [loadData]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, search: val, page: 1 }));
    loadData({ ...appliedFilters, search: val, page: 1 });
  }

  function handleCategoryFilter(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, category_id: val, page: 1 }));
    loadData({ ...appliedFilters, category_id: val, page: 1 });
  }

  function handleStatusFilter(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, status: val, page: 1 }));
    loadData({ ...appliedFilters, status: val, page: 1 });
  }

  function changePage(page) {
    const nextFilters = { ...appliedFilters, page };
    setFilters(nextFilters);
    loadData(nextFilters);
  }

  function changeLimit(limit) {
    const nextFilters = { ...appliedFilters, limit: Number(limit), page: 1 };
    setFilters(nextFilters);
    loadData(nextFilters);
  }

  function toggleSelectAll() {
    if (selectedIds.size === data.expenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.expenses.map((e) => e.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleSaveExpense(values) {
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateExpense(editing.id, values);
        alert.success("Expense updated successfully.");
      } else {
        await createExpense(values);
        alert.success("Expense created successfully.");
      }
      setFormOpen(false);
      setEditing(null);
      navigate("/expenses");
      loadData(appliedFilters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVoid(expense) {
    if (!window.confirm(`Are you sure you want to void expense "${expense.title}"?`)) {
      return;
    }
    try {
      await voidExpense(expense.id);
      alert.success("Expense marked as voided.");
      loadData(appliedFilters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTIONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Expenses
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-bold">Expenses</span>
          </nav>
        </div>

        {/* Top Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh */}
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => loadData(appliedFilters, true)}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Refresh List"
          >
            <Icon
              name="refresh"
              className={`size-4 ${isRefreshing ? "animate-spin text-[#FF9F43]" : ""}`}
            />
          </button>

          {/* Manage Categories */}
          <button
            type="button"
            onClick={() => navigate("/expenses/categories")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Icon name="tag" className="size-3.5 text-slate-500" />
            <span>Categories</span>
          </button>

          {/* + Add Expense Button */}
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              navigate("/expenses/create");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
          >
            <Icon name="plus" className="size-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </section>

      {/* 2. TOP 4 DYNAMIC METRIC CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Expenses</span>
            <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600 text-xs font-black">
              💸
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0B1E38] tracking-tight">
            {formatCurrency(data.summary.total_amount)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Cumulative Store Outflow
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Today's Expenses</span>
            <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600 text-xs font-black">
              📅
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 tracking-tight">
            {formatCurrency(data.summary.today_amount)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Recorded for Today
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">This Month</span>
            <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-black">
              📊
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600 tracking-tight">
            {formatCurrency(data.summary.month_amount)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Current Month Total
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Expense Records</span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
              🧾
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#FF9F43] tracking-tight">
            {data.summary.expense_count}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Total Entries
          </span>
        </div>
      </section>

      {/* 3. MAIN TABLE CONTAINER */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5">
          <div className="relative w-full sm:max-w-xs">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search Expense Title, Note, Ref..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* Category Filter */}
            <select
              value={filters.category_id}
              onChange={handleCategoryFilter}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
            >
              <option value="all">All Categories ⌄</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={handleStatusFilter}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="voided">Voided</option>
            </select>
          </div>
        </div>

        {/* Table / Empty State */}
        {loading ? (
          <div className="py-16">
            <LoadingState label="Loading expenses..." />
          </div>
        ) : data.expenses.length === 0 ? (
          <EmptyState
            icon="expenses"
            title="No expenses recorded"
            description="Add utility bills, rent, salaries, or shop maintenance costs."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                      checked={data.expenses.length > 0 && selectedIds.size === data.expenses.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5">Expense Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5">Payment Method</th>
                  <th className="px-4 py-3.5">Reference #</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {data.expenses.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const isVoided = row.status === "voided";

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? "bg-orange-50/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(row.id)}
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <strong className="block text-slate-900 font-extrabold">
                          {row.title}
                        </strong>
                        {row.description && (
                          <span className="block text-[11px] text-slate-400 max-w-[240px] truncate font-normal">
                            {row.description}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 font-bold">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                          {row.category_name}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(row.expense_date)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-rose-600 text-sm">
                        {formatCurrency(row.amount)}
                      </td>

                      <td className="px-4 py-3.5 capitalize text-slate-600 font-bold">
                        {(row.payment_method || "cash").replaceAll("_", " ")}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                        {row.reference_number || "—"}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isVoided ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-500">
                            Voided
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700 border border-emerald-200/60">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/expenses/${row.id}`)}
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                            title="View Details"
                          >
                            <Icon name="eye" className="size-3.5" />
                          </button>

                          {!isVoided && (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate(`/expenses/${row.id}/edit`)}
                                className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                                title="Edit Expense"
                              >
                                <Icon name="edit" className="size-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleVoid(row)}
                                className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                                title="Void Expense"
                              >
                                <Icon name="trash" className="size-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. FOOTER PAGINATION */}
        {!loading && data.expenses.length > 0 && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
              <span>Rows per page</span>
              <select
                value={data.pagination?.limit || 10}
                onChange={(e) => changeLimit(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span>of {data.pagination?.total || data.expenses.length} records</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={(data.pagination?.page || 1) <= 1}
                onClick={() => changePage((data.pagination?.page || 1) - 1)}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                aria-label="Previous Page"
              >
                ‹
              </button>

              <span className="px-2 font-bold text-slate-700">
                Page {data.pagination?.page || 1} of {data.pagination?.total_pages || 1}
              </span>

              <button
                type="button"
                disabled={(data.pagination?.page || 1) >= (data.pagination?.total_pages || 1)}
                onClick={() => changePage((data.pagination?.page || 1) + 1)}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                aria-label="Next Page"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ADD / EDIT EXPENSE MODAL */}
      <ExpenseForm
        isOpen={formOpen}
        expense={editing}
        categories={data.categories}
        isSubmitting={isSubmitting}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          navigate("/expenses");
        }}
        onSubmit={handleSaveExpense}
        onOpenCategories={() => {
          setFormOpen(false);
          navigate("/expenses/categories");
        }}
      />

      {/* EXPENSE DETAILS MODAL */}
      <ExpenseDetailsModal
        isOpen={Boolean(details)}
        expense={details}
        onClose={() => {
          setDetails(null);
          navigate("/expenses");
        }}
        onEdit={(exp) => {
          setDetails(null);
          navigate(`/expenses/${exp.id}/edit`);
        }}
        onVoid={(exp) => {
          setDetails(null);
          navigate("/expenses");
          handleVoid(exp);
        }}
      />

      {/* CATEGORIES MANAGER MODAL */}
      <ExpenseCategoriesManager
        isOpen={categoriesOpen}
        onClose={() => {
          setCategoriesOpen(false);
          navigate("/expenses");
          loadData(appliedFilters);
        }}
      />
    </div>
  );
}

export default ExpensesPage;
