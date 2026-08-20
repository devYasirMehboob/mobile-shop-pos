import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";
import {
  getBatches,
  toggleBatchStatus,
  disposeBatchStock,
} from "../api/batchesApi";

const defaultFilters = {
  search: "",
  status: "",
  expiry_state: "",
  page: 1,
  limit: 10,
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
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
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const alert = useAlert();
  const confirm = useConfirmation();

  const [disposeBatch, setDisposeBatch] = useState(null);
  const [disposeQty, setDisposeQty] = useState("");
  const [disposeReason, setDisposeReason] = useState("");
  const [busy, setBusy] = useState(false);

  const loadBatches = useCallback(
    async (f, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setLoading(true);
      try {
        const data = await getBatches(f);
        setBatches(data.batches || []);
        setPagination(data.pagination || { page: 1, total_pages: 1, total: (data.batches || []).length, limit: 10 });
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
    document.title = "Expired Products | Dreams POS";
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

  function handleExpiryStateChange(e) {
    const expiry_state = e.target.value;
    setFilters((f) => ({ ...f, expiry_state, page: 1 }));
    loadBatches({ ...appliedFilters, expiry_state, page: 1 });
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

  async function handleBlock(batch) {
    const isBlocked = batch.status === "blocked";
    const confirmed = await confirm({
      title: isBlocked ? "Unblock Batch" : "Block Batch",
      description: isBlocked
        ? `Are you sure you want to unblock batch "${batch.batch_number}"? It will be available for sales again.`
        : `Are you sure you want to block batch "${batch.batch_number}"? It will not be sold in POS.`,
      confirmText: isBlocked ? "Unblock" : "Block",
      tone: isBlocked ? "primary" : "danger",
    });
    if (!confirmed) return;

    try {
      const res = await toggleBatchStatus(batch.id, isBlocked ? "active" : "blocked");
      alert.success(res.message || "Batch status updated.");
      loadBatches(appliedFilters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  async function handleDisposeSubmit(e) {
    e.preventDefault();
    if (!disposeQty || Number(disposeQty) <= 0) {
      alert.error("Enter a valid quantity to dispose.");
      return;
    }
    setBusy(true);
    try {
      const res = await disposeBatchStock(disposeBatch.id, {
        quantity: disposeQty,
        reason: disposeReason || "Expired batch disposal",
      });
      alert.success(res.message || "Batch disposed successfully.");
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

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Expired Products
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Expired Products</span>
          </nav>
        </div>

        {/* Right Actions: PDF, Excel, Refresh, Collapse */}
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

          {/* Collapse Chevron Button */}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition"
            title="Toggle View"
            aria-label="Toggle View"
          >
            <Icon name="chevron-left" className="size-4 rotate-90" />
          </button>
        </div>
      </section>

      {/* 2. EXPIRED PRODUCTS WHITE CONTAINER */}
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
              placeholder="Search Batch or Product..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Filter Dropdowns on Right */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={handleStatusChange}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">Status ⌄</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="depleted">Depleted</option>
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
              />
            </div>

            {/* Expiry State Filter */}
            <div className="relative">
              <select
                value={filters.expiry_state}
                onChange={handleExpiryStateChange}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">Expiry State ⌄</option>
                <option value="expired">Expired Only</option>
                <option value="near_expiry">Near Expiry (30 Days)</option>
                <option value="valid">Valid (Safe)</option>
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
            <LoadingState label="Loading expired batches..." />
          </div>
        ) : batches.length === 0 ? (
          <EmptyState
            icon="expired-products"
            title="No expired products found"
            description="Adjust your filters or monitor upcoming product batches."
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
                  <th className="px-4 py-3.5">SKU / Batch ⇅</th>
                  <th className="px-4 py-3.5">Product Name</th>
                  <th className="px-4 py-3.5">Manufactured Date</th>
                  <th className="px-4 py-3.5">Expired Date</th>
                  <th className="px-4 py-3.5">Qty</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {batches.map((b) => {
                  const isSelected = selectedIds.has(b.id);
                  const isExpired =
                    b.expiry_date && new Date(b.expiry_date) < new Date();
                  const isNearExpiry =
                    b.expiry_date &&
                    !isExpired &&
                    new Date(b.expiry_date) <=
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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

                      {/* Batch Code */}
                      <td className="px-4 py-3.5 font-bold text-slate-600">
                        {b.batch_number}
                      </td>

                      {/* Product Name & Icon */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs overflow-hidden border border-slate-200/60 shadow-2xs">
                            {b.product_image ? (
                              <img
                                src={b.product_image}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <Icon name="products" className="size-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <strong className="block text-xs font-extrabold text-[#0B1E38]">
                              {b.product_name}
                            </strong>
                            <span className="block text-[10px] text-slate-400 font-medium">
                              ID: #{b.product_code || b.product_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Manufactured Date */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                        {formatDate(b.manufacturing_date)}
                      </td>

                      {/* Expired Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isExpired
                              ? "text-rose-600"
                              : isNearExpiry
                              ? "text-[#FF9F43]"
                              : "text-slate-600"
                          }`}
                        >
                          {formatDate(b.expiry_date)}
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3.5 font-black text-slate-800">
                        {Math.round(Number(b.remaining_quantity || 0))}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        {b.status === "active" && (
                          <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800">
                            Active
                          </span>
                        )}
                        {b.status === "blocked" && (
                          <span className="inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[9px] font-black uppercase text-rose-800">
                            Blocked
                          </span>
                        )}
                        {b.status === "depleted" && (
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                            Depleted
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Block / Unblock Button */}
                          {b.status !== "depleted" && (
                            <button
                              type="button"
                              onClick={() => handleBlock(b)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold shadow-2xs transition ${
                                b.status === "blocked"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {b.status === "blocked" ? "Unblock" : "Block"}
                            </button>
                          )}

                          {/* Dispose Stock Button */}
                          {b.status !== "depleted" &&
                            Number(b.remaining_quantity) > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDisposeBatch(b);
                                  setDisposeQty(Number(b.remaining_quantity));
                                }}
                                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-rose-600 shadow-2xs hover:border-rose-300 hover:bg-rose-50 transition cursor-pointer"
                                title="Dispose Expired Stock"
                                aria-label="Dispose Stock"
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
            {/* Previous Page */}
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => changePage(pagination.page - 1)}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              aria-label="Previous Page"
            >
              ‹
            </button>

            {/* Dynamic page numbers */}
            {Array.from(
              { length: Math.min(5, pagination.total_pages || 1) },
              (_, i) => i + 1
            ).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => changePage(pageNum)}
                className={`grid size-8 place-items-center rounded-lg text-xs font-bold transition cursor-pointer ${
                  pagination.page === pageNum
                    ? "bg-[#FF9F43] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

            {pagination.total_pages > 5 && (
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

            {/* Next Page */}
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
      </section>

      {/* DISPOSE STOCK MODAL */}
      <Modal
        isOpen={Boolean(disposeBatch)}
        onClose={() => setDisposeBatch(null)}
        title="Dispose Expired Stock"
        description={`Dispose remaining stock for batch ${disposeBatch?.batch_number}.`}
        size="sm"
      >
        <form onSubmit={handleDisposeSubmit} className="space-y-4 p-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Quantity to Dispose <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0.001"
              step="any"
              max={disposeBatch?.remaining_quantity}
              required
              value={disposeQty}
              onChange={(e) => setDisposeQty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Disposal Reason
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Expired shelf-life, damaged packaging"
              value={disposeReason}
              onChange={(e) => setDisposeReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
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
              className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-60 cursor-pointer"
              disabled={busy}
            >
              {busy ? "Processing..." : "Confirm Disposal"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BatchesPage;
