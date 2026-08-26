import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPurchaseReturns,
  createPurchaseReturn,
  getPurchases,
} from "../api/purchasesApi";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PurchaseReturnReceiptModal from "../components/purchases/PurchaseReturnReceiptModal";
import { formatCurrency, formatDate, formatDateTime } from "../utils/calculateSaleTotals";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";

const initialFilters = {
  search: "",
  supplier_id: "all",
  date_from: "",
  date_to: "",
  page: 1,
  limit: 10,
};

function PurchaseReturnsPage() {
  const alert = useAlert();

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [data, setData] = useState({
    returns: [],
    pagination: null,
    summary: {
      total_returned: 0,
      total_refund: 0,
      total_adjustment: 0,
      return_count: 0,
    },
    suppliers: [],
  });
  const [purchasesList, setPurchasesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal states
  const [viewItem, setViewItem] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReturn, setNewReturn] = useState({
    purchase_id: "",
    supplier_id: "",
    return_date: new Date().toISOString().split("T")[0],
    subtotal: "",
    refund_amount: "",
    balance_adjustment: "",
    reason: "",
  });

  const loadData = useCallback(
    async (f, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setLoading(true);
      try {
        const [res, pRes] = await Promise.all([
          getPurchaseReturns(f),
          getPurchases({ limit: 100 }).catch(() => ({ purchases: [] })),
        ]);

        setData({
          returns: res.returns || [],
          summary: res.summary || {
            total_returned: 0,
            total_refund: 0,
            total_adjustment: 0,
            return_count: 0,
          },
          suppliers: res.suppliers || [],
          pagination: res.pagination || {
            page: 1,
            limit: 10,
            total: (res.returns || []).length,
            total_pages: Math.ceil((res.returns || []).length / 10) || 1,
          },
        });
        setPurchasesList(pRes.purchases || []);
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
    document.title = "Purchase Returns | BiteBlix POS";
    loadData(initialFilters);
  }, [loadData]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, search: val, page: 1 }));
    loadData({ ...appliedFilters, search: val, page: 1 });
  }

  function handleSupplierFilter(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, supplier_id: val, page: 1 }));
    loadData({ ...appliedFilters, supplier_id: val, page: 1 });
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
    if (selectedIds.size === data.returns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.returns.map((r) => r.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handlePurchaseSelect(purchaseId) {
    const selected = purchasesList.find((p) => String(p.id) === String(purchaseId));
    if (selected) {
      setNewReturn((prev) => ({
        ...prev,
        purchase_id: selected.id,
        supplier_id: selected.supplier_id,
        subtotal: String(selected.grand_total || selected.subtotal || ""),
        refund_amount: String(selected.paid_amount || 0),
        balance_adjustment: String(selected.due_amount || 0),
      }));
    } else {
      setNewReturn((prev) => ({ ...prev, purchase_id: purchaseId }));
    }
  }

  async function handleAddReturnSubmit(e) {
    e.preventDefault();
    if (!newReturn.supplier_id || !newReturn.subtotal) {
      alert.error("Please select a supplier/purchase and enter returned amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPurchaseReturn({
        purchase_id: newReturn.purchase_id || 1,
        supplier_id: newReturn.supplier_id,
        return_date: newReturn.return_date,
        subtotal: parseFloat(newReturn.subtotal || 0),
        refund_amount: parseFloat(newReturn.refund_amount || 0),
        balance_adjustment: parseFloat(newReturn.balance_adjustment || 0),
        reason: newReturn.reason || "Supplier return",
      });

      alert.success("Purchase return recorded and stock adjusted successfully.");
      setAddModalOpen(false);
      setNewReturn({
        purchase_id: "",
        supplier_id: "",
        return_date: new Date().toISOString().split("T")[0],
        subtotal: "",
        refund_amount: "",
        balance_adjustment: "",
        reason: "",
      });
      loadData(appliedFilters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Purchase Returns
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Purchase Returns</span>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">

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

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
          >
            <Icon name="plus" className="size-4" />
            <span>Add Purchase Return</span>
          </button>
        </div>
      </section>

      {/* 2. TOP 4 DYNAMIC METRIC CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Returned</span>
            <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600 text-xs font-black">
              ↩️
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600 tracking-tight">
            {formatCurrency(data.summary.total_returned)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Total Invoiced Returns
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Cash / Bank Refund</span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
              💰
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(data.summary.total_refund)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Refunds Recovered
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Balance Adjusted</span>
            <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-black">
              ⚖️
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600 tracking-tight">
            {formatCurrency(data.summary.total_adjustment)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Udhaar / Due Deductions
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Returns</span>
            <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-black">
              🧾
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#FF9F43] tracking-tight">
            {data.summary.return_count}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Return Vouchers Recorded
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
              placeholder="Search Return #, Reason..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <select
              value={filters.supplier_id}
              onChange={handleSupplierFilter}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
            >
              <option value="all">All Suppliers ⌄</option>
              {data.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table / Empty State */}
        {loading ? (
          <div className="py-16">
            <LoadingState label="Loading purchase returns..." />
          </div>
        ) : data.returns.length === 0 ? (
          <EmptyState
            icon="returns"
            title="No purchase returns recorded"
            description="Record supplier returns when sending defective items back."
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
                      checked={data.returns.length > 0 && selectedIds.size === data.returns.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5">Return #</th>
                  <th className="px-4 py-3.5">Purchase Order</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Returned Amount</th>
                  <th className="px-4 py-3.5 text-right">Cash Refund</th>
                  <th className="px-4 py-3.5 text-right">Due Adjusted</th>
                  <th className="px-4 py-3.5">Reason</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {data.returns.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelectOne(row.id)}
                      />
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-rose-600">
                      {row.return_number || `PRET-${row.id}`}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">
                      {row.purchase_number || `PUR-${row.purchase_id}`}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {row.supplier_name}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                      {formatDate(row.return_date)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-black text-slate-900">
                      {formatCurrency(row.subtotal)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                      {formatCurrency(row.refund_amount)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-blue-600">
                      {formatCurrency(row.balance_adjustment)}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 max-w-[180px] truncate font-medium">
                      {row.reason}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setViewItem(row)}
                        className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                        title="View Return Details"
                      >
                        <Icon name="eye" className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. FOOTER PAGINATION */}
        {!loading && data.returns.length > 0 && (
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
              <span>of {data.pagination?.total || data.returns.length} records</span>
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

      {/* VIEW / PRINT RETURN VOUCHER MODAL */}
      <PurchaseReturnReceiptModal
        isOpen={Boolean(viewItem)}
        purchaseReturn={viewItem}
        onClose={() => setViewItem(null)}
      />

      {/* ADD PURCHASE RETURN MODAL */}
      <Modal
        isOpen={addModalOpen}
        title="Record Purchase Return"
        description="Return defective or incorrect products back to the vendor."
        onClose={() => setAddModalOpen(false)}
        size="md"
      >
        <form onSubmit={handleAddReturnSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Select Purchase Order <span className="text-rose-500">*</span>
            </label>
            <select
              value={newReturn.purchase_id}
              onChange={(e) => handlePurchaseSelect(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">Choose Purchase Order...</option>
              {purchasesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.purchase_number} — {p.supplier_name} ({formatCurrency(p.grand_total)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={newReturn.supplier_id}
              onChange={(e) => setNewReturn({ ...newReturn, supplier_id: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">Select Supplier...</option>
              {data.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Returned Value (Rs) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={newReturn.subtotal}
                onChange={(e) => setNewReturn({ ...newReturn, subtotal: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-800 outline-none focus:border-[#FF9F43]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Return Date</label>
              <input
                type="date"
                required
                value={newReturn.return_date}
                onChange={(e) => setNewReturn({ ...newReturn, return_date: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-700 outline-none focus:border-[#FF9F43]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cash / Bank Refund (Rs)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newReturn.refund_amount}
                onChange={(e) => setNewReturn({ ...newReturn, refund_amount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-emerald-600 outline-none focus:border-[#FF9F43]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Due Balance Adjusted (Rs)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newReturn.balance_adjustment}
                onChange={(e) =>
                  setNewReturn({ ...newReturn, balance_adjustment: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-blue-600 outline-none focus:border-[#FF9F43]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Return Reason / Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Defective batteries, wrong model delivered..."
              value={newReturn.reason}
              onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 outline-none focus:border-[#FF9F43]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#FF9F43] px-5 py-2 text-xs font-black text-white hover:bg-[#F38C2A] transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Save Return"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PurchaseReturnsPage;
