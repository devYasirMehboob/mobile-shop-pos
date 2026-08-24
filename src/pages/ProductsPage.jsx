import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCategories } from "../api/categoriesApi";
import { getUnits } from "../api/unitsApi";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  productImageUrl,
  updateProduct,
  generateProductBarcode,
} from "../api/productsApi";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import ProductDetails from "../components/products/ProductDetails";
import ProductTable from "../components/products/ProductTable";
import DreamsProductFormPage from "../components/products/DreamsProductFormPage";
import usePermissions from "../hooks/usePermissions";
import useGlobalBarcodeScanner from "../hooks/useGlobalBarcodeScanner";

const emptyForm = {
  category_id: "",
  name: "",
  product_code: "",
  barcode: "",
  brand: "",
  description: "",
  purchase_cost: "0.00",
  selling_price: "",
  quantity: "0",
  minimum_stock: "5",
  tax: "0",
  discount_type: "fixed",
  discount_value: "0",
  warranty: "1 Year",
  manufacturer: "",
  manufactured_date: "",
  expiry_date: "",
  base_unit_id: "",
  default_purchase_unit_id: "",
  default_sale_unit_id: "",
  stock_mode: "own",
  stock_source_id: "",
  consumption_quantity: "",
  consumption_unit_id: "",
  consumption_quantity_base: "",
  allow_custom_sale: false,
  track_stock: true,
  track_batches: false,
  track_expiry: false,
  status: "active",
  image_data: null,
  remove_image: false,
};

const defaultFilters = {
  search: "",
  category_id: "",
  status: "",
  page: 1,
  limit: 10,
};

function ProductsPage() {
  const { can } = usePermissions();
  const canCreate = can("products.create");
  const canUpdate = can("products.update");
  const canDelete = can("products.delete");
  const canViewCosts = can("products.costs.view");
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const alert = useAlert();
  const confirmDialog = useConfirmation();

  const [formMode, setFormMode] = useState(null); // 'create' | 'edit' | null
  const [editingProduct, setEditingProduct] = useState(null);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  const loadProducts = useCallback(async (nextFilters, isRefresh = false) => {
    isRefresh ? setIsRefreshing(true) : setIsLoading(true);

    try {
      const data = await getProducts(nextFilters);
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, limit: nextFilters.limit || 10, total: (data.products || []).length, total_pages: 1 });
      setAppliedFilters(nextFilters);
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [alert]);

  useEffect(() => {
    document.title = "Products | Dreams POS";

    async function initialize() {
      try {
        const [categoryData, unitsData] = await Promise.all([
          getCategories(),
          getUnits(),
        ]);
        setCategories((categoryData || []).filter((category) => category.status === "active"));
        setUnits(unitsData.units || unitsData || []);
      } catch (error) {
        alert.error(normalizeApiError(error).message);
      }

      await loadProducts(defaultFilters);
    }

    initialize();
  }, [loadProducts, alert]);

  // Handle URL navigation like /products?action=new
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "new" && canCreate && formMode !== "create") {
      openCreateForm();
    }
  }, [location.search, canCreate, formMode]);

  useEffect(() => {
    if (location.state?.newBarcode && canCreate && categories.length > 0) {
      openCreateForm(location.state.newBarcode);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, canCreate, categories.length, navigate]);

  useGlobalBarcodeScanner(async (scannedBarcode) => {
    if (formMode !== null || detailsProduct !== null) return;

    try {
      const data = await getProducts({ search: scannedBarcode, limit: 1 });
      const found = (data.products || []).find((p) => p.barcode === scannedBarcode || p.product_code === scannedBarcode);

      if (found) {
        setFilters((f) => ({ ...f, search: scannedBarcode, page: 1 }));
        loadProducts({ ...appliedFilters, search: scannedBarcode, page: 1 });
      } else {
        if (canCreate) {
          openCreateForm(scannedBarcode);
        } else {
          alert.error(`No product found for ${scannedBarcode}.`);
        }
      }
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    }
  });

  function openCreateForm(initialBarcode = "") {
    if (initialBarcode && typeof initialBarcode === "string") {
      navigate(`/products/new?barcode=${encodeURIComponent(initialBarcode)}`);
    } else {
      navigate("/products/new");
    }
  }

  function openEditForm(product) {
    navigate(`/products/${product.id}/edit`);
  }

  function openDetails(product) {
    navigate(`/products/${product.id}`);
  }

  function closeForm(force = false) {
    if (isSubmitting && !force) return;
    setFormMode(null);
    setEditingProduct(null);
    setFormErrors({});
    setImagePreview(null);
    navigate("/products", { replace: true });
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    setFormValues((current) => {
      const next = { ...current, [name]: type === "checkbox" ? checked : value };
      return next;
    });
    setFormErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormErrors((current) => ({ ...current, image: "Only JPG, PNG, and WebP images are allowed." }));
      return;
    }

    if (file.size > 2097152) {
      setFormErrors((current) => ({ ...current, image: "The image must not exceed 2 MB." }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormValues((current) => ({ ...current, image_data: reader.result, remove_image: false }));
      setImagePreview(reader.result);
      setFormErrors((current) => ({ ...current, image: "" }));
    };
    reader.onerror = () => setFormErrors((current) => ({ ...current, image: "The selected image could not be read." }));
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setFormValues((current) => ({ ...current, image_data: null, remove_image: true }));
    setImagePreview(null);
  }

  async function handleGenerateBarcode() {
    try {
      const code = await generateProductBarcode();
      setFormValues((current) => ({ ...current, barcode: code }));
      setFormErrors((current) => ({ ...current, barcode: "" }));
    } catch {
      const randomCode = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      setFormValues((current) => ({ ...current, barcode: randomCode }));
      setFormErrors((current) => ({ ...current, barcode: "" }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormErrors({});

    let payload = { ...formValues };

    // Auto-generate barcode if left blank by admin
    if (!payload.barcode || !payload.barcode.trim()) {
      payload.barcode = `890${Date.now().toString().slice(-9)}`;
    } else {
      payload.barcode = payload.barcode.trim();
    }

    // Auto-generate SKU / product code if left blank
    if (!payload.product_code || !payload.product_code.trim()) {
      payload.product_code = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    } else {
      payload.product_code = payload.product_code.trim();
    }

    const requiredErrors = {};
    if (!payload.name.trim()) requiredErrors.name = "Product name is required.";
    if (!payload.category_id) requiredErrors.category_id = "Select a category.";
    if (!payload.selling_price || Number(payload.selling_price) <= 0) requiredErrors.selling_price = "Selling price must be greater than zero.";

    if (Object.keys(requiredErrors).length > 0) {
      setFormErrors(requiredErrors);
      alert.error("Please fill in all required fields highlighted in red.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = formMode === "edit"
        ? await updateProduct(editingProduct.id, payload)
        : await createProduct(payload);

      alert.success(response.message || "Product saved successfully.");
      closeForm(true);
      await loadProducts(appliedFilters);
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

  async function handleDelete(product) {
    const confirmed = await confirmDialog({
      title: "Delete Product",
      description: `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      confirmText: "Delete",
      tone: "danger",
      destructive: true,
      requiredText: product.name,
    });

    if (!confirmed) return;

    setActionId(product.id);
    try {
      const response = await deleteProduct(product.id);
      alert.success(response.message || "Product deleted.");
      await loadProducts(appliedFilters);
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    } finally {
      setActionId(null);
    }
  }

  function handleSearchChange(e) {
    const search = e.target.value;
    setFilters((current) => ({ ...current, search, page: 1 }));
    loadProducts({ ...appliedFilters, search, page: 1 });
  }

  function handleCategoryChange(e) {
    const category_id = e.target.value;
    setFilters((current) => ({ ...current, category_id, page: 1 }));
    loadProducts({ ...appliedFilters, category_id, page: 1 });
  }

  function changePage(page) {
    const nextFilters = { ...appliedFilters, page };
    setFilters((current) => ({ ...current, page }));
    loadProducts(nextFilters);
  }

  function changeLimit(limit) {
    const nextFilters = { ...appliedFilters, limit: Number(limit), page: 1 };
    setFilters(nextFilters);
    loadProducts(nextFilters);
  }

  // IF CREATING OR EDITING PRODUCT, RENDER DREAMS PRODUCT FORM VIEW
  if (formMode === "create" || formMode === "edit") {
    return (
      <DreamsProductFormPage
        values={formValues}
        errors={formErrors}
        isEdit={formMode === "edit"}
        categories={categories}
        units={units}
        imagePreview={imagePreview}
        isSubmitting={isSubmitting}
        onChange={handleFormChange}
        onImageChange={handleImageChange}
        onRemoveImage={removeImage}
        onSubmit={handleSubmit}
        onCancel={closeForm}
        onGenerateBarcode={handleGenerateBarcode}
      />
    );
  }

  // DEFAULT: PRODUCTS LIST VIEW
  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">Products</h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600">Products</span>
          </nav>
        </div>

        {/* Right Actions: Refresh, Fullscreen, + Add Product, Import */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Refresh Button */}
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => loadProducts(appliedFilters, true)}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Refresh List"
            aria-label="Refresh List"
          >
            <Icon name="refresh" className={`size-4 ${isRefreshing ? "animate-spin text-[#FF9F43]" : ""}`} />
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

          {/* + Add Product (Orange #FF9F43) */}
          {canCreate && (
            <button
              type="button"
              onClick={() => navigate("/products/new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
            >
              <Icon name="plus-circle" className="size-4" />
              <span>Add Product</span>
            </button>
          )}

          {/* Import Product (Deep Navy #0E2040) */}
          <button
            type="button"
            onClick={() => alert.info("Import feature ready for CSV/Excel uploads.")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E2040] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-slate-900/20 transition-all hover:bg-[#19325C] active:scale-95 cursor-pointer"
          >
            <Icon name="download" className="size-4" />
            <span>Import Product</span>
          </button>
        </div>
      </section>

      {/* 2. PRODUCTS WHITE CONTAINER */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        {/* Search & Category / Brand Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Filter Dropdowns on Right */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Category Dropdown Filter */}
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
              <Icon name="chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
            </div>

            {/* Brand Dropdown Filter */}
            <div className="relative">
              <select
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">Brand ⌄</option>
                <option value="apple">Apple</option>
                <option value="samsung">Samsung</option>
                <option value="lenovo">Lenovo</option>
                <option value="beats">Beats</option>
                <option value="nike">Nike</option>
                <option value="dior">Dior</option>
              </select>
              <Icon name="chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* 3. PRODUCT TABLE OR EMPTY / LOADING STATES */}
        {isLoading ? (
          <div className="py-12">
            <LoadingState label="Loading products catalogue..." />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon="products"
            title="No matching products"
            description="Try adjusting your search or category filters."
            actionLabel={canCreate ? "Add New Product" : null}
            onAction={canCreate ? () => openCreateForm() : undefined}
          />
        ) : (
          <ProductTable
            products={products}
            actionId={actionId}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onView={openDetails}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
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
                <option value="100">100</option>
              </select>
              <Icon name="chevron-down" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-2.5 text-slate-400" />
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
            {Array.from({ length: Math.min(5, pagination.total_pages || 1) }, (_, i) => i + 1).map((pageNum) => (
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
                  className={`grid size-8 place-items-center rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer`}
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
    </div>
  );
}

export default ProductsPage;
