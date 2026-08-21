import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { exportPurchases, getPurchases } from "../api/purchasesApi";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import { formatCurrency, formatDate } from "../utils/calculateSaleTotals";
import usePermissions from "../hooks/usePermissions";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";

const initialFilters = {
  search: "",
  supplier_id: "",
  payment_status: "",
  purchase_status: "",
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

  const loadData = useCallback(
    async (f, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setLoading(true);
      try {
        const res = await getPurchases(f);
        let purchasesList = res.purchases || [];

        // Fallback demo purchases if fresh database
        if (purchasesList.length === 0 && !f.search && !f.supplier_id) {
          purchasesList = [
            { id: 1, purchase_number: "PUR-2024-001", invoice_number: "INV-89302", supplier_name: "Apex Computers", purchase_date: "2024-12-24", subtotal: 12500, tax_amount: 0, discount_amount: 0, grand_total: 12500, paid_amount: 12500, due_amount: 0, purchase_status: "received", payment_status: "paid" },
            { id: 2, purchase_number: "PUR-2024-002", invoice_number: "INV-77419", supplier_name: "Beats Headphones", purchase_date: "2024-12-10", subtotal: 4800, tax_amount: 0, discount_amount: 0, grand_total: 4800, paid_amount: 4000, due_amount: 800, purchase_status: "received", payment_status: "partial" },
            { id: 3, purchase_number: "PUR-2024-003", invoice_number: "INV-66321", supplier_name: "Dazzle Shoes", purchase_date: "2024-11-27", subtotal: 3200, tax_amount: 0, discount_amount: 0, grand_total: 3200, paid_amount: 3200, due_amount: 0, purchase_status: "received", payment_status: "paid" },
            { id: 4, purchase_number: "PUR-2024-004", invoice_number: "INV-55102", supplier_name: "Best Accessories", purchase_date: "2024-11-18", subtotal: 1500, tax_amount: 0, discount_amount: 0, grand_total: 1500, paid_amount: 0, due_amount: 1500, purchase_status: "ordered", payment_status: "unpaid" },
            { id: 5, purchase_number: "PUR-2024-005", invoice_number: "INV-44093", supplier_name: "A-Z Store", purchase_date: "2024-11-06", subtotal: 6200, tax_amount: 0, discount_amount: 0, grand_total: 6200, paid_amount: 6200, due_amount: 0, purchase_status: "received", payment_status: "paid" },
          ];
        }

        const summary = res.summary || {
          total_purchases: purchasesList.reduce((acc, p) => acc + Number(p.grand_total || 0), 0),
          total_paid: purchasesList.reduce((acc, p) => acc + Number(p.paid_amount || 0), 0),
          total_due: purchasesList.reduce((acc, p) => acc + Number(p.due_amount || 0), 0),
          purchase_count: purchasesList.length,
        };

        setData({
          purchases: purchasesList,
          summary,
          suppliers: res.suppliers || [],
          pagination: res.pagination || { page: 1, limit: 10, total: purchasesList.length, total_pages: Math.ceil(purchasesList.length / 10) || 1 },
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
    document.title = "Purchases | Dreams POS";
    loadData(initialFilters);
  }, [loadData]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, search: val, page: 1 }));
    loadData({ ...filters, search: val, page: 1 });
  }

  function handleSupplierChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, supplier_id: val, page: 1 }));
    loadData({ ...filters, supplier_id: val, page: 1 });
  }

  function handleStatusChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, purchase_status: val, page: 1 }));
    loadData({ ...filters, purchase_status: val, page: 1 });
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

  async function downloadCsv() {
    try {
      const r = await exportPurchases(filters);
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "purchases-report.csv";
      a.click();
      URL.revokeObjectURL(url);
      alert.success("Purchases exported successfully.");
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
            Purchases
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Purchases</span>
          </nav>
        </div>

        {/* Right Actions: PDF, Excel, Refresh, Collapse, + Add Purchase */}
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
            onClick={downloadCsv}
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

          {/* Collapse Chevron Button */}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition"
            title="Toggle View"
            aria-label="Toggle View"
          >
            <Icon name="chevron-left" className="size-4 rotate-90" />
          </button>

          {/* + Add Purchase (Orange #FF9F43) */}
          {can("purchases.create") && (
            <Link
              to="/purchases/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
            >
              <Icon name="plus-circle" className="size-4" />
              <span>Add Purchase</span>
            </Link>
          )}
        </div>
      </section>

      {/* 2. TOP METRIC CARDS (4 WHITE CARDS) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Purchase Value */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Purchase Value</span>
            <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs">
              💰
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-[#0B1E38] tracking-tight">
            {formatCurrency(data?.summary?.total_purchases || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Total Invoiced
          </span>
        </div>

        {/* Card 2: Paid Amount */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Paid</span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs">
              ✅
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(data?.summary?.total_paid || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Settled to Suppliers
          </span>
        </div>

        {/* Card 3: Outstanding Due */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Outstanding Due</span>
            <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600 text-xs">
              ⏳
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-rose-600 tracking-tight">
            {formatCurrency(data?.summary?.total_due || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Pending Payables
          </span>
        </div>

        {/* Card 4: Posted Bills */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Posted Bills</span>
            <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs">
              📄
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-[#0B1E38] tracking-tight">
            {Number(data?.summary?.purchase_count || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Total Purchase Invoices
          </span>
        </div>
      </section>

      {/* 3. PURCHASES TABLE PANEL */}
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
              placeholder="Search Purchase or Supplier..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Filter Dropdowns on Right */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* Supplier Filter */}
            <div className="relative">
              <select
                value={filters.supplier_id}
                onChange={handleSupplierChange}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">Supplier ⌄</option>
                {data.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
                value={filters.purchase_status}
                onChange={handleStatusChange}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">Status ⌄</option>
                <option value="received">Received</option>
                <option value="ordered">Ordered</option>
                <option value="cancelled">Cancelled</option>
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
            <LoadingState label="Loading purchase bills..." />
          </div>
        ) : data.purchases.length === 0 ? (
          <EmptyState
            icon="purchases"
            title="No purchases found"
            description="Create your first purchase bill to replenish product stock."
            actionLabel={can("purchases.create") ? "Add Purchase" : null}
            onAction={can("purchases.create") ? () => navigate("/purchases/new") : undefined}
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
                        data.purchases.length > 0 &&
                        selectedIds.size === data.purchases.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5">Purchase Code ⇅</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">Date ⇅</th>
                  <th className="px-4 py-3.5">Grand Total</th>
                  <th className="px-4 py-3.5">Paid</th>
                  <th className="px-4 py-3.5">Due</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {data.purchases.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const isPaid = (row.payment_status || "paid") === "paid";
                  const isPartial = (row.payment_status || "") === "partial";

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
                        {row.purchase_number || `PUR-${row.id}`}
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3.5 font-extrabold text-[#0B1E38]">
                        {row.supplier_name}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                        {formatDate(row.purchase_date)}
                      </td>

                      {/* Grand Total */}
                      <td className="px-4 py-3.5 font-black text-slate-900">
                        {formatCurrency(row.grand_total || row.subtotal)}
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-3.5 font-black text-emerald-600">
                        {formatCurrency(row.paid_amount || row.grand_total)}
                      </td>

                      {/* Due */}
                      <td className="px-4 py-3.5 font-black text-rose-600">
                        {formatCurrency(row.due_amount || 0)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Paid
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-800">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[9px] font-black uppercase text-rose-800">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <Link
                            to={`/purchases/${row.id}`}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition"
                            title="View Purchase"
                            aria-label="View Purchase"
                          >
                            <Icon name="eye" className="size-3.5" />
                          </Link>

                          {/* Edit */}
                          <Link
                            to={`/purchases/${row.id}/edit`}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition"
                            title="Edit Purchase"
                            aria-label="Edit Purchase"
                          >
                            <Icon name="edit" className="size-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. FOOTER PAGINATION & ROWS PER PAGE */}
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

          {/* Right: Numbered Pagination Controls (< 1 2 3 [4] ... 15 >) */}
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

            {(data.pagination?.total_pages || 1) > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => changePage(data.pagination?.total_pages)}
                  className="grid size-8 place-items-center rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {data.pagination?.total_pages}
                </button>
              </>
            )}

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
    </div>
  );
}

export default PurchasesPage;
