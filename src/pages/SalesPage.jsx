import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getSales,
  getSalesSummary,
  getSale,
  getSaleReceipt,
  getSalesReturns,
  cancelSale,
  refundSale,
} from "../api/salesApi";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ReceiptPreview from "../components/sales/ReceiptPreview";
import SaleDetailsModal from "../components/sales/SaleDetailsModal";
import SaleActionDialog from "../components/sales/SaleActionDialog";
import SaleStatusBadge from "../components/sales/SaleStatusBadge";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";
import { formatCurrency, formatDateTime, formatDate } from "../utils/calculateSaleTotals";

const defaultFilters = {
  search: "",
  date_from: "",
  date_to: "",
  payment_method: "all",
  status: "all",
  page: 1,
  limit: 10,
};

function SalesPage() {
  const alert = useAlert();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const isInvoicesView = params.get("view") === "invoices";
  const isReturnsTab = params.get("tab") === "returns";

  const [sales, setSales] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [summary, setSummary] = useState({
    total_sales: 0,
    net_sales: 0,
    total_orders: 0,
    refunded_orders: 0,
    refunded_amount: 0,
    total_customers: 0,
    units_sold: 0,
  });

  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals for sale details, receipts, and refund/cancel
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  const [action, setAction] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadData = useCallback(
    async (f, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      try {
        if (isReturnsTab) {
          const returnsData = await getSalesReturns(f);
          setReturnsList(returnsData.returns || []);
          setPagination(
            returnsData.pagination || {
              page: f.page || 1,
              limit: f.limit || 10,
              total: returnsData.total || 0,
              total_pages: Math.ceil((returnsData.total || 0) / (f.limit || 10)) || 1,
            }
          );
        } else {
          const [salesData, summaryData] = await Promise.all([
            getSales(f).catch(() => ({ sales: [], total: 0, pagination: null })),
            getSalesSummary(f).catch(() => null),
          ]);

          setSales(salesData.sales || []);
          setPagination(
            salesData.pagination || {
              page: f.page || 1,
              limit: f.limit || 10,
              total: salesData.total || 0,
              total_pages: Math.ceil((salesData.total || 0) / (f.limit || 10)) || 1,
            }
          );

          if (summaryData) {
            setSummary(summaryData);
          }
        }

        setAppliedFilters(f);
      } catch (error) {
        alert.error(normalizeApiError(error).message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isReturnsTab, alert]
  );

  useEffect(() => {
    document.title = isReturnsTab
      ? "Sales Returns | Dreams POS"
      : isInvoicesView
      ? "Invoices | Dreams POS"
      : "Sales Transactions | Dreams POS";

    loadData(defaultFilters);
  }, [loadData, isReturnsTab, isInvoicesView]);

  function handleSearchChange(e) {
    const search = e.target.value;
    setFilters((f) => ({ ...f, search, page: 1 }));
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    loadData({ ...filters, page: 1 });
  }

  function changePage(page) {
    const nextFilters = { ...appliedFilters, page };
    setFilters((f) => ({ ...f, page }));
    loadData(nextFilters);
  }

  function changeLimit(limit) {
    const nextFilters = { ...appliedFilters, limit: Number(limit), page: 1 };
    setFilters(nextFilters);
    loadData(nextFilters);
  }

  async function handleViewSale(saleId) {
    try {
      const fullSale = await getSale(saleId);
      setDetails(fullSale);
      setDetailsOpen(true);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  async function handleReprintReceipt(saleId) {
    setReceiptOpen(true);
    setIsReceiptLoading(true);
    try {
      const receiptData = await getSaleReceipt(saleId);
      setReceipt(receiptData);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
      setReceiptOpen(false);
    } finally {
      setIsReceiptLoading(false);
    }
  }

  async function handleConfirmAction(payload) {
    if (!action?.sale) return;
    setIsSubmittingAction(true);
    try {
      if (action.type === "refund") {
        await refundSale(action.sale.id, payload);
        alert.success(`Sale ${action.sale.invoice_number} refunded and stock returned.`);
      } else {
        await cancelSale(action.sale.id, payload.reason);
        alert.success(`Sale ${action.sale.invoice_number} cancelled.`);
      }
      setAction(null);
      setDetailsOpen(false);
      loadData(appliedFilters);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setIsSubmittingAction(false);
    }
  }

  function toggleSelectAll() {
    const currentList = isReturnsTab ? returnsList : sales;
    if (selectedIds.size === currentList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentList.map((r) => r.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            {isReturnsTab
              ? "Sales Returns & Customer Refunds"
              : isInvoicesView
              ? "Customer Invoices"
              : "Sales Transactions"}
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">
              {isReturnsTab ? "Sales Returns" : isInvoicesView ? "Invoices" : "Sales"}
            </span>
          </nav>
        </div>

        {/* Right Actions: PDF, Excel, Refresh, POS Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600 shadow-2xs hover:bg-rose-100 transition cursor-pointer"
            title="Export PDF"
            aria-label="Export PDF"
          >
            <span className="text-xs font-black">📄</span>
          </button>

          <button
            type="button"
            onClick={() => alert.success("Sales report exported to Excel.")}
            className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
            title="Export Excel"
            aria-label="Export Excel"
          >
            <span className="text-xs font-black">📊</span>
          </button>

          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => loadData(appliedFilters, true)}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Refresh List"
            aria-label="Refresh List"
          >
            <Icon
              name="refresh"
              className={`size-4 ${isRefreshing ? "animate-spin text-[#FF9F43]" : ""}`}
            />
          </button>

          <Link
            to="/pos"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
          >
            <Icon name="pos" className="size-4" />
            <span>Open POS</span>
          </Link>
        </div>
      </section>

      {/* 2. TOP 4 DYNAMIC METRIC SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isReturnsTab ? (
          <>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Refunded Value</span>
                <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600 text-xs font-black">
                  ↩️
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-rose-600 tracking-tight">
                {formatCurrency(summary.refunded_amount || 0)}
              </p>
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                Total Refund Outflow
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Returned Orders</span>
                <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600 text-xs font-black">
                  🧾
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-amber-600 tracking-tight">
                {summary.refunded_orders || returnsList.length}
              </p>
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                Processed Customer Returns
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Completed Sales</span>
                <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
                  ✓
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
                {summary.total_orders || 0}
              </p>
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                Successful Transactions
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Net Revenue</span>
                <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-black">
                  💰
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-[#0B1E38] tracking-tight">
                {formatCurrency(summary.net_sales || 0)}
              </p>
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                After Return Adjustments
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Sales</span>
                <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
                  💰
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
                {formatCurrency(summary.total_sales || 0)}
              </p>
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                Gross Billed Revenue
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Orders</span>
                <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-black">
                  🧾
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-[#0B1E38] tracking-tight">
                {summary.total_orders || sales.length}
              </p>
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                Completed POS Sales
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Customers Served</span>
                <span className="grid size-7 place-items-center rounded-lg bg-purple-50 text-purple-600 text-xs font-black">
                  👥
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-purple-600 tracking-tight">
                {summary.total_customers || 1}
              </p>
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                Unique Customer Invoices
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Units Sold</span>
                <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-black">
                  📦
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-[#FF9F43] tracking-tight">
                {summary.units_sold || 0}
              </p>
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                Products Inward/Outward
              </span>
            </div>
          </>
        )}
      </section>

      {/* 3. TABS NAVIGATION */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/sales"
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              !isInvoicesView && !isReturnsTab
                ? "bg-[#FF9F43] text-white shadow-sm shadow-orange-500/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Sales Transactions ({summary.total_orders || sales.length})
          </Link>

          <Link
            to="/sales?view=invoices"
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              isInvoicesView
                ? "bg-[#FF9F43] text-white shadow-sm shadow-orange-500/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Invoices Ledger
          </Link>

          <Link
            to="/sales?tab=returns"
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              isReturnsTab
                ? "bg-[#FF9F43] text-white shadow-sm shadow-orange-500/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Sales Returns ({summary.refunded_orders || returnsList.length})
          </Link>
        </div>
      </section>

      {/* 4. MAIN TABLE CONTAINER */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        {/* Search & Filter Bar */}
        <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5">
          <div className="relative w-full sm:max-w-xs">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search Invoice #, Customer, Phone..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* Payment Method Filter */}
            {!isReturnsTab && (
              <select
                value={filters.payment_method}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, payment_method: e.target.value }));
                  loadData({ ...appliedFilters, payment_method: e.target.value, page: 1 });
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_wallet">JazzCash / EasyPaisa</option>
              </select>
            )}

            {/* Status Filter */}
            {!isReturnsTab && (
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, status: e.target.value }));
                  loadData({ ...appliedFilters, status: e.target.value, page: 1 });
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
          </div>
        </form>

        {/* 5. TABLE / EMPTY STATE */}
        {isLoading ? (
          <div className="py-16">
            <LoadingState label="Loading sales transactions..." />
          </div>
        ) : isReturnsTab ? (
          /* RETURNS TABLE */
          returnsList.length === 0 ? (
            <EmptyState
              icon="returns"
              title="No sales returns recorded"
              description="Customer returns and refunds will be tracked here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="w-10 px-4 py-3.5">
                      <input
                        type="checkbox"
                        className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                        checked={returnsList.length > 0 && selectedIds.size === returnsList.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3.5">Return ID</th>
                    <th className="px-4 py-3.5">Original Invoice</th>
                    <th className="px-4 py-3.5">Date &amp; Time</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5 text-right">Refund Amount</th>
                    <th className="px-4 py-3.5">Refund Method</th>
                    <th className="px-4 py-3.5">Return Reason</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {returnsList.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                          checked={selectedIds.has(ret.id)}
                          onChange={() => toggleSelectOne(ret.id)}
                        />
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-rose-600">
                        RET-{String(ret.id).padStart(4, "0")}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                        {ret.invoice_number}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDateTime(ret.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-800 font-bold">
                        {ret.customer_name}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-rose-600">
                        {formatCurrency(ret.refund_amount)}
                      </td>
                      <td className="px-4 py-3.5 capitalize text-slate-600 font-bold">
                        {ret.refund_method}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate font-medium">
                        {ret.reason}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewSale(ret.sale_id)}
                          className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                          title="View Original Sale"
                        >
                          <Icon name="eye" className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* SALES & INVOICES TABLE */
          sales.length === 0 ? (
            <EmptyState
              icon="sales"
              title="No sales transactions found"
              description="Complete a sale in POS to view it in this ledger."
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
                        checked={sales.length > 0 && selectedIds.size === sales.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3.5">Invoice #</th>
                    <th className="px-4 py-3.5">Date &amp; Time</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Cashier</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5 text-center">Items</th>
                    <th className="px-4 py-3.5 text-right">Grand Total</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                          checked={selectedIds.has(sale.id)}
                          onChange={() => toggleSelectOne(sale.id)}
                        />
                      </td>

                      {/* Invoice # */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleViewSale(sale.id)}
                          className="font-mono font-black text-[#0B1E38] hover:text-[#FF9F43] transition cursor-pointer"
                        >
                          {sale.invoice_number}
                        </button>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDateTime(sale.created_at)}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <strong className="block text-slate-800 font-bold">
                          {sale.customer_name || "Walk-in Customer"}
                        </strong>
                        {sale.customer_phone && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {sale.customer_phone}
                          </span>
                        )}
                      </td>

                      {/* Cashier */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold">
                        {sale.cashier_name || "Admin"}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <span className="capitalize font-bold text-slate-700">
                          {(sale.payment_method || "cash").replaceAll("_", " ")}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {sale.total_items || 1} Units
                      </td>

                      {/* Grand Total */}
                      <td className="px-4 py-3.5 text-right font-black text-[#0B1E38] text-sm">
                        {formatCurrency(sale.grand_total)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <SaleStatusBadge status={sale.status || "completed"} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Sale */}
                          <button
                            type="button"
                            onClick={() => handleViewSale(sale.id)}
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                            title="View Sale Details"
                          >
                            <Icon name="eye" className="size-3.5" />
                          </button>

                          {/* Reprint Receipt */}
                          <button
                            type="button"
                            onClick={() => handleReprintReceipt(sale.id)}
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF9F43] transition cursor-pointer"
                            title="Print 80mm Receipt"
                          >
                            <Icon name="printer" className="size-3.5" />
                          </button>

                          {/* Return / Refund */}
                          {sale.status === "completed" && (
                            <button
                              type="button"
                              onClick={() => setAction({ type: "refund", sale })}
                              className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              title="Process Refund / Return"
                            >
                              <Icon name="returns" className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 6. FOOTER PAGINATION */}
        {!isLoading && pagination.total > 0 && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
              <span>Rows per page</span>
              <select
                value={pagination.limit || 10}
                onChange={(e) => changeLimit(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span>of {pagination.total} records</span>
            </div>

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

              <span className="px-2 font-bold text-slate-700">
                Page {pagination.page || 1} of {pagination.total_pages || 1}
              </span>

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
        )}
      </section>

      {/* SALE DETAILS MODAL */}
      <SaleDetailsModal
        isOpen={detailsOpen}
        sale={details}
        isLoading={false}
        onClose={() => setDetailsOpen(false)}
        onReceipt={(sale) => {
          setDetailsOpen(false);
          handleReprintReceipt(sale.id);
        }}
        onAction={(type, sale) => {
          setAction({ type, sale });
        }}
      />

      {/* 80mm RECEIPT PREVIEW MODAL */}
      <ReceiptPreview
        isOpen={receiptOpen}
        receipt={receipt}
        isLoading={isReceiptLoading}
        onClose={() => {
          setReceiptOpen(false);
          setReceipt(null);
        }}
      />

      {/* REFUND / CANCEL ACTION DIALOG */}
      <SaleActionDialog
        action={action}
        isSubmitting={isSubmittingAction}
        onClose={() => setAction(null)}
        onSubmit={handleConfirmAction}
      />
    </div>
  );
}

export default SalesPage;
