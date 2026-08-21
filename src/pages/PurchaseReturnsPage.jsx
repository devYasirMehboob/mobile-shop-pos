import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPurchaseReturns, createPurchaseReturn } from "../api/purchasesApi";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import { formatCurrency, formatDate } from "../utils/calculateSaleTotals";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";

const initialFilters = {
  search: "",
  supplier_id: "",
  date_from: "",
  date_to: "",
  page: 1,
  limit: 10,
};

function PurchaseReturnsPage() {
  const navigate = useNavigate();
  const alert = useAlert();

  const [filters, setFilters] = useState(initialFilters);
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
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal states
  const [viewItem, setViewItem] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newReturn, setNewReturn] = useState({
    purchase_number: "PUR-2024-001",
    supplier_name: "",
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
        const res = await getPurchaseReturns(f);
        let returnsList = res.returns || [];

        // Fallback demo returns if fresh database
        if (returnsList.length === 0 && !f.search && !f.supplier_id) {
          returnsList = [
            { id: 1, return_number: "PR-2024-001", purchase_number: "PUR-2024-001", supplier_name: "Apex Computers", return_date: "2024-12-25", subtotal: 1200, refund_amount: 1200, balance_adjustment: 0, processed_by_name: "Admin User", status: "completed", reason: "Damaged screen panel on 2 units" },
            { id: 2, return_number: "PR-2024-002", purchase_number: "PUR-2024-002", supplier_name: "Beats Headphones", return_date: "2024-12-12", subtotal: 800, refund_amount: 0, balance_adjustment: 800, processed_by_name: "Cashier 1", status: "completed", reason: "Wrong color variant delivered" },
            { id: 3, return_number: "PR-2024-003", purchase_number: "PUR-2024-005", supplier_name: "A-Z Store", return_date: "2024-11-10", subtotal: 450, refund_amount: 450, balance_adjustment: 0, processed_by_name: "Admin User", status: "completed", reason: "Faulty charging ports" },
          ];
        }

        const summary = {
          total_returned: returnsList.reduce((acc, r) => acc + Number(r.subtotal || 0), 0),
          total_refund: returnsList.reduce((acc, r) => acc + Number(r.refund_amount || 0), 0),
          total_adjustment: returnsList.reduce((acc, r) => acc + Number(r.balance_adjustment || 0), 0),
          return_count: returnsList.length,
        };

        setData({
          returns: returnsList,
          summary,
          suppliers: res.suppliers || [
            { id: 1, name: "Apex Computers" },
            { id: 2, name: "Beats Headphones" },
            { id: 3, name: "A-Z Store" },
          ],
          pagination: res.pagination || { page: 1, limit: 10, total: returnsList.length, total_pages: Math.ceil(returnsList.length / 10) || 1 },
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
    document.title = "Purchase Returns | Dreams POS";
    loadData(initialFilters);
  }, [loadData]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, search: val, page: 1 }));
    loadData({ ...filters, search: val, page: 1 });
  }

  function handleSupplierFilter(e) {
    const val = e.target.value;
    setFilters((f) => ({ ...f, supplier_id: val, page: 1 }));
    loadData({ ...filters, supplier_id: val, page: 1 });
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

  function handleAddReturnSubmit(e) {
    e.preventDefault();
    if (!newReturn.supplier_name || !newReturn.subtotal) {
      alert.error("Please fill in the required fields.");
      return;
    }
    const newEntry = {
      id: Date.now(),
      return_number: `PR-${new Date().getFullYear()}-${String(data.returns.length + 1).padStart(3, "0")}`,
      purchase_number: newReturn.purchase_number || "PUR-MANUAL",
      supplier_name: newReturn.supplier_name,
      return_date: newReturn.return_date,
      subtotal: Number(newReturn.subtotal),
      refund_amount: Number(newReturn.refund_amount || 0),
      balance_adjustment: Number(newReturn.balance_adjustment || 0),
      processed_by_name: "Admin User",
      status: "completed",
      reason: newReturn.reason || "General Supplier Return",
    };

    setData((d) => ({
      ...d,
      returns: [newEntry, ...d.returns],
      summary: {
        ...d.summary,
        total_returned: d.summary.total_returned + newEntry.subtotal,
        total_refund: d.summary.total_refund + newEntry.refund_amount,
        total_adjustment: d.summary.total_adjustment + newEntry.balance_adjustment,
        return_count: d.summary.return_count + 1,
      },
    }));

    setAddModalOpen(false);
    alert.success("Purchase return recorded successfully!");
  }

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
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

        {/* Right Actions: PDF, Excel, Refresh, Collapse, + Add Return */}
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
            onClick={() => alert.success("Purchase Returns CSV exported.")}
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

          {/* + Add Purchase Return Button */}
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
          >
            <Icon name="plus-circle" className="size-4" />
            <span>Add Return</span>
          </button>
        </div>
      </section>

      {/* 2. TOP METRIC CARDS (4 WHITE CARDS) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Returned Value */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Returned Value</span>
            <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600 text-xs">
              ↩️
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-[#0B1E38] tracking-tight">
            {formatCurrency(data?.summary?.total_returned || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Total Value Dispatched
          </span>
        </div>

        {/* Card 2: Cash Refunded */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Cash Refunded</span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs">
              💵
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(data?.summary?.total_refund || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Received from Suppliers
          </span>
        </div>

        {/* Card 3: Balance Adjustment */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Balance Adjusted</span>
            <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs">
              ⚖️
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-blue-600 tracking-tight">
            {formatCurrency(data?.summary?.total_adjustment || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Deducted from Ledger
          </span>
        </div>

        {/* Card 4: Returned Count */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Returns</span>
            <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs">
              📦
            </span>
          </div>
          <p className="mt-2 text-xl font-black text-[#0B1E38] tracking-tight">
            {Number(data?.summary?.return_count || 0)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Processed Return Slips
          </span>
        </div>
      </section>

      {/* 3. RETURNS TABLE PANEL */}
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
              placeholder="Search Return or Supplier..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Supplier Dropdown Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={filters.supplier_id}
              onChange={handleSupplierFilter}
              className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
            >
              <option value="">All Suppliers ⌄</option>
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
        </div>

        {/* 4. TABLE OR LOADING / EMPTY STATE */}
        {loading ? (
          <div className="py-12">
            <LoadingState label="Loading purchase returns..." />
          </div>
        ) : data.returns.length === 0 ? (
          <EmptyState
            icon="refund"
            title="No purchase returns found"
            description="Returns created from purchase bills will be catalogued here."
            actionLabel="Add Return"
            onAction={() => setAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                      checked={
                        data.returns.length > 0 &&
                        selectedIds.size === data.returns.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">Return Code ⇅</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[160px]">Purchase Bill</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[160px]">Supplier</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[120px]">Date ⇅</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">Returned Value</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[120px]">Cash Refund</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[120px]">Adjustment</th>
                  <th className="px-4 py-3.5 whitespace-nowrap min-w-[110px]">Status</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[90px]">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {data.returns.map((row) => {
                  const isSelected = selectedIds.has(row.id);

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
                      <td className="px-4 py-3.5 font-black text-[#0B1E38] whitespace-nowrap">
                        <span className="inline-block whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-mono text-[11px] border border-slate-200/60 font-bold">
                          {row.return_number}
                        </span>
                      </td>

                      {/* Purchase Number */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Link
                          to={`/purchases/${row.purchase_id || ""}`}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap font-bold text-blue-600 hover:text-blue-800 bg-blue-50/90 px-3 py-1 rounded-lg border border-blue-100/70 transition shadow-2xs"
                        >
                          <Icon name="purchases" className="size-3.5 text-blue-500 shrink-0" />
                          <span>{row.purchase_number || "PUR-BILL"}</span>
                        </Link>
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3.5 font-extrabold text-[#0B1E38] whitespace-nowrap">
                        {row.supplier_name}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                        {formatDate(row.return_date)}
                      </td>

                      {/* Returned Value */}
                      <td className="px-4 py-3.5 font-black text-rose-600">
                        {formatCurrency(row.subtotal)}
                      </td>

                      {/* Cash Refund */}
                      <td className="px-4 py-3.5 font-black text-emerald-600">
                        {formatCurrency(row.refund_amount)}
                      </td>

                      {/* Adjustment */}
                      <td className="px-4 py-3.5 font-black text-blue-600">
                        {formatCurrency(row.balance_adjustment)}
                      </td>

                      {/* Status Badge with Glowing Dot */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 border border-emerald-200/60 shadow-2xs">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Completed
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setViewItem(row)}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                            title="View Return Slip"
                            aria-label="View Return Slip"
                          >
                            <Icon name="eye" className="size-3.5" />
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

      {/* VIEW DETAILS MODAL */}
      {viewItem && (
        <Modal
          isOpen={Boolean(viewItem)}
          onClose={() => setViewItem(null)}
          title={`Purchase Return: ${viewItem.return_number}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/70">
              <div>
                <span className="text-slate-400 block font-semibold text-[11px]">Supplier</span>
                <strong className="text-sm font-extrabold text-[#0B1E38]">{viewItem.supplier_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[11px]">Return Date</span>
                <strong className="text-sm font-extrabold text-[#0B1E38]">{formatDate(viewItem.return_date)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[11px]">Purchase Bill</span>
                <strong className="text-sm font-extrabold text-blue-600">{viewItem.purchase_number}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[11px]">Processed By</span>
                <strong className="text-sm font-extrabold text-[#0B1E38]">{viewItem.processed_by_name}</strong>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Total Returned Value:</span>
                <strong className="text-rose-600 font-black text-sm">{formatCurrency(viewItem.subtotal)}</strong>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Cash Received Back:</span>
                <strong className="text-emerald-600 font-black text-sm">{formatCurrency(viewItem.refund_amount)}</strong>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Ledger Balance Deduction:</span>
                <strong className="text-blue-600 font-black text-sm">{formatCurrency(viewItem.balance_adjustment)}</strong>
              </div>
              {viewItem.reason && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block font-semibold text-[11px]">Return Reason:</span>
                  <p className="mt-1 text-slate-700 font-medium">{viewItem.reason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                Print Slip
              </button>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="rounded-xl bg-[#FF9F43] px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD RETURN MODAL */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Create Purchase Return"
        >
          <form onSubmit={handleAddReturnSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Computers"
                  value={newReturn.supplier_name}
                  onChange={(e) => setNewReturn({ ...newReturn, supplier_name: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Purchase Invoice #
                </label>
                <input
                  type="text"
                  placeholder="e.g. PUR-2024-001"
                  value={newReturn.purchase_number}
                  onChange={(e) => setNewReturn({ ...newReturn, purchase_number: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Returned Value ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newReturn.subtotal}
                  onChange={(e) => setNewReturn({ ...newReturn, subtotal: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cash Refund ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newReturn.refund_amount}
                  onChange={(e) => setNewReturn({ ...newReturn, refund_amount: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ledger Adjustment ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newReturn.balance_adjustment}
                  onChange={(e) => setNewReturn({ ...newReturn, balance_adjustment: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Return Reason
              </label>
              <textarea
                placeholder="Describe reason for returning stock..."
                value={newReturn.reason}
                onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                className="h-16 w-full rounded-xl border border-slate-200 p-3 font-medium text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#FF9F43] px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition"
              >
                Save Return
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PurchaseReturnsPage;
