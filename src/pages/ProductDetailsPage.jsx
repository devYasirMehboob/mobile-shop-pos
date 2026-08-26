import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProduct, productImageUrl } from "../api/productsApi";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import usePermissions from "../hooks/usePermissions";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";
import { formatCurrency } from "../utils/calculateSaleTotals";

function formatDateTime(str) {
  if (!str) return "—";
  try {
    const d = new Date(str.replace(" ", "T"));
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return str;
  }
}

function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const alert = useAlert();

  const canEdit = can("products.update");
  const canViewCosts = can("products.view_costs");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getProduct(id);
        setProduct(data);
        document.title = `${data.name || "Product Details"} | BiteBlix POS`;
      } catch (e) {
        alert.error(normalizeApiError(e).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, alert]);

  if (loading) {
    return (
      <div className="py-24">
        <LoadingState label="Loading product details & inventory..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12">
        <EmptyState
          icon="products"
          title="Product not found"
          description="The requested product record does not exist or has been removed."
          actionLabel="Back to Products"
          onAction={() => navigate("/products")}
        />
      </div>
    );
  }

  const cost = Number(product.purchase_cost || 0);
  const price = Number(product.selling_price || 0);
  const margin =
    price > 0 && cost > 0
      ? (((price - cost) / price) * 100).toFixed(1)
      : null;
  const isLowStock =
    Number(product.track_stock) !== 0 &&
    Number(product.quantity || 0) <= Number(product.minimum_stock || 5);
  const isOutOfStock =
    Number(product.track_stock) !== 0 && Number(product.quantity || 0) <= 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Product Details
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <Link to="/products" className="hover:text-slate-700 transition">
              Products
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Back to List */}
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <span>‹</span>
            <span>Back to Products</span>
          </button>

          {/* Print Barcode Label */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Icon name="print" className="size-3.5 text-slate-500" />
            <span>Print Label</span>
          </button>

          {/* Edit Product (Orange #FF9F43) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => navigate(`/products/${product.id}/edit`)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
            >
              <Icon name="edit" className="size-3.5" />
              <span>Edit Product</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. TOP 4 METRIC SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Selling Price */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Selling Price</span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
              💵
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(price)}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Retail POS Price
          </span>
        </div>

        {/* Purchase Cost */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Purchase Cost</span>
            <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-black">
              🏷️
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0B1E38] tracking-tight">
            {canViewCosts ? formatCurrency(cost) : "•••"}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Unit Inward Cost
          </span>
        </div>

        {/* In-Stock Quantity */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Current Stock</span>
            <span className={`grid size-7 place-items-center rounded-lg text-xs font-black ${
              isOutOfStock
                ? "bg-rose-50 text-rose-600"
                : isLowStock
                ? "bg-amber-50 text-amber-600"
                : "bg-emerald-50 text-emerald-600"
            }`}>
              📦
            </span>
          </div>
          <p className={`mt-2 text-2xl font-black tracking-tight ${
            isOutOfStock ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-[#0B1E38]"
          }`}>
            {Number(product.track_stock) !== 0
              ? `${Number(product.quantity || 0)} Units`
              : "Untracked"}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Min Alert: {product.minimum_stock || 5} Units
          </span>
        </div>

        {/* Estimated Profit Margin */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Gross Margin</span>
            <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-black">
              📈
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#FF9F43] tracking-tight">
            {canViewCosts && margin ? `${margin}%` : "—"}
          </p>
          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
            Per Unit Markup
          </span>
        </div>
      </section>

      {/* 3. 2-COLUMN MAIN PRODUCT INFORMATION WORKSPACE */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left Column: Detailed Specifications */}
        <div className="space-y-6 min-w-0">
          {/* General Information Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <header className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                {/* Product Thumbnail Image */}
                <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-2xs">
                  {product.image || product.image_url ? (
                    <img
                      src={productImageUrl(product.image || product.image_url)}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-slate-400">
                      <Icon name="products" className="size-6 text-slate-300" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-black text-[#0B1E38] tracking-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {product.category_name || "General Category"} · Brand: {product.brand || "Universal"}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                product.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  : "bg-slate-100 text-slate-600 border border-slate-200/60"
              }`}>
                <span className={`size-1.5 rounded-full ${
                  product.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                }`} />
                {product.status || "active"}
              </span>
            </header>

            {/* Fields Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Product SKU / Code
                </span>
                <strong className="text-xs font-mono font-bold text-[#0B1E38] mt-1 block">
                  {product.product_code || "—"}
                </strong>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Barcode Number
                </span>
                <strong className="text-xs font-mono font-bold text-slate-700 mt-1 block">
                  {product.barcode || "No Barcode Assigned"}
                </strong>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Category
                </span>
                <span className="inline-block mt-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700 border border-blue-100/60">
                  {product.category_name || "General"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Brand / Make
                </span>
                <span className="inline-block mt-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700 border border-slate-200/60">
                  {product.brand || "Universal"}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Description
                </span>
                <p className="mt-1 text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                  {product.description || "No specific product description or notes recorded for this catalogue item."}
                </p>
              </div>
            </div>
          </section>

          {/* Pricing & Tax Breakdown Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-black text-[#0B1E38] border-b border-slate-100 pb-3">
              Pricing, Tax &amp; Discount Configuration
            </h3>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold text-slate-400 block">Unit Selling Price</span>
                <strong className="text-sm font-black text-emerald-600 mt-1 block">
                  {formatCurrency(product.selling_price)}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold text-slate-400 block">Unit Cost Price</span>
                <strong className="text-sm font-black text-slate-800 mt-1 block">
                  {canViewCosts ? formatCurrency(product.purchase_cost) : "•••"}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold text-slate-400 block">Applied Tax</span>
                <strong className="text-sm font-black text-[#0B1E38] mt-1 block">
                  {Number(product.tax || 0)}%
                </strong>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold text-slate-400 block">Discount Rule</span>
                <strong className="text-xs font-extrabold text-slate-700 capitalize mt-1 block">
                  {product.discount_type || "None"} ({formatCurrency(product.discount_value || 0)})
                </strong>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold text-slate-400 block">Allow Custom Price Sale</span>
                <strong className="text-xs font-extrabold text-slate-700 mt-1 block">
                  {product.allow_custom_sale ? "Allowed in POS" : "Fixed Only"}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold text-slate-400 block">Measurement Unit</span>
                <strong className="text-xs font-extrabold text-slate-700 capitalize mt-1 block">
                  {product.unit_type || "Piece"}
                </strong>
              </div>
            </div>
          </section>

          {/* Warranty & Manufacturer Information */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-black text-[#0B1E38] border-b border-slate-100 pb-3">
              Warranty &amp; Manufacturer Details
            </h3>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Warranty Coverage
                </span>
                <strong className="text-xs font-bold text-[#0B1E38] mt-1 block">
                  {product.warranty || "1 Year Warranty"}
                </strong>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Manufacturer / OEM
                </span>
                <strong className="text-xs font-bold text-slate-700 mt-1 block">
                  {product.manufacturer || "Official Brand Manufacturer"}
                </strong>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Manufactured Date
                </span>
                <span className="text-xs font-semibold text-slate-600 mt-1 block">
                  {product.manufactured_date || "—"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Expiry Date
                </span>
                <span className="text-xs font-semibold text-slate-600 mt-1 block">
                  {product.expiry_date || "Non-expiring"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Visual Barcode & Inventory Specifications */}
        <aside className="space-y-6">
          {/* Product Image Card if image exists */}
          {(product.image || product.image_url) && (
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                Product Image
              </h3>
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-2xs">
                <img
                  src={productImageUrl(product.image || product.image_url)}
                  alt={product.name}
                  className="size-full object-cover"
                />
              </div>
            </section>
          )}

          {/* Printable Visual Barcode Sticker Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs text-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
              Barcode Label Preview
            </h3>

            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                MH Mobile Shop POS
              </span>
              <strong className="text-xs font-black text-[#0B1E38] block truncate px-2">
                {product.name}
              </strong>

              {/* Visual Barcode SVG simulation */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-[2px] h-11 w-44 bg-white p-2 rounded border border-slate-200/60 shadow-2xs">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full bg-slate-900 ${
                        i % 5 === 0 ? "w-1" : i % 3 === 0 ? "w-0.5" : "w-[1px]"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs font-bold text-slate-600 mt-1 tracking-widest">
                  {product.barcode || product.product_code || "890123456789"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between px-2">
                <span className="text-[10px] font-bold text-slate-400">Price:</span>
                <strong className="text-sm font-black text-emerald-600">
                  {formatCurrency(product.selling_price)}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="mt-4 w-full rounded-xl bg-[#0E2040] py-2.5 text-xs font-extrabold text-white shadow-2xs hover:bg-[#19325C] transition cursor-pointer"
            >
              Print Barcode Sticker
            </button>
          </section>

          {/* Stock & Batch Tracking Flags */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2.5">
              Stock Rules &amp; Audit
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Stock Tracking</span>
                <span className="font-black text-emerald-600">
                  {Number(product.track_stock) !== 0 ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Stock Mode</span>
                <span className="font-bold text-slate-800 capitalize">
                  {product.stock_mode || "Own Stock"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Batch Tracking</span>
                <span className="font-bold text-slate-800">
                  {product.track_batches ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Expiry Tracking</span>
                <span className="font-bold text-slate-800">
                  {product.track_expiry ? "Yes" : "No"}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-400 font-medium">
                <div>Created: {formatDateTime(product.created_at)}</div>
                <div>Last Updated: {formatDateTime(product.updated_at)}</div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ProductDetailsPage;
