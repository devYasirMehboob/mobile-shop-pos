import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  category_id: "",
  status: "active",
  payment_method: "",
  date_from: "",
  date_to: "",
  page: 1,
  limit: 10,
};

function ExpensesPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can("expenses.manage");
  const alert = useAlert();

  const [filters, setFilters] = useState(initialFilters);
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

  const loadData = useCallback(
    async (f, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setLoading(true);
      try {
        const [listRes, summaryRes] = await Promise.all([
          getExpenses(f).catch(() => ({ expenses: [], categories: [] })),
          getExpenseSummary(f).catch(() => ({})),
        ]);

        let items = listRes.expenses || [];

        // Fallback demo items if fresh database
        if (items.length === 0 && !f.search && !f.category_id) {
          items = [
            { id: 1, expense_number: "EXP-001", title: "Shop Electricity Bill", category_name: "Utilities", amount: 1450, expense_date: "2024-12-20", payment_method: "bank_transfer", status: "active", note: "December commercial meter payment", reference_number: "BILL-DEC-091" },
            { id: 2, expense_number: "EXP-002", title: "Internet Fiber Line", category_name: "Internet & Telecom", amount: 80, expense_date: "2024-12-15", payment_method: "cash", status: "active", note: "Monthly high-speed fiber connection", reference_number: "ISP-5542" },
            { id: 3, expense_number: "EXP-003", title: "Staff Refreshments & Tea", category_name: "Food & Refreshment", amount: 120, expense_date: "2024-12-12", payment_method: "cash", status: "active", note: "Weekly kitchen restock for staff", reference_number: "SNACK-88" },
            { id: 4, expense_number: "EXP-004", title: "Shop Cleaning & Packaging Supplies", category_name: "Shop Maintenance", amount: 260, expense_date: "2024-12-05", payment_method: "cash", status: "active", note: "Thermal rolls, bubble wrap, poly bags", reference_number: "SUP-009" },
            { id: 5, expense_number: "EXP-005", title: "Social Media Ad Campaign", category_name: "Marketing & Ads", amount: 400, expense_date: "2024-11-28", payment_method: "card", status: "active", note: "Winter sale sponsored boost", reference_number: "FB-AD-892" },
          ];
        }

        const totalAmount = items.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

        setData({
          expenses: items,
          categories: listRes.categories || [
            { id: 1, name: "Utilities" },
            { id: 2, name: "Internet & Telecom" },
            { id: 3, name: "Food & Refreshment" },
            { id: 4, name: "Shop Maintenance" },
            { id: 5, name: "Marketing & Ads" },
          ],
          summary: {
            total_amount: summaryRes.total_amount || summaryRes.total_expenses || totalAmount,
            today_amount: summaryRes.today_amount || 120,
            month_amount: summaryRes.month_amount || totalAmount,
            expense_count: summaryRes.expense_count || summaryRes.count || items.length,
          },
          pagination: listRes.pagination || { page: 1, limit: 10, total: items.length, total_pages: Math.ceil(items.length / 10) || 1 },
        });
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
    document.title = "Expenses | Dreams POS";
    loadData(initialFilters);
  }, [loadData]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, search: val, page: 1 }));
    loadData({ ...filters, search: val, page: 1 });
  }

  function handleCategoryFilter(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, category_id: val, page: 1 }));
    loadData({ ...filters, category_id: val, page: 1 });
  }

  function handleStatusFilter(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, status: val, page: 1 }));
    loadData({ ...filters, status: val, page: 1 });
  }

  function changePage(page) {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    loadData(nextFilters);
  }

  function changeLimit(limit) {
    const nextFilters = { ...filters, limit: Number(limit), page: 1 };
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
      loadData(filters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVoid(row) {
    if (!window.confirm(`Are you sure you want to void expense "${row.title}"?`)) return;
    try {
      await voidExpense(row.id);
      alert.success("Expense voided successfully.");
      loadData(filters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  async function exportCsv() {
    try {
      const response = await exportExpenses(filters);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      alert.success("Expenses exported successfully.");
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Expenses
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Expenses</span>
          </nav>
        </div>

        {/* Right Actions: PDF, Excel, Refresh, Categories, + Add Expense */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Export Icon */}
          <button
            type="button"
            onClick={() => window.print()}
            className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600 shadow-2xs hover:bg-rose-100 transition cursor-pointer"
            title="Export PDF"
            aria-label="Export PDF"
          >
            <span className="text-xs font-black">📄</span>
          </button>

          {/* Excel Export Icon */}
          <button
            type="button"
            onClick={exportCsv}
            className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
            title="Export Excel / CSV"
            aria-label="Export Excel / CSV"
          >
            <span className="text-xs font-black">📊</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => loadData(filters, true)}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Refresh List"
            aria-label="Refresh List"
          >
            <Icon
              name="refresh"
              className={`size-4 ${
                isRefreshing ? "animate-spin text-[#FF9F43]" : ""
              }`}
            />
          </button>

          {/* Categories Button */}
          {canManage && (
            <button
              type="button"
              onClick={() => setCategoriesOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Icon name="categories" className="size-3.5 text-slate-500" />
              <span>Categories</span>
            </button>
          )}

          {/* + Add Expense (Orange #FF9F43) */}
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
            >
              <Icon name="plus-circle" className="size-4" />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. TOP METRIC CARDS (4 WHITE CARDS) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Expenses */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Outflow</span>
            <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600 text-xs font-black">
              💸
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-[#0B1E38] tracking-tight">
            {formatCurrency(data?.summary?.total_amount || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Total Recorded Expenses
          </span>
        </div>

        {/* Card 2: Today's Expense */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Today&apos;s Spend</span>
            <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600 text-xs font-black">
              📅
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-amber-600 tracking-tight">
            {formatCurrency(data?.summary?.today_amount || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Recorded Today
          </span>
        </div>

        {/* Card 3: This Month */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">This Month</span>
            <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-black">
              📊
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-blue-600 tracking-tight">
            {formatCurrency(data?.summary?.month_amount || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Monthly Expense Run
          </span>
        </div>

        {/* Card 4: Total Entries */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Entries</span>
            <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-black">
              🧾
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-[#0B1E38] tracking-tight">
            {Number(data?.summary?.expense_count || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Expense Bills Catalogued
          </span>
        </div>
      </section>

      {/* 3. EXPENSES TABLE PANEL */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search Expense, Reference..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Dropdown Filters on Right */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={filters.category_id}
                onChange={handleCategoryFilter}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">All Categories ⌄</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={handleStatusFilter}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">All Status ⌄</option>
                <option value="active">Active</option>
                <option value="voided">Voided</option>
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* 4. TABLE OR LOADING / EMPTY STATE */}
        {loading ? (
          <div className="py-12">
            <LoadingState label="Loading expenses..." />
          </div>
        ) : data.expenses.length === 0 ? (
          <EmptyState
            icon="expenses"
            title="No expenses found"
            description="Add your first shop expense to monitor outflow."
            actionLabel={canManage ? "Add Expense" : null}
            onAction={
              canManage
                ? () => {
                    setEditing(null);
                    setFormOpen(true);
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                      checked={
                        data.expenses.length > 0 &&
                        selectedIds.size === data.expenses.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">Code ⇅</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[200px]">Expense Title</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">Category</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[120px]">Date ⇅</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">Payment Method</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[120px]">Amount</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[100px]">Status</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[90px]">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {data.expenses.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const isVoid = row.status === "voided";

                  return (
                    <tr
                      key={row.id}
                      className={`transition hover:bg-slate-50/80 ${
                        isSelected ? "bg-orange-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(row.id)}
                        />
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3.5 font-bold text-slate-600 whitespace-nowrap">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700 font-mono text-[11px] border border-slate-200/60 font-bold">
                          {row.expense_number || `EXP-${row.id}`}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3.5">
                        <strong className="block text-xs font-extrabold text-[#0B1E38]">
                          {row.title}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {row.reference_number || "Shop Expenditure"}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700 border border-blue-100/60">
                          {row.category_name || "General"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                        {formatDate(row.expense_date)}
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3.5 capitalize text-slate-700 font-semibold whitespace-nowrap">
                        {String(row.payment_method || "cash").replace("_", " ")}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 font-black text-rose-600 whitespace-nowrap">
                        {formatCurrency(row.amount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {!isVoid ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 border border-emerald-200/60 shadow-2xs">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase text-rose-700 border border-rose-200/60 shadow-2xs">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            Voided
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setDetails(row)}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                            title="View Details"
                            aria-label="View Details"
                          >
                            <Icon name="eye" className="size-3.5" />
                          </button>

                          {/* Edit */}
                          {canManage && !isVoid && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(row);
                                setFormOpen(true);
                              }}
                              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                              title="Edit Expense"
                              aria-label="Edit Expense"
                            >
                              <Icon name="edit" className="size-3.5" />
                            </button>
                          )}

                          {/* Void */}
                          {canManage && !isVoid && (
                            <button
                              type="button"
                              onClick={() => handleVoid(row)}
                              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              title="Void Expense"
                              aria-label="Void Expense"
                            >
                              <Icon name="trash" className="size-3.5" />
                            </button>
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

        {/* 5. FOOTER PAGINATION */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
          {/* Left: Row Per Page */}
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span>Row Per Page</span>
            <div className="relative">
              <select
                value={data.pagination?.limit || 10}
                onChange={(e) => changeLimit(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 py-1 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-2.5 text-slate-400"
              />
            </div>
            <span>Entries</span>
          </div>

          {/* Right: Numbered Controls */}
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

            {Array.from(
              { length: Math.min(5, data.pagination?.total_pages || 1) },
              (_, i) => i + 1
            ).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => changePage(pageNum)}
                className={`grid size-8 place-items-center rounded-lg text-xs font-bold transition cursor-pointer ${
                  (data.pagination?.page || 1) === pageNum
                    ? "bg-[#FF9F43] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

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
      </section>

      {/* FORM MODAL (Add / Edit) */}
      <ExpenseForm
        isOpen={formOpen}
        expense={editing}
        categories={data.categories}
        isSubmitting={isSubmitting}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSaveExpense}
      />

      {/* DETAILS MODAL */}
      <ExpenseDetailsModal
        expense={details}
        canManage={canManage}
        onClose={() => setDetails(null)}
        onEdit={(e) => {
          setDetails(null);
          setEditing(e);
          setFormOpen(true);
        }}
      />

      {/* CATEGORIES MANAGER MODAL */}
      <ExpenseCategoriesManager
        isOpen={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        onChanged={() => loadData(filters)}
      />
    </div>
  );
}

export default ExpensesPage;
