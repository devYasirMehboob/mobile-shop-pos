import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  exportPurchases,
  getPurchases,
  addPurchasePayment,
  cancelPurchase,
} from "../api/purchasesApi";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import { formatCurrency, formatDate } from "../utils/calculateSaleTotals";
import usePermissions from "../hooks/usePermissions";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";

const initialFilters = {
  search: "",
  supplier_id: "all",
  payment_status: "all",
  purchase_status: "all",
  date_from: "",
  date_to: "",
  page: 1,
  limit: 10,
};

function PurchasesPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const alert = useAlert();

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [data, setData] = useState({
    purchases: [],
    pagination: null,
    summary: {
      total_purchases: 0,
      total_paid: 0,
      total_due: 0,
      purchase_count: 0,
    },
    suppliers: [],
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPurchase, setPaymentPurchase] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const loadData = useCallback(
    async (f, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setLoading(true);
      try {
        const res = await getPurchases(f);
        setData({
          purchases: res.purchases || [],
          summary: res.summary || {
            total_purchases: 0,
            total_paid: 0,
            total_due: 0,
            purchase_count: 0,
          },
          suppliers: res.suppliers || [],
          pagination: res.pagination || {
            page: 1,
            limit: 10,
            total: (res.purchases || []).length,
            total_pages: Math.ceil((res.purchases || []).length / 10) || 1,
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
    document.title = "Purchases | BiteBlix POS";
    loadData(initialFilters);
  }, [loadData]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, search: val, page: 1 }));
    loadData({ ...appliedFilters, search: val, page: 1 });
  }

  function handleSupplierChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, supplier_id: val, page: 1 }));
    loadData({ ...appliedFilters, supplier_id: val, page: 1 });
  }

  function handlePaymentStatusChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, payment_status: val, page: 1 }));
    loadData({ ...appliedFilters, payment_status: val, page: 1 });
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
    if (selectedIds.size === data.purchases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.purchases.map((p) => p.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function openPaymentModal(purchase) {
    setPaymentPurchase(purchase);
    setPaymentAmount(String(purchase.due_amount || 0));
    setPaymentMethod("cash");
    setPaymentReference("");
    setPaymentNote("");
    setPaymentModalOpen(true);
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault();
    if (!paymentPurchase) return;
    setIsSubmittingPayment(true);
    try {
      await addPurchasePayment(paymentPurchase.id, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentReference,
        notes: paymentNote,
      });
      alert.success(`Payment of ${formatCurrency(paymentAmount)} recorded successfully.`);
      setPaymentModalOpen(false);
      loadData(appliedFilters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  async function handleCancelPurchase(purchase) {
    if (!window.confirm(`Are you sure you want to cancel purchase order ${purchase.purchase_number}?`)) {
      return;
    }
    try {
      await cancelPurchase(purchase.id, "User requested cancellation");
      alert.success(`Purchase ${purchase.purchase_number} marked as cancelled.`);
      loadData(appliedFilters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 1. TOP HEADER & ACTIONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Purchase Orders
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Purchases</span>
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

          <Link
            to="/purchases/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
          >
            <Icon name="plus" className="size-4" />
            <span>New Purchase</span>
          </Link>
        </div>
      </section>

      {/* 2. TOP 4 DYNAMIC METRIC CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Purchases</span>
            <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-black">
              📦
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0B1E38] tracking-tight">
            {formatCurrency(data.summary.total_purchases)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Gross Procurement Invoiced
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Paid</span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
              ✓
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(data.summary.total_paid)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Cleared Supplier Payments
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Balance Due</span>
            <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600 text-xs font-black">
              ⚠️
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600 tracking-tight">
            {formatCurrency(data.summary.total_due)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Outstanding Payable Udhaar
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Orders</span>
            <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-black">
              🧾
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#FF9F43] tracking-tight">
            {data.summary.purchase_count}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Recorded Purchase Invoices
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
              placeholder="Search Purchase #, Inv #..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* Supplier Filter */}
            <select
              value={filters.supplier_id}
              onChange={handleSupplierChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
            >
              <option value="all">All Suppliers ⌄</option>
              {data.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Payment Status Filter */}
            <select
              value={filters.payment_status}
              onChange={handlePaymentStatusChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Table / Empty State */}
        {loading ? (
          <div className="py-16">
            <LoadingState label="Loading purchases..." />
          </div>
        ) : data.purchases.length === 0 ? (
          <EmptyState
            icon="purchases"
            title="No purchase orders found"
            description="Create a new purchase order to inward products into your inventory."
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
                      checked={data.purchases.length > 0 && selectedIds.size === data.purchases.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5">Purchase Code</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Grand Total</th>
                  <th className="px-4 py-3.5 text-right">Paid</th>
                  <th className="px-4 py-3.5 text-right">Due</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {data.purchases.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const isPaid = (row.payment_status || "paid") === "paid";
                  const isPartial = (row.payment_status || "") === "partial";
                  const due = Number(row.due_amount || 0);

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
                        <Link
                          to={`/purchases/${row.id}`}
                          className="font-mono font-black text-[#0B1E38] hover:text-[#FF9F43] transition"
                        >
                          {row.purchase_number || `PUR-${row.id}`}
                        </Link>
                        {row.supplier_invoice_number && (
                          <span className="block text-[10px] text-slate-400 font-medium">
                            Inv: {row.supplier_invoice_number}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {row.supplier_name}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {formatDate(row.purchase_date)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-[#0B1E38]">
                        {formatCurrency(row.grand_total || row.subtotal)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        {formatCurrency(row.paid_amount || 0)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-rose-600">
                        {formatCurrency(due)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700 border border-emerald-200/60">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Paid
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-700 border border-amber-200/60">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-rose-700 border border-rose-200/60">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            Unpaid
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Add Payment Button if due > 0 */}
                          {due > 0 && (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(row)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                              title="Add Payment"
                            >
                              <span>+ Pay</span>
                            </button>
                          )}

                          {/* View Details */}
                          <Link
                            to={`/purchases/${row.id}`}
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                            title="View Purchase"
                          >
                            <Icon name="eye" className="size-3.5" />
                          </Link>

                          {/* Edit */}
                          <Link
                            to={`/purchases/${row.id}/edit`}
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                            title="Edit Purchase"
                          >
                            <Icon name="edit" className="size-3.5" />
                          </Link>

                          {/* Cancel */}
                          {row.purchase_status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => handleCancelPurchase(row)}
                              className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              title="Cancel Purchase"
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

        {/* 4. FOOTER PAGINATION */}
        {!loading && data.purchases.length > 0 && (
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
              <span>of {data.pagination?.total || data.purchases.length} records</span>
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

      {/* ADD PAYMENT MODAL */}
      <Modal
        isOpen={paymentModalOpen}
        title={
          paymentPurchase
            ? `Record Payment — ${paymentPurchase.purchase_number}`
            : "Record Supplier Payment"
        }
        description="Add cash or online payment to clear outstanding vendor balance."
        onClose={() => setPaymentModalOpen(false)}
        size="md"
      >
        {paymentPurchase && (
          <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Supplier</span>
                <p className="font-extrabold text-slate-800">{paymentPurchase.supplier_name}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Current Due</span>
                <p className="font-black text-rose-600">
                  {formatCurrency(paymentPurchase.due_amount)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Amount (Rs) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={paymentPurchase.due_amount || undefined}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_wallet">JazzCash / EasyPaisa</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reference # / Cheque #
                </label>
                <input
                  type="text"
                  placeholder="e.g. TR-89210"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#FF9F43]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Note</label>
              <textarea
                rows={2}
                placeholder="Optional payment notes..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#FF9F43]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPayment || !paymentAmount}
                className="rounded-xl bg-[#FF9F43] px-5 py-2 text-xs font-black text-white hover:bg-[#F38C2A] transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingPayment ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default PurchasesPage;
