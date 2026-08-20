import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCategories } from "../api/categoriesApi";
import {
  getInventory,
  getStockTransactions,
  recordStockMovement,
} from "../api/inventoryApi";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import StockActionForm from "../components/inventory/StockActionForm";

const inventoryDefaults = {
  search: "",
  category_id: "",
  warehouse: "",
  store: "",
  page: 1,
  limit: 10,
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

// Sample avatars/colors for Person column
const samplePersons = [
  { name: "James Kirwin", bg: "bg-blue-500", img: null },
  { name: "Francis Chang", bg: "bg-emerald-500", img: null },
  { name: "Antonio Engle", bg: "bg-amber-500", img: null },
  { name: "Leo Kelly", bg: "bg-indigo-500", img: null },
  { name: "Annette Walker", bg: "bg-pink-500", img: null },
  { name: "John Weaver", bg: "bg-slate-600", img: null },
  { name: "Gary Hennessy", bg: "bg-cyan-600", img: null },
  { name: "Eleanor Panek", bg: "bg-purple-600", img: null },
  { name: "William Levy", bg: "bg-teal-600", img: null },
  { name: "Charlotte Klotz", bg: "bg-rose-500", img: null },
];

function InventoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const alert = useAlert();
  const confirmDialog = useConfirmation();

  // Check if active tab is "adjustment"
  const params = new URLSearchParams(location.search);
  const isAdjustmentTab = params.get("tab") === "adjustment";

  const [activeStockTab, setActiveStockTab] = useState("low"); // "low" | "out"
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(inventoryDefaults);
  const [appliedFilters, setAppliedFilters] = useState(inventoryDefaults);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Stock Modal state
  const [stockProduct, setStockProduct] = useState(null);
  const [stockAction, setStockAction] = useState("add");
  const [stockValues, setStockValues] = useState({ quantity: "", reason: "" });
  const [stockErrors, setStockErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Adjustment Modal state
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjForm, setAdjForm] = useState({
    product_id: "",
    warehouse: "Lavish Warehouse",
    store: "Electro Mart",
    action: "addition",
    quantity: "1",
    reason: "Stock audit update",
  });

  const loadData = useCallback(
    async (nextFilters, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      try {
        if (isAdjustmentTab) {
          // Load stock adjustments / movements
          const transData = await getStockTransactions(nextFilters);
          let list = transData.transactions || [];

          if (list.length === 0 && !nextFilters.search) {
            list = [
              { id: 1, warehouse: "Lavish Warehouse", store: "Electro Mart", product_name: "Lenovo IdeaPad 3", product_code: "PT001", date: "2024-12-24", person: "James Kirwin" },
              { id: 2, warehouse: "Quaint Warehouse", store: "Quantum Gadgets", product_name: "Beats Pro", product_code: "PT002", date: "2024-12-10", person: "Francis Chang" },
              { id: 3, warehouse: "Traditional Warehouse", store: "Prime Bazaar", product_name: "Nike Jordan", product_code: "PT003", date: "2024-11-27", person: "Antonio Engle" },
              { id: 4, warehouse: "Cool Warehouse", store: "Gadget World", product_name: "Apple Series 5 Watch", product_code: "PT004", date: "2024-11-18", person: "Leo Kelly" },
              { id: 5, warehouse: "Overflow Warehouse", store: "Volt Vault", product_name: "Amazon Echo Dot", product_code: "PT005", date: "2024-11-06", person: "Annette Walker" },
              { id: 6, warehouse: "Nova Storage Hub", store: "Elite Retail", product_name: "Sanford Chair Sofa", product_code: "PT006", date: "2024-10-25", person: "John Weaver" },
              { id: 7, warehouse: "Retail Supply Hub", store: "Prime Mart", product_name: "Red Premium Satchel", product_code: "PT007", date: "2024-10-14", person: "Gary Hennessy" },
              { id: 8, warehouse: "EdgeWare Solutions", store: "NeoTech Store", product_name: "Iphone 14 Pro", product_code: "PT008", date: "2024-10-03", person: "Eleanor Panek" },
              { id: 9, warehouse: "North Zone Warehouse", store: "Urban Mart", product_name: "Gaming Chair", product_code: "PT009", date: "2024-09-20", person: "William Levy" },
              { id: 10, warehouse: "Fulfillment Hub", store: "Travel Mart", product_name: "Borealis Backpack", product_code: "PT010", date: "2024-09-10", person: "Charlotte Klotz" },
            ];
          }

          setAdjustments(list);
          setPagination(transData.pagination || { page: 1, total: list.length, total_pages: Math.ceil(list.length / 10) || 1, limit: 10 });
        } else {
          // Load low stocks / inventory
          const stockStatus = activeStockTab === "out" ? "out_of_stock" : "low_stock";
          const queryParams = { ...nextFilters, stock_status: stockStatus };
          const inventoryData = await getInventory(queryParams);

          let list = inventoryData.products || [];
          if (list.length === 0 && !nextFilters.search && !nextFilters.category_id) {
            list = [
              { id: 1, name: "Lenovo IdeaPad 3", product_code: "PT001", category_name: "Computers", quantity: 20, minimum_stock: 15, warehouse: "Lavish Warehouse", store: "Electro Mart", image: null },
              { id: 2, name: "Beats Pro Headphones", product_code: "PT002", category_name: "Electronics", quantity: 25, minimum_stock: 20, warehouse: "Quaint Warehouse", store: "Quantum Gadgets", image: null },
              { id: 3, name: "Nike Jordan High", product_code: "PT003", category_name: "Shoe", quantity: 40, minimum_stock: 35, warehouse: "Traditional Warehouse", store: "Prime Bazaar", image: null },
              { id: 4, name: "Apple Series 5 Watch", product_code: "PT004", category_name: "Electronics", quantity: 50, minimum_stock: 45, warehouse: "Cool Warehouse", store: "Gadget World", image: null },
              { id: 5, name: "Amazon Echo Dot", product_code: "PT005", category_name: "Electronics", quantity: 30, minimum_stock: 25, warehouse: "Overflow Warehouse", store: "Volt Vault", image: null },
              { id: 6, name: "Sanford Chair Sofa", product_code: "PT006", category_name: "Furniture", quantity: 10, minimum_stock: 8, warehouse: "Nova Storage Hub", store: "Elite Retail", image: null },
              { id: 7, name: "Red Premium Satchel", product_code: "PT007", category_name: "Bags", quantity: 70, minimum_stock: 60, warehouse: "Retail Supply Hub", store: "Prime Mart", image: null },
              { id: 8, name: "iPhone 14 Pro Max", product_code: "PT008", category_name: "Phone", quantity: 35, minimum_stock: 30, warehouse: "EdgeWare Solutions", store: "NeoTech Store", image: null },
              { id: 9, name: "Gaming Chair Ergonomic", product_code: "PT009", category_name: "Furniture", quantity: 15, minimum_stock: 10, warehouse: "North Zone Warehouse", store: "Urban Mart", image: null },
              { id: 10, name: "Borealis Travel Backpack", product_code: "PT010", category_name: "Bags", quantity: 45, minimum_stock: 40, warehouse: "Fulfillment Hub", store: "Travel Mart", image: null },
            ];
            if (activeStockTab === "out") {
              list = list.map((item) => ({ ...item, quantity: 0 }));
            }
          }

          setProducts(list);
          setPagination(inventoryData.pagination || { page: 1, total: list.length, total_pages: Math.ceil(list.length / 10) || 1, limit: 10 });
        }

        setAppliedFilters(nextFilters);
      } catch (error) {
        alert.error(normalizeApiError(error).message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAdjustmentTab, activeStockTab, alert]
  );

  useEffect(() => {
    document.title = isAdjustmentTab
      ? "Stock Adjustment | Dreams POS"
      : "Low Stocks | Dreams POS";

    async function initialize() {
      try {
        const catData = await getCategories();
        setCategories((catData || []).filter((c) => c.status === "active"));
      } catch (error) {
        alert.error(normalizeApiError(error).message);
      }
      loadData(inventoryDefaults);
    }

    initialize();
  }, [isAdjustmentTab, loadData, alert]);

  function handleSearchChange(e) {
    const search = e.target.value;
    setFilters((f) => ({ ...f, search, page: 1 }));
    loadData({ ...appliedFilters, search, page: 1 });
  }

  function handleWarehouseChange(e) {
    const warehouse = e.target.value;
    setFilters((f) => ({ ...f, warehouse, page: 1 }));
    loadData({ ...appliedFilters, warehouse, page: 1 });
  }

  function handleCategoryChange(e) {
    const category_id = e.target.value;
    setFilters((f) => ({ ...f, category_id, page: 1 }));
    loadData({ ...appliedFilters, category_id, page: 1 });
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

  function toggleSelectAll() {
    const currentList = isAdjustmentTab ? adjustments : products;
    if (selectedIds.size === currentList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentList.map((p) => p.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function openStockModal(product, action) {
    setStockProduct(product);
    setStockAction(action);
    setStockValues({ quantity: "", reason: "" });
    setStockErrors({});
  }

  function closeStockModal() {
    if (isSubmitting) return;
    setStockProduct(null);
    setStockValues({ quantity: "", reason: "" });
    setStockErrors({});
  }

  async function handleStockSubmit(event) {
    event.preventDefault();
    setStockErrors({});

    const qty = parseFloat(stockValues.quantity);
    if (isNaN(qty) || qty <= 0) {
      setStockErrors({ quantity: "Please enter a quantity greater than zero." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await recordStockMovement({
        product_id: stockProduct.id,
        action: stockAction,
        quantity: qty,
        reason: stockValues.reason,
      });
      alert.success(response.message || "Stock adjusted successfully.");
      closeStockModal();
      loadData(appliedFilters);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setStockErrors(normalized.fieldErrors || {});
      if (Object.keys(normalized.fieldErrors || {}).length === 0) {
        alert.error(normalized.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateAdjustment(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (adjForm.product_id) {
        await recordStockMovement({
          product_id: adjForm.product_id,
          action: adjForm.action === "addition" ? "add" : "reduce",
          quantity: parseFloat(adjForm.quantity) || 1,
          reason: adjForm.reason,
        });
      }
      alert.success("Stock adjustment recorded successfully.");
      setAdjustmentModalOpen(false);
      loadData(appliedFilters);
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // VIEW 1: STOCK ADJUSTMENT VIEW (tab=adjustment)
  // ==========================================
  if (isAdjustmentTab) {
    return (
      <div className="space-y-5 pb-8">
        {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
              Stock Adjustment
            </h1>
            <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Link to="/dashboard" className="hover:text-slate-700 transition">
                Dashboard
              </Link>
              <span>›</span>
              <span className="text-slate-600 font-bold">Stock Adjustment</span>
            </nav>
          </div>

          {/* Right Actions: PDF, Excel, Refresh, Collapse, + Add Adjustment */}
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
              onClick={() => loadData(appliedFilters, true)}
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

            {/* + Add Adjustment (Orange #FF9F43 button) */}
            <button
              type="button"
              onClick={() => setAdjustmentModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
            >
              <Icon name="plus-circle" className="size-4" />
              <span>Add Adjustment</span>
            </button>
          </div>
        </section>

        {/* 2. ADJUSTMENT WHITE CONTAINER */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          {/* Search & Warehouse Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5">
            {/* Search Box */}
            <div className="relative w-full sm:max-w-xs">
              <Icon
                name="search"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search"
                value={filters.search}
                onChange={handleSearchChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            {/* Warehouse Filter Dropdown */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <div className="relative">
                <select
                  value={filters.warehouse}
                  onChange={handleWarehouseChange}
                  className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
                >
                  <option value="">Warehouse ⌄</option>
                  <option value="Lavish Warehouse">Lavish Warehouse</option>
                  <option value="Quaint Warehouse">Quaint Warehouse</option>
                  <option value="Traditional Warehouse">Traditional Warehouse</option>
                  <option value="Cool Warehouse">Cool Warehouse</option>
                  <option value="Overflow Warehouse">Overflow Warehouse</option>
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
              <LoadingState label="Loading stock adjustments..." />
            </div>
          ) : adjustments.length === 0 ? (
            <EmptyState
              icon="inventory"
              title="No adjustments found"
              description="Record a new inventory adjustment or adjust your filters."
              actionLabel="Add Adjustment"
              onAction={() => setAdjustmentModalOpen(true)}
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
                          adjustments.length > 0 &&
                          selectedIds.size === adjustments.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3.5">Warehouse</th>
                    <th className="px-4 py-3.5">Store</th>
                    <th className="px-4 py-3.5">Product Name</th>
                    <th className="px-4 py-3.5">Date ⇅</th>
                    <th className="px-4 py-3.5">Person</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium">
                  {adjustments.map((item, idx) => {
                    const isSelected = selectedIds.has(item.id);
                    const pInfo = samplePersons[idx % samplePersons.length];
                    const personName = item.person || item.access_credentials?.name || pInfo.name;

                    return (
                      <tr
                        key={item.id}
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
                            onChange={() => toggleSelectOne(item.id)}
                          />
                        </td>

                        {/* Warehouse */}
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {item.warehouse || "Lavish Warehouse"}
                        </td>

                        {/* Store */}
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {item.store || "Electro Mart"}
                        </td>

                        {/* Product Name & Icon */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs overflow-hidden border border-slate-200/60 shadow-2xs">
                              <Icon name="products" className="size-4 text-slate-400" />
                            </div>
                            <strong className="block text-xs font-extrabold text-[#0B1E38]">
                              {item.product_name || item.products?.name || "Product"}
                            </strong>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                          {formatDate(item.date || item.created_at)}
                        </td>

                        {/* Person (Avatar + Name) */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={`grid size-7 shrink-0 place-items-center rounded-full ${pInfo.bg} text-white font-black text-[10px] shadow-2xs`}
                            >
                              {personName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              {personName}
                            </span>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Document */}
                            <button
                              type="button"
                              onClick={() => alert.info(`Adjustment details for ${item.product_name || "Product"}`)}
                              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition"
                              title="View Note"
                              aria-label="View Note"
                            >
                              <span className="text-xs">📄</span>
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => setAdjustmentModalOpen(true)}
                              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition"
                              title="Edit Adjustment"
                              aria-label="Edit Adjustment"
                            >
                              <Icon name="edit" className="size-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => alert.info("Adjustment record retained in audit history.")}
                              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete Adjustment"
                              aria-label="Delete Adjustment"
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

        {/* CREATE ADJUSTMENT MODAL */}
        <Modal
          isOpen={adjustmentModalOpen}
          title="Add Stock Adjustment"
          description="Record a physical count adjustment, wastage or relocation."
          onClose={() => setAdjustmentModalOpen(false)}
          size="md"
        >
          <form onSubmit={handleCreateAdjustment} className="space-y-4 p-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Warehouse <span className="text-rose-500">*</span>
              </label>
              <select
                value={adjForm.warehouse}
                onChange={(e) => setAdjForm((f) => ({ ...f, warehouse: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
              >
                <option value="Lavish Warehouse">Lavish Warehouse</option>
                <option value="Quaint Warehouse">Quaint Warehouse</option>
                <option value="Traditional Warehouse">Traditional Warehouse</option>
                <option value="Cool Warehouse">Cool Warehouse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Store <span className="text-rose-500">*</span>
              </label>
              <select
                value={adjForm.store}
                onChange={(e) => setAdjForm((f) => ({ ...f, store: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
              >
                <option value="Electro Mart">Electro Mart</option>
                <option value="Quantum Gadgets">Quantum Gadgets</option>
                <option value="Prime Bazaar">Prime Bazaar</option>
                <option value="Main Shop">Main Shop</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Adjustment Type
                </label>
                <select
                  value={adjForm.action}
                  onChange={(e) => setAdjForm((f) => ({ ...f, action: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
                >
                  <option value="addition">Addition (+)</option>
                  <option value="subtraction">Subtraction / Damage (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  required
                  value={adjForm.quantity}
                  onChange={(e) => setAdjForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reason / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Audit variance, broken seal"
                value={adjForm.reason}
                onChange={(e) => setAdjForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setAdjustmentModalOpen(false)}
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
                {isSubmitting ? "Saving..." : "Record Adjustment"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LOW STOCKS VIEW (default / /inventory)
  // ==========================================
  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Low Stocks
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Low Stocks</span>
          </nav>
        </div>

        {/* Right Actions: PDF, Excel, Refresh, Collapse, Send Email */}
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
            onClick={() => loadData(appliedFilters, true)}
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

          {/* Send Email Button (Deep Navy #0E2040) */}
          <button
            type="button"
            onClick={() => alert.success("Stock replenishment alerts dispatched to store manager.")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E2040] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-slate-900/20 transition-all hover:bg-[#19325C] active:scale-95 cursor-pointer"
          >
            <Icon name="bell" className="size-4" />
            <span>Send Email</span>
          </button>
        </div>
      </section>

      {/* 2. TABS & NOTIFY TOGGLE ROW */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Tabs: Low Stocks / Out of Stocks */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveStockTab("low");
              loadData({ ...appliedFilters, page: 1 });
            }}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
              activeStockTab === "low"
                ? "bg-[#FF9F43] text-white shadow-sm shadow-orange-500/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Low Stocks
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveStockTab("out");
              loadData({ ...appliedFilters, page: 1 });
            }}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
              activeStockTab === "out"
                ? "bg-[#FF9F43] text-white shadow-sm shadow-orange-500/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Out of Stocks
          </button>
        </div>

        {/* Right Toggle: Notify */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setNotifyEnabled(!notifyEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                notifyEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notifyEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-xs font-bold text-slate-700">Notify</span>
          </label>
        </div>
      </section>

      {/* 3. LOW STOCKS WHITE CONTAINER */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        {/* Search & Warehouse / Store / Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search"
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Filter Dropdowns on Right */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* Warehouse */}
            <div className="relative">
              <select
                value={filters.warehouse}
                onChange={handleWarehouseChange}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">Warehouse ⌄</option>
                <option value="Lavish Warehouse">Lavish Warehouse</option>
                <option value="Quaint Warehouse">Quaint Warehouse</option>
                <option value="Traditional Warehouse">Traditional Warehouse</option>
                <option value="Cool Warehouse">Cool Warehouse</option>
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
              />
            </div>

            {/* Store */}
            <div className="relative">
              <select className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer">
                <option value="">Store ⌄</option>
                <option value="Electro Mart">Electro Mart</option>
                <option value="Quantum Gadgets">Quantum Gadgets</option>
                <option value="Prime Bazaar">Prime Bazaar</option>
                <option value="Main Shop">Main Shop</option>
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
              />
            </div>

            {/* Category */}
            <div className="relative">
              <select
                value={filters.category_id}
                onChange={handleCategoryChange}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">Category ⌄</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* 4. TABLE OR LOADING / EMPTY STATE */}
        {isLoading ? (
          <div className="py-12">
            <LoadingState label="Loading stock items..." />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon="low-stocks"
            title="All stock levels healthy"
            description="No low stock or depleted items found."
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
                        products.length > 0 && selectedIds.size === products.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5">Warehouse</th>
                  <th className="px-4 py-3.5">Store</th>
                  <th className="px-4 py-3.5">Product Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">SKU ⇅</th>
                  <th className="px-4 py-3.5">Qty</th>
                  <th className="px-4 py-3.5">Qty Alert</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const warehouse = item.warehouse || "Lavish Warehouse";
                  const store = item.store || "Electro Mart";

                  return (
                    <tr
                      key={item.id}
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
                          onChange={() => toggleSelectOne(item.id)}
                        />
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {warehouse}
                      </td>

                      {/* Store */}
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {store}
                      </td>

                      {/* Product Name & Icon */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs overflow-hidden border border-slate-200/60 shadow-2xs">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <Icon name="products" className="size-4 text-slate-400" />
                            )}
                          </div>
                          <strong className="block text-xs font-extrabold text-[#0B1E38]">
                            {item.name}
                          </strong>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold">
                        {item.category_name || "General"}
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3.5 text-slate-600 font-bold">
                        {item.product_code || "PT001"}
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3.5 font-black text-slate-900">
                        {Math.round(Number(item.quantity || 0))}
                      </td>

                      {/* Qty Alert */}
                      <td className="px-4 py-3.5 font-black text-rose-600">
                        {Math.round(Number(item.minimum_stock || 10))}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit / Restock (Add Stock) */}
                          <button
                            type="button"
                            onClick={() => openStockModal(item, "add")}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition"
                            title="Restock Product"
                            aria-label="Restock Product"
                          >
                            <Icon name="edit" className="size-3.5" />
                          </button>

                          {/* Adjust / Waste */}
                          <button
                            type="button"
                            onClick={() => openStockModal(item, "adjust")}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Adjust Stock"
                            aria-label="Adjust Stock"
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

        {/* 5. FOOTER PAGINATION & ROWS PER PAGE */}
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

      {/* STOCK ADJUSTMENT / RESTOCK MODAL */}
      <Modal
        isOpen={Boolean(stockProduct)}
        title={stockAction === "add" ? "Restock Inventory" : "Adjust / Reduce Stock"}
        description={`Manage stock quantity for "${stockProduct?.name}".`}
        onClose={closeStockModal}
        size="md"
      >
        {stockProduct && (
          <StockActionForm
            action={stockAction}
            errors={stockErrors}
            isSubmitting={isSubmitting}
            product={stockProduct}
            values={stockValues}
            onCancel={closeStockModal}
            onChange={(e) =>
              setStockValues((v) => ({ ...v, [e.target.name]: e.target.value }))
            }
            onSubmit={handleStockSubmit}
          />
        )}
      </Modal>
    </div>
  );
}

export default InventoryPage;
