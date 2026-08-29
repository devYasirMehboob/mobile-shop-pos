import { useState, useMemo } from "react";
import Icon from "../Icon";
import { display } from "./reportFormat";

export default function ReportTable({
  rows = [],
  columns = [],
  filters = {},
  onSort,
  pagination,
  onPageChange,
  onLimitChange,
}) {
  const [localSearch, setLocalSearch] = useState("");
  const [clientSortKey, setClientSortKey] = useState(null);
  const [clientSortDir, setClientSortDir] = useState("desc");
  const [pageSize, setPageSize] = useState(filters.limit || 20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // 1. Filter rows by local search query
  const filteredRows = useMemo(() => {
    if (!localSearch.trim()) return rows;
    const query = localSearch.toLowerCase().trim();
    return rows.filter((row) =>
      columns.some(([key]) => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      })
    );
  }, [rows, columns, localSearch]);

  // 2. Sort rows if client-side sort is triggered
  const sortedRows = useMemo(() => {
    if (!clientSortKey) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      let valA = a[clientSortKey];
      let valB = b[clientSortKey];

      // Numerical comparison
      if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return clientSortDir === "asc" ? -1 : 1;
      if (valA > valB) return clientSortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, clientSortKey, clientSortDir]);

  // 3. Paginate rows
  const effectivePageSize = Number(pageSize) || 20;
  const totalRecords = sortedRows.length;
  const totalPages = Math.ceil(totalRecords / effectivePageSize) || 1;
  const paginatedRows = useMemo(() => {
    // If backend pagination is handled externally and no local search, use rows as-is
    if (!localSearch && pagination) return sortedRows;
    const start = (currentPage - 1) * effectivePageSize;
    return sortedRows.slice(start, start + effectivePageSize);
  }, [sortedRows, currentPage, effectivePageSize, localSearch, pagination]);

  // Helper to get row unique key
  function getRowKey(row, index) {
    return (
      row.id ||
      row.product_id ||
      row.category_id ||
      row.user_id ||
      row.period_key ||
      row.period_start ||
      row.payment_method ||
      row.invoice_number ||
      `row-${index}`
    );
  }

  // 4. Selection handlers (Select All / Deselect All / Select Single)
  function toggleSelectAll() {
    if (paginatedRows.length === 0) return;
    const allVisibleSelected = paginatedRows.every((row, idx) =>
      selectedKeys.has(getRowKey(row, idx))
    );

    if (allVisibleSelected) {
      const next = new Set(selectedKeys);
      paginatedRows.forEach((row, idx) => next.delete(getRowKey(row, idx)));
      setSelectedKeys(next);
    } else {
      const next = new Set(selectedKeys);
      paginatedRows.forEach((row, idx) => next.add(getRowKey(row, idx)));
      setSelectedKeys(next);
    }
  }

  function toggleSelectOne(rowKey) {
    const next = new Set(selectedKeys);
    if (next.has(rowKey)) {
      next.delete(rowKey);
    } else {
      next.add(rowKey);
    }
    setSelectedKeys(next);
  }

  // Handle column header click
  function handleHeaderClick(key) {
    if (onSort) {
      onSort(key);
    }
    if (clientSortKey === key) {
      setClientSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setClientSortKey(key);
      setClientSortDir("desc");
    }
  }

  // Handle Entries Per Page change
  function handlePageSizeChange(e) {
    const newLimit = Number(e.target.value);
    setPageSize(newLimit);
    setCurrentPage(1);
    if (onLimitChange) {
      onLimitChange(newLimit);
    }
  }

  // Export visible/selected data to CSV
  function handleExportCsv() {
    if (!sortedRows.length) return;
    const rowsToExport =
      selectedKeys.size > 0
        ? sortedRows.filter((row, idx) => selectedKeys.has(getRowKey(row, idx)))
        : sortedRows;

    const headers = columns.map(([, title]) => `"${title.replace(/"/g, '""')}"`).join(",");
    const csvRows = rowsToExport.map((row) =>
      columns
        .map(([key]) => {
          const val = display(key, row[key]) || "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Calculate entry indices
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const endIndex = Math.min(currentPage * effectivePageSize, totalRecords);
  const allVisibleSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((row, idx) => selectedKeys.has(getRowKey(row, idx)));

  return (
    <div className="space-y-4">
      {/* DATATABLE TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        {/* Left: Entries Per Page & Selection Status */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-black text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          {/* Selection Badge */}
          {selectedKeys.size > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800 animate-in fade-in">
              <span>
                Selected: <strong>{selectedKeys.size}</strong> rows
              </span>
              <button
                type="button"
                onClick={() => setSelectedKeys(new Set())}
                className="text-[11px] font-black text-orange-600 hover:text-orange-900 underline cursor-pointer"
              >
                Deselect all
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Table Search & CSV Export */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-64">
            <Icon
              name="search"
              className="absolute left-3 top-2.5 size-3.5 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Quick search table..."
              className="h-8.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8.5 pr-7 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 shadow-2xs transition"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!sortedRows.length}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition cursor-pointer shadow-2xs disabled:opacity-50"
            title={
              selectedKeys.size > 0
                ? `Export ${selectedKeys.size} selected rows to CSV`
                : "Export all visible rows to CSV"
            }
          >
            <Icon name="download" className="size-3 text-emerald-600" />
            <span>{selectedKeys.size > 0 ? `CSV (${selectedKeys.size})` : "CSV"}</span>
          </button>
        </div>
      </div>

      {/* DATATABLE CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-[#F8F9FA] border-b border-slate-200/80 text-[10px] uppercase font-black tracking-wider text-slate-500">
            <tr>
              {/* SELECT ALL / DESELECT ALL CHECKBOX HEADER */}
              <th className="w-10 px-4 py-3.5 text-center select-none">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                />
              </th>

              {columns.map(([key, title]) => {
                const isSorted = clientSortKey === key || filters.sort_by === key;
                const sortDir = clientSortKey === key ? clientSortDir : filters.sort_direction;

                return (
                  <th
                    key={key}
                    onClick={() => handleHeaderClick(key)}
                    className="whitespace-nowrap px-4 py-3.5 font-extrabold cursor-pointer select-none hover:bg-slate-100/70 hover:text-[#0B1E38] transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{title}</span>
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                        {isSorted ? (
                          sortDir === "asc" ? (
                            <span className="text-[#FF9F43] font-black">▲</span>
                          ) : (
                            <span className="text-[#FF9F43] font-black">▼</span>
                          )
                        ) : (
                          <span className="opacity-0 group-hover:opacity-60 text-slate-400">⇅</span>
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-xs text-slate-400 font-bold">
                  No matching records found for "{localSearch}"
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIdx) => {
                const rowKey = getRowKey(row, rowIdx);
                const isSelected = selectedKeys.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={`transition ${
                      isSelected ? "bg-orange-50/60 hover:bg-orange-50/80" : "hover:bg-slate-50/70"
                    }`}
                  >
                    {/* ROW SELECT CHECKBOX */}
                    <td className="w-10 px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Select row ${rowIdx + 1}`}
                        className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(rowKey)}
                      />
                    </td>

                    {columns.map(([key]) => {
                      const rawVal = row[key];
                      const isMoneyCol = [
                        "grand_total",
                        "amount",
                        "net_sales",
                        "gross_sales",
                        "gross_profit",
                        "cost_of_goods",
                        "estimated_net_profit",
                        "estimated_stock_value",
                        "cost",
                        "expenses",
                        "net_profit",
                      ].includes(key);

                      const isNegative = typeof rawVal === "number" && rawVal < 0;
                      const isNetProfit = key === "net_profit" || key === "estimated_net_profit" || key === "gross_profit";

                      return (
                        <td
                          key={key}
                          className={`whitespace-nowrap px-4 py-3.5 ${
                            key.includes("status") ? "capitalize" : ""
                          } ${
                            isMoneyCol
                              ? isNegative
                                ? "font-black text-rose-600"
                                : isNetProfit && rawVal > 0
                                ? "font-black text-emerald-600"
                                : "font-extrabold text-[#0B1E38]"
                              : "text-slate-600"
                          }`}
                        >
                          {key.includes("status") ? (
                            <span
                              className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border shadow-2xs ${
                                String(rawVal).includes("out") ||
                                rawVal === "cancelled" ||
                                rawVal === "voided"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : String(rawVal).includes("low") || rawVal === "refunded"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {display(key, rawVal)}
                            </span>
                          ) : (
                            display(key, rawVal)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DATATABLE FOOTER: INFO + NUMBERED PAGINATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs no-print">
        {/* Record count info */}
        <p className="text-slate-500 font-semibold">
          Showing <span className="font-extrabold text-[#0B1E38]">{startIndex}</span> to{" "}
          <span className="font-extrabold text-[#0B1E38]">{endIndex}</span> of{" "}
          <span className="font-extrabold text-[#0B1E38]">{totalRecords}</span> entries
          {localSearch && ` (filtered from ${rows.length} total)`}
        </p>

        {/* Numbered Pagination Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                const p = currentPage - 1;
                setCurrentPage(p);
                if (onPageChange) onPageChange(p);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              const isActive = currentPage === pageNum;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    setCurrentPage(pageNum);
                    if (onPageChange) onPageChange(pageNum);
                  }}
                  className={`size-8 rounded-xl text-xs font-black transition cursor-pointer shadow-2xs ${
                    isActive
                      ? "bg-[#FF9F43] text-white shadow-orange-500/20"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const p = currentPage + 1;
                setCurrentPage(p);
                if (onPageChange) onPageChange(p);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
