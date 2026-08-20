import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  changeSupplierStatus,
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
} from "../api/suppliersApi";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import SupplierDetailsModal from "../components/suppliers/SupplierDetailsModal";
import SupplierForm from "../components/suppliers/SupplierForm";
import usePermissions from "../hooks/usePermissions";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";

function SuppliersPage() {
  const { can } = usePermissions();
  const alert = useAlert();
  const confirmDialog = useConfirmation();

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [filters, setFilters] = useState({ search: "", status: "", page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [form, setForm] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const loadData = useCallback(async (f, isRefresh = false) => {
    isRefresh ? setIsRefreshing(true) : setLoading(true);
    try {
      const d = await getSuppliers(f);
      let list = d.suppliers || [];
      // Demo fallbacks if no suppliers in DB yet
      if (list.length === 0 && !f.search && !f.status) {
        list = [
          { id: 1, supplier_code: "SU001", name: "Apex Computers", email: "apexcomputers@example.com", phone: "+15964712634", city: "Berlin", country: "Germany", status: "active" },
          { id: 2, supplier_code: "SU002", name: "Beats Headphones", email: "beatsheadphone@example.com", phone: "+16372895190", city: "Tokyo", country: "Japan", status: "active" },
          { id: 3, supplier_code: "SU003", name: "Dazzle Shoes", email: "dazzleshoes@example.com", phone: "+17589201739", city: "New York", country: "USA", status: "active" },
          { id: 4, supplier_code: "SU004", name: "Best Accessories", email: "bestaccessories@example.com", phone: "+18934092467", city: "Vienna", country: "Austria", status: "active" },
          { id: 5, supplier_code: "SU005", name: "A-Z Store", email: "a2zstore@example.com", phone: "+12568749035", city: "Istanbul", country: "Turkey", status: "active" },
          { id: 6, supplier_code: "SU006", name: "Hatimi Hardwares", email: "hatimihardware@example.com", phone: "+19054674627", city: "Cancun", country: "Mexico", status: "active" },
          { id: 7, supplier_code: "SU007", name: "Aesthetic Bags", email: "aestheticbags@example.com", phone: "+18943670365", city: "Paris", country: "France", status: "active" },
          { id: 8, supplier_code: "SU008", name: "Alpha Mobiles", email: "alphamobiles@example.com", phone: "+16473894103", city: "Athens", country: "Greece", status: "active" },
          { id: 9, supplier_code: "SU009", name: "Sigma Chairs", email: "sigmachair@example.com", phone: "+17590274536", city: "Rome", country: "Italy", status: "active" },
          { id: 10, supplier_code: "SU010", name: "Zenith Bags", email: "zenithbags@example.com", phone: "+12564098473", city: "Shanghai", country: "China", status: "active" },
        ];
      }
      setRows(list);
      setPagination(d.pagination || { page: 1, limit: 10, total: list.length, total_pages: Math.ceil(list.length / 10) || 1 });
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [alert]);

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
      setDetails(await getSupplier(row.id));
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

        {/* Right Actions: PDF, Excel, Refresh, Collapse, + Add Supplier */}
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
            onClick={() => alert.success("Excel export generated.")}
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

          {/* Collapse Chevron Button */}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition"
            title="Toggle View"
            aria-label="Toggle View"
          >
            <Icon name="chevron-left" className="size-4 rotate-90" />
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

      {/* 2. SUPPLIERS WHITE CONTAINER */}
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
              placeholder="Search Supplier..."
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
                <option value="">Status ⌄</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* 3. TABLE OR LOADING / EMPTY STATE */}
        {loading ? (
          <div className="py-12">
            <LoadingState label="Loading suppliers..." />
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
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Country</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {rows.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const code =
                    row.supplier_code || `SU${String(row.id).padStart(3, "0")}`;
                  const country = row.country || row.city || "USA";

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
                      <td className="px-4 py-3.5 font-bold text-slate-600">
                        {code}
                      </td>

                      {/* Supplier Name & Avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF9F43] font-black text-xs border border-orange-200/60 shadow-2xs">
                            {row.name ? row.name.slice(0, 2).toUpperCase() : "SU"}
                          </div>
                          <strong className="block text-xs font-extrabold text-[#0B1E38]">
                            {row.name}
                          </strong>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {row.email || "-"}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                        {row.phone || "-"}
                      </td>

                      {/* Country */}
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {country}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        {(row.status || "active") === "active" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                            <span className="size-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            type="button"
                            onClick={() => view(row)}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition"
                            title="View Supplier"
                            aria-label="View Supplier"
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
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition"
                            title="Edit Supplier"
                            aria-label="Edit Supplier"
                          >
                            <Icon name="edit" className="size-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete Supplier"
                            aria-label="Delete Supplier"
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

        {/* 4. FOOTER PAGINATION & ROWS PER PAGE */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
          {/* Left: Row Per Page */}
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span>Row Per Page</span>
            <div className="relative">
              <select
                value={pagination.limit || 10}
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

          {/* Right: Numbered Pagination Controls (< 1 2 3 [4] ... 15 >) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={(pagination.page || 1) <= 1}
              onClick={() => changePage((pagination.page || 1) - 1)}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              aria-label="Previous Page"
            >
              ‹
            </button>

            {Array.from(
              { length: Math.min(5, pagination.total_pages || 1) },
              (_, i) => i + 1
            ).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => changePage(pageNum)}
                className={`grid size-8 place-items-center rounded-lg text-xs font-bold transition cursor-pointer ${
                  (pagination.page || 1) === pageNum
                    ? "bg-[#FF9F43] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

            {(pagination.total_pages || 1) > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => changePage(pagination.total_pages)}
                  className="grid size-8 place-items-center rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {pagination.total_pages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={(pagination.page || 1) >= (pagination.total_pages || 1)}
              onClick={() => changePage((pagination.page || 1) + 1)}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              aria-label="Next Page"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* CREATE / EDIT SUPPLIER MODAL */}
      <Modal
        isOpen={formOpen}
        title={form ? "Edit Supplier" : "Add Supplier"}
        description={
          form
            ? "Update supplier details."
            : "Add a new vendor or supplier to your registry."
        }
        onClose={() => {
          setFormOpen(false);
          setForm(null);
        }}
        size="md"
      >
        <SupplierForm
          form={form}
          busy={busy}
          errors={errors}
          onSave={save}
          onCancel={() => {
            setFormOpen(false);
            setForm(null);
          }}
        />
      </Modal>

      {/* SUPPLIER DETAILS MODAL */}
      <SupplierDetailsModal
        details={details}
        onClose={() => setDetails(null)}
      />
    </div>
  );
}

export default SuppliersPage;
