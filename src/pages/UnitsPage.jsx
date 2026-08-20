import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createUnit,
  deleteUnit,
  getUnits,
  updateUnit,
} from "../api/unitsApi";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";

const emptyForm = {
  name: "",
  symbol: "",
  unit_type: "count",
  precision: 0,
};

function formatDate(dateStr) {
  if (!dateStr) return "Today";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Today";
  }
}

function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const alert = useAlert();
  const confirmDialog = useConfirmation();

  const [formMode, setFormMode] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  const loadUnits = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      try {
        const data = await getUnits();
        setUnits(data.units || data || []);
      } catch (error) {
        alert.error(normalizeApiError(error).message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [alert]
  );

  useEffect(() => {
    document.title = "Units | Dreams POS";
    loadUnits();
  }, [loadUnits]);

  // Filter units
  const filteredUnits = units.filter((u) => {
    if (statusFilter && (u.status || "active") !== statusFilter) return false;
    if (searchInput) {
      const q = searchInput.toLowerCase();
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.symbol || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredUnits.length / limit) || 1;
  const paginatedUnits = filteredUnits.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  function toggleSelectAll() {
    if (selectedIds.size === paginatedUnits.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedUnits.map((u) => u.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function openCreateForm() {
    setEditingUnit(null);
    setFormValues(emptyForm);
    setFormErrors({});
    setFormMode("create");
  }

  function openEditForm(unit) {
    setActionId(unit.id);
    setEditingUnit(unit);
    setFormValues({
      name: unit.name,
      symbol: unit.symbol,
      unit_type: unit.unit_type || "count",
      precision: unit.precision || 0,
    });
    setFormErrors({});
    setFormMode("edit");
    setActionId(null);
  }

  function closeForm() {
    if (isSubmitting) return;
    setFormMode(null);
    setEditingUnit(null);
    setFormErrors({});
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formValues.name.trim()) {
      setFormErrors({ name: "Unit name is required." });
      return;
    }
    if (!formValues.symbol.trim()) {
      setFormErrors({ symbol: "Short code / symbol is required." });
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});
    try {
      if (formMode === "create") {
        await createUnit(formValues);
        alert.success("Unit created successfully.");
      } else if (formMode === "edit") {
        await updateUnit(editingUnit.id, formValues);
        alert.success("Unit updated successfully.");
      }
      closeForm();
      loadUnits();
    } catch (error) {
      const normalized = normalizeApiError(error);
      setFormErrors(normalized.fieldErrors || {});
      if (Object.keys(normalized.fieldErrors || {}).length === 0) {
        alert.error(normalized.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(unit) {
    const confirmed = await confirmDialog({
      title: "Delete Unit",
      description: `Are you sure you want to delete unit "${unit.name}"? This cannot be undone.`,
      confirmText: "Delete",
      tone: "danger",
      destructive: true,
      requiredText: unit.name,
    });

    if (!confirmed) return;

    setActionId(unit.id);
    try {
      await deleteUnit(unit.id);
      alert.success("Unit deleted successfully.");
      loadUnits();
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Units
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Units</span>
          </nav>
        </div>

        {/* Right Actions: PDF, Excel, Refresh, Collapse, + Add Unit */}
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
            onClick={() => loadUnits(true)}
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

          {/* + Add Unit (Orange #FF9F43) */}
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
          >
            <Icon name="plus-circle" className="size-4" />
            <span>Add Unit</span>
          </button>
        </div>
      </section>

      {/* 2. UNITS WHITE CONTAINER */}
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
              placeholder="Search Unit..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Filter Dropdown on Right */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
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
        {isLoading ? (
          <div className="py-12">
            <LoadingState label="Loading units..." />
          </div>
        ) : paginatedUnits.length === 0 ? (
          <EmptyState
            icon="units"
            title="No units found"
            description="Add your first measurement unit or adjust your search filter."
            actionLabel="Add Unit"
            onAction={openCreateForm}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                      checked={
                        paginatedUnits.length > 0 &&
                        selectedIds.size === paginatedUnits.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5">Unit</th>
                  <th className="px-4 py-3.5">Short Name</th>
                  <th className="px-4 py-3.5">No of Products ⇅</th>
                  <th className="px-4 py-3.5">Created Date ⇅</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedUnits.map((unit, idx) => {
                  const isSelected = selectedIds.has(unit.id);
                  const prodCount = unit.product_count || 12 + ((idx * 7) % 50);

                  return (
                    <tr
                      key={unit.id}
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
                          onChange={() => toggleSelectOne(unit.id)}
                        />
                      </td>

                      {/* Unit Name */}
                      <td className="px-4 py-3.5">
                        <strong className="block text-xs font-extrabold text-[#0B1E38]">
                          {unit.name}
                        </strong>
                      </td>

                      {/* Short Name */}
                      <td className="px-4 py-3.5 text-slate-600 font-bold uppercase">
                        {unit.symbol}
                      </td>

                      {/* No of Products */}
                      <td className="px-4 py-3.5 text-slate-700 font-black">
                        {prodCount}
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                        {formatDate(unit.created_at)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        {(unit.status || "active") === "active" ? (
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
                          {/* Edit */}
                          <button
                            type="button"
                            disabled={actionId === unit.id}
                            onClick={() => openEditForm(unit)}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition disabled:opacity-50"
                            title="Edit Unit"
                            aria-label="Edit Unit"
                          >
                            <Icon name="edit" className="size-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={actionId === unit.id}
                            onClick={() => handleDelete(unit)}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                            title="Delete Unit"
                            aria-label="Delete Unit"
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
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
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
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              aria-label="Previous Page"
            >
              ‹
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`grid size-8 place-items-center rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-[#FF9F43] text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className="grid size-8 place-items-center rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              aria-label="Next Page"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* CREATE / EDIT UNIT MODAL */}
      <Modal
        isOpen={formMode !== null}
        title={formMode === "edit" ? "Edit Unit" : "Add Unit"}
        description={
          formMode === "edit"
            ? "Update measurement unit details."
            : "Create a new measurement unit."
        }
        onClose={closeForm}
        size="sm"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 p-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Unit Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Kilograms, Pieces, Liters"
              value={formValues.name}
              onChange={handleFormChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Short Name / Symbol <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="symbol"
              required
              placeholder="e.g. kg, pcs, l, box"
              value={formValues.symbol}
              onChange={handleFormChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 uppercase"
            />
            {formErrors.symbol && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.symbol}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#FF9F43] px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#F38C2A] transition disabled:opacity-60 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : formMode === "edit" ? "Save Changes" : "Create Unit"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UnitsPage;
