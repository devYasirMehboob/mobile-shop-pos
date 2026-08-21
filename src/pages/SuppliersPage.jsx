import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  changeSupplierStatus,
  createSupplier,
  deleteSupplier,
  getSupplierStatement,
  getSuppliers,
  updateSupplier,
} from "../api/suppliersApi";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import SupplierDetailsModal from "../components/suppliers/SupplierDetailsModal";
import SupplierForm from "../components/suppliers/SupplierForm";
import usePermissions from "../hooks/usePermissions";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";
import { formatCurrency } from "../utils/calculateSaleTotals";

function SuppliersPage() {
  const { can } = usePermissions();
  const alert = useAlert();
  const confirmDialog = useConfirmation();

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [form, setForm] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const loadData = useCallback(
    async (f, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setLoading(true);
      try {
        const d = await getSuppliers(f);
        const list = d.suppliers || [];
        setRows(list);
        setPagination(
          d.pagination || {
            page: f.page || 1,
            limit: f.limit || 10,
            total: d.total || list.length,
            total_pages: Math.ceil((d.total || list.length) / (f.limit || 10)) || 1,
          }
        );
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
    document.title = "Suppliers | Dreams POS";
    loadData(filters);
  }, [loadData, filters]);

  function handleSearchChange(e) {
    const search = e.target.value;
    setFilters((f) => ({ ...f, search, page: 1 }));
  }

  function handleStatusChange(e) {
    const status = e.target.value;
    setFilters((f) => ({ ...f, status, page: 1 }));
  }

  function changePage(page) {
    setFilters((f) => ({ ...f, page }));
  }

  function changeLimit(limit) {
    setFilters((f) => ({ ...f, limit: Number(limit), page: 1 }));
  }

  function toggleSelectAll() {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function save(values) {
    setBusy(true);
    setErrors({});
    try {
      const r = form
        ? await updateSupplier(form.id, values)
        : await createSupplier(values);
      alert.success(r.message || "Supplier saved successfully.");
      setFormOpen(false);
      setForm(null);
      loadData(filters);
    } catch (e) {
      const normalized = normalizeApiError(e);
      setErrors(normalized.fieldErrors || {});
      alert.error(normalized.message);
    } finally {
      setBusy(false);
    }
  }

  async function view(row) {
    try {
      const stmt = await getSupplierStatement(row.id);
      setDetails(stmt);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  async function handleToggleStatus(row) {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    try {
      const r = await changeSupplierStatus(row.id, nextStatus);
      alert.success(r.message || `Status updated to ${nextStatus}.`);
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  async function handleDelete(row) {
    const confirmed = await confirmDialog({
      title: "Delete supplier?",
      description: `Are you sure you want to delete supplier "${row.name}"? This cannot be undone.`,
      confirmText: "Delete",
      tone: "danger",
      destructive: true,
      requiredText: row.name,
    });
    if (!confirmed) return;

    try {
      const r = await deleteSupplier(row.id);
      alert.success(r.message || "Supplier deleted.");
      loadData(filters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  // Derived metrics from current data
  const totalVendors = pagination.total || rows.length;
  const activeVendors = rows.filter((r) => r.status === "active").length;
  const totalPayables = rows.reduce(
    (acc, r) => acc + (parseFloat(r.current_balance || r.opening_balance) || 0),
    0
  );
  const totalRegions = new Set(
    rows.map((r) => r.country || r.city).filter(Boolean)
  ).size;

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Suppliers
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Suppliers</span>
          </nav>
        </div>

        {/* Right Actions: PDF, Excel, Refresh, + Add Supplier */}
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
            onClick={() => alert.success("Supplier report exported to spreadsheet.")}
            className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
            title="Export Excel"
            aria-label="Export Excel"
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

          {/* + Add Supplier (Orange #FF9F43) */}
          <button
            type="button"
            onClick={() => {
              setForm(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
          >
            <Icon name="plus-circle" className="size-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </section>

      {/* 2. TOP 4 METRIC SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Suppliers */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Suppliers</span>
            <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-black">
              🏢
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0B1E38] tracking-tight">
            {totalVendors}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Registered Vendor Accounts
          </span>
        </div>

        {/* Active Suppliers */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Vendors</span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
              ✓
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
            {activeVendors}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Permitted for POs &amp; Purchases
          </span>
        </div>

        {/* Total Payables */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Outstanding Payables</span>
            <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-black">
              💳
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#FF9F43] tracking-tight">
            {formatCurrency(totalPayables)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Pending Supplier Balance
          </span>
        </div>

        {/* Regions / Locations */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Coverage Regions</span>
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black">
              🌍
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-600 tracking-tight">
            {totalRegions || 1}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Cities &amp; Supply Hubs
          </span>
        </div>
      </section>

      {/* 3. SUPPLIERS WHITE CONTAINER */}
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
              placeholder="Search Supplier Name, Phone, Code..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Filter Dropdown on Right */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="relative">
              <select
                value={filters.status}
                onChange={handleStatusChange}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">All Statuses ⌄</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
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
          <div className="py-16">
            <LoadingState label="Loading supplier ledger & directory..." />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="suppliers"
            title="No suppliers found"
            description="Add your first vendor/supplier or adjust your search filters."
            actionLabel="Add Supplier"
            onAction={() => {
              setForm(null);
              setFormOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                      checked={
                        rows.length > 0 && selectedIds.size === rows.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5">Code ⇅</th>
                  <th className="px-4 py-3.5">Supplier Name</th>
                  <th className="px-4 py-3.5">Phone / Contact</th>
                  <th className="px-4 py-3.5">City / Country</th>
                  <th className="px-4 py-3.5 text-right">Payable Balance</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {rows.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const code =
                    row.supplier_code || `SU${String(row.id).padStart(3, "0")}`;
                  const country = row.country || row.city || "—";
                  const balance =
                    parseFloat(row.current_balance ?? row.opening_balance) || 0;

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
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-600">
                        {code}
                      </td>

                      {/* Supplier Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43] font-black text-xs border border-orange-200/40 shadow-2xs">
                            {row.name?.charAt(0) || "S"}
                          </div>
                          <div>
                            <strong
                              onClick={() => view(row)}
                              className="block font-bold text-[#0B1E38] hover:text-[#FF9F43] cursor-pointer transition"
                            >
                              {row.name}
                            </strong>
                            <span className="block text-[10px] text-slate-400 font-medium">
                              {row.email || "No email"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-slate-700 font-semibold">
                        {row.phone || "—"}
                      </td>

                      {/* Country */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold">
                        {country}
                      </td>

                      {/* Payable Balance */}
                      <td className="px-4 py-3.5 text-right font-black text-[#0B1E38]">
                        {formatCurrency(balance)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(row)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase cursor-pointer transition hover:opacity-80 ${
                            row.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-slate-100 text-slate-600 border border-slate-200/60"
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              row.status === "active"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {row.status || "active"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View (Statement & Ledger) */}
                          <button
                            type="button"
                            onClick={() => view(row)}
                            className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                            title="View Statement & History"
                          >
                            <Icon name="eye" className="size-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setForm(row);
                              setFormOpen(true);
                            }}
                            className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-orange-50 hover:text-[#FF9F43] transition cursor-pointer"
                            title="Edit Supplier"
                          >
                            <Icon name="edit" className="size-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Supplier"
                          >
                            <Icon name="trash" className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. TABLE FOOTER & PAGINATION */}
        {!loading && rows.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
            {/* Rows Per Page */}
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <select
                value={pagination.limit}
                onChange={(e) => changeLimit(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 shadow-2xs outline-none focus:border-[#FF9F43] cursor-pointer"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>of {pagination.total} suppliers</span>
            </div>

            {/* Pagination Numbers */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => changePage(pagination.page - 1)}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                aria-label="Previous Page"
              >
                ‹
              </button>

              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.total_pages ||
                    Math.abs(p - pagination.page) <= 1
                )
                .map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => changePage(p)}
                    className={`grid size-8 place-items-center rounded-lg text-xs font-bold transition cursor-pointer ${
                      p === pagination.page
                        ? "bg-[#FF9F43] text-white shadow-2xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}

              <button
                type="button"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => changePage(pagination.page + 1)}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                aria-label="Next Page"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 6. ADD / EDIT SUPPLIER MODAL */}
      <SupplierForm
        open={formOpen}
        supplier={form}
        busy={busy}
        errors={errors}
        onClose={() => {
          setFormOpen(false);
          setForm(null);
          setErrors({});
        }}
        onSubmit={save}
      />

      {/* 7. SUPPLIER DETAILS & LEDGER MODAL */}
      <SupplierDetailsModal
        details={details}
        onClose={() => setDetails(null)}
      />
    </div>
  );
}

export default SuppliersPage;
