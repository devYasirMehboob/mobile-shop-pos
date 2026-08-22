import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";
import { formatCurrency } from "../utils/calculateSaleTotals";
import {
  getBatches,
  toggleBatchStatus,
  disposeBatchStock,
} from "../api/batchesApi";

const defaultFilters = {
  search: "",
  status: "",
  page: 1,
  limit: 10,
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const alert = useAlert();
  const confirm = useConfirmation();

  // Adjust / Dispose Batch Modal State
  const [disposeBatch, setDisposeBatch] = useState(null);
  const [disposeQty, setDisposeQty] = useState("");
  const [disposeReason, setDisposeReason] = useState("");
  const [busy, setBusy] = useState(false);

  const loadBatches = useCallback(
    async (f, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setLoading(true);
      try {
        const data = await getBatches(f);
        const list = data.batches || [];
        setBatches(list);
        setPagination(
          data.pagination || {
            page: f.page || 1,
            total_pages: Math.ceil(list.length / (f.limit || 10)) || 1,
            total: list.length,
            limit: f.limit || 10,
          }
        );
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
    document.title = "Batches | Dreams POS";
    loadBatches(defaultFilters);
  }, [loadBatches]);

  function handleSearchChange(e) {
    const search = e.target.value;
    setFilters((f) => ({ ...f, search, page: 1 }));
    loadBatches({ ...appliedFilters, search, page: 1 });
  }

  function handleStatusChange(e) {
    const status = e.target.value;
    setFilters((f) => ({ ...f, status, page: 1 }));
    loadBatches({ ...appliedFilters, status, page: 1 });
  }

  function changePage(page) {
    const nextFilters = { ...appliedFilters, page };
    setFilters((f) => ({ ...f, page }));
    loadBatches(nextFilters);
  }

  function changeLimit(limit) {
    const nextFilters = { ...appliedFilters, limit: Number(limit), page: 1 };
    setFilters(nextFilters);
    loadBatches(nextFilters);
  }

  function toggleSelectAll() {
    if (selectedIds.size === batches.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(batches.map((b) => b.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleToggleStatus(batch) {
    const newStatus = batch.status === "active" ? "blocked" : "active";
    const ok = await confirm({
      title: `${newStatus === "blocked" ? "Block" : "Activate"} Batch?`,
      description: `Are you sure you want to ${
        newStatus === "blocked" ? "block" : "activate"
      } batch "${batch.batch_number}"? ${
        newStatus === "blocked"
          ? "Blocked batches cannot be sold at checkout."
          : "Active batches will be available for POS sales."
      }`,
      confirmText: newStatus === "blocked" ? "Block Batch" : "Activate Batch",
      tone: newStatus === "blocked" ? "danger" : "primary",
    });
    if (!ok) return;

    try {
      const res = await toggleBatchStatus(batch.id, newStatus);
      alert.success(res.message || `Batch ${newStatus}.`);
      loadBatches(appliedFilters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  async function handleDisposeSubmit(e) {
    e.preventDefault();
    const qty = parseFloat(disposeQty);
    if (!qty || qty <= 0) {
      alert.error("Please enter a valid quantity greater than 0.");
      return;
    }
    setBusy(true);
    try {
      const res = await disposeBatchStock(disposeBatch.id, {
        quantity: disposeQty,
        reason: disposeReason || "Stock lot deduction",
      });
      alert.success(res.message || "Batch stock deducted successfully.");
      setDisposeBatch(null);
      setDisposeQty("");
      setDisposeReason("");
      loadBatches(appliedFilters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  // Top Metrics Calculation
  const totalBatchesCount = batches.length;
  const activeBatchesCount = batches.filter(
    (b) => Number(b.remaining_quantity || 0) > 0 && b.status === "active"
  ).length;
  const depletedBatchesCount = batches.filter(
    (b) => Number(b.remaining_quantity || 0) <= 0 || b.status === "depleted"
  ).length;
  const totalBatchValue = batches.reduce(
    (acc, b) =>
      acc + Number(b.remaining_quantity || 0) * Number(b.unit_cost || 0),
    0
  );

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Stock Batches
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Batches</span>
          </nav>
        </div>

        {/* Right Actions: PDF, Excel, Refresh, + Receive Stock Batch */}
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
            onClick={() => alert.success("Batches inventory exported.")}
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
            onClick={() => loadBatches(appliedFilters, true)}
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
        </div>
      </section>

      {/* 2. TOP 4 SUMMARY METRIC CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Batches</span>
            <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-black">
              📦
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0B1E38] tracking-tight">
            {totalBatchesCount}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Recorded Stock Lots
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active In-Stock Lots</span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
              ✓
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
            {activeBatchesCount}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Available for Sale
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Batch Stock Value</span>
            <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-black">
              💰
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#FF9F43] tracking-tight">
            {formatCurrency(totalBatchValue)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Cost Value of Remaining Lots
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Depleted Lots</span>
            <span className="grid size-7 place-items-center rounded-lg bg-slate-100 text-slate-600 text-xs font-black">
              0
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-700 tracking-tight">
            {depletedBatchesCount}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Fully Sold Out Lots
          </span>
        </div>
      </section>

      {/* 3. BATCHES WHITE CONTAINER */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        {/* Search & Status Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search Batch #, Product, SKU..."
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
                <option value="active">Active (In-Stock)</option>
                <option value="blocked">Blocked</option>
                <option value="depleted">Depleted</option>
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
            <LoadingState label="Loading stock batches..." />
          </div>
        ) : batches.length === 0 ? (
          <EmptyState
            icon="batches"
            title="No stock batches found"
            description="Purchased stock lots and shipments will automatically appear and track here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                      checked={
                        batches.length > 0 && selectedIds.size === batches.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5">Batch / Lot #</th>
                  <th className="px-4 py-3.5">Product Name</th>
                  <th className="px-4 py-3.5 text-center">Received Qty</th>
                  <th className="px-4 py-3.5 text-center">Remaining Stock</th>
                  <th className="px-4 py-3.5 text-right">Unit Cost</th>
                  <th className="px-4 py-3.5 text-right">Lot Value</th>
                  <th className="px-4 py-3.5">Received Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {batches.map((b) => {
                  const isSelected = selectedIds.has(b.id);
                  const remQty = Number(b.remaining_quantity || 0);
                  const recQty = Number(b.received_quantity || remQty);
                  const unitCost = Number(b.unit_cost || 0);
                  const totalVal = remQty * unitCost;

                  return (
                    <tr
                      key={b.id}
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
                          onChange={() => toggleSelectOne(b.id)}
                        />
                      </td>

                      {/* Batch # */}
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0B1E38]">
                        {b.batch_number || `BATCH-${b.id}`}
                      </td>

                      {/* Product Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF9F43] font-black text-xs border border-orange-200/40 shadow-2xs">
                            {b.product_name?.charAt(0) || "P"}
                          </div>
                          <div>
                            <strong className="block text-xs font-bold text-[#0B1E38]">
                              {b.product_name || "Product"}
                            </strong>
                            <span className="block text-[10px] font-mono text-slate-400">
                              {b.product_code || b.barcode || `PRD-${b.product_id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Received Qty */}
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-600">
                        {recQty} Units
                      </td>

                      {/* Remaining Qty */}
                      <td className="px-4 py-3.5 text-center">
                        <strong
                          className={`text-sm font-black ${
                            remQty <= 0
                              ? "text-slate-400"
                              : remQty <= 5
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {remQty} Units
                        </strong>
                      </td>

                      {/* Unit Cost */}
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-700">
                        {formatCurrency(unitCost)}
                      </td>

                      {/* Lot Value */}
                      <td className="px-4 py-3.5 text-right font-black text-[#0B1E38]">
                        {formatCurrency(totalVal)}
                      </td>

                      {/* Received Date */}
                      <td className="px-4 py-3.5 text-slate-500 font-medium whitespace-nowrap text-[11px]">
                        {formatDate(b.received_date)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {b.status === "blocked" ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200/60">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            Blocked
                          </span>
                        ) : remQty <= 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200/60">
                            <span className="size-1.5 rounded-full bg-slate-400" />
                            Depleted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Status (Block / Activate) */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(b)}
                            className={`grid size-7 place-items-center rounded-lg border text-xs transition cursor-pointer ${
                              b.status === "blocked"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                            }`}
                            title={
                              b.status === "blocked"
                                ? "Activate Batch"
                                : "Block Batch"
                            }
                          >
                            {b.status === "blocked" ? "✓" : "⛔"}
                          </button>

                          {/* Deduct / Adjust Batch Stock */}
                          {remQty > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setDisposeBatch(b);
                                setDisposeQty("");
                                setDisposeReason("");
                              }}
                              className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-orange-50 hover:text-[#FF9F43] hover:border-orange-200 transition cursor-pointer"
                              title="Deduct / Adjust Batch Stock"
                            >
                              <Icon name="edit" className="size-3" />
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
        {!loading && batches.length > 0 && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
              <span>Rows per page</span>
              <select
                value={pagination.limit || 10}
                onChange={(e) => changeLimit(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>of {pagination.total} batches</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={(pagination.page || 1) <= 1}
                onClick={() => changePage((pagination.page || 1) - 1)}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                ‹
              </button>
              <span className="px-2 font-bold text-slate-700">
                Page {pagination.page || 1} of {pagination.total_pages || 1}
              </span>
              <button
                type="button"
                disabled={(pagination.page || 1) >= (pagination.total_pages || 1)}
                onClick={() => changePage((pagination.page || 1) + 1)}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 6. DEDUCT / DISPOSE BATCH STOCK MODAL */}
      <Modal
        isOpen={Boolean(disposeBatch)}
        title={`Deduct Stock — ${disposeBatch?.batch_number || "Batch"}`}
        description={`Product: ${disposeBatch?.product_name || "Product"} · Remaining in Lot: ${disposeBatch?.remaining_quantity || 0} Units`}
        onClose={() => setDisposeBatch(null)}
        size="md"
      >
        <form onSubmit={handleDisposeSubmit} className="space-y-4 p-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Quantity to Deduct <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={disposeBatch?.remaining_quantity || 9999}
              step="any"
              required
              placeholder={`Max: ${disposeBatch?.remaining_quantity || 0}`}
              value={disposeQty}
              onChange={(e) => setDisposeQty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Lot Deduction
            </label>
            <input
              type="text"
              placeholder="e.g. Damaged in shipment, Return to vendor, Quality check failure"
              value={disposeReason}
              onChange={(e) => setDisposeReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDisposeBatch(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-black text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-60 cursor-pointer"
              disabled={busy}
            >
              {busy ? "Deducting..." : "Confirm Deduction"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BatchesPage;
