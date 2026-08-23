import { useEffect, useState } from "react";
import { quickAddPurchaseProduct } from "../../api/purchasesApi";
import normalizeApiError from "../../utils/normalizeApiError";
import Icon from "../Icon";

function QuickAddProductDialog({
  isOpen,
  onClose,
  onCreated,
  supplierId,
  initialName = "",
  categories = [],
  units = [],
}) {
  const [form, setForm] = useState({
    name: initialName,
    category_id: "",
    product_code: "",
    barcode: "",
    purchase_cost: "0",
    selling_price: "0",
    quantity: "0",
    minimum_stock: "10",
    base_unit_id: "",
    default_purchase_unit_id: "",
    track_stock: true,
    track_batches: false,
    track_expiry: false,
    supplier_item_code: "",
    supplier_item_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        name: initialName || prev.name,
        category_id: categories[0]?.id ? String(categories[0].id) : "",
        base_unit_id: units[0]?.id ? String(units[0].id) : "",
        default_purchase_unit_id: units[0]?.id ? String(units[0].id) : "",
      }));
      setErrors({});
    }
  }, [isOpen, initialName, categories, units]);

  if (!isOpen) return null;

  const change = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...form,
        supplier_id: supplierId || null,
        category_id: Number(form.category_id),
        base_unit_id: form.base_unit_id ? Number(form.base_unit_id) : null,
        default_purchase_unit_id: form.default_purchase_unit_id
          ? Number(form.default_purchase_unit_id)
          : null,
        purchase_cost: String(form.purchase_cost || "0"),
        selling_price: String(form.selling_price || "0"),
      };

      const res = await quickAddPurchaseProduct(payload);
      const createdProduct = res.product || res.data?.product;
      if (createdProduct) {
        onCreated(createdProduct);
        onClose();
      }
    } catch (err) {
      const normalized = normalizeApiError(err);
      setErrors(normalized.fieldErrors || { general: normalized.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-orange-50 text-[#FF9F43] shadow-2xs border border-orange-100/60">
              <Icon name="plus" className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#0B1E38] tracking-tight">
                Quick Add Product to Master
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Create a new product instantly without leaving your purchase order.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <span className="text-lg font-bold">✕</span>
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {errors.general && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{errors.general}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Product Name */}
            <label className="block text-xs font-bold text-slate-700">
              Product Name *
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => change("name", e.target.value)}
                placeholder="e.g. Infinix Note 40 Cover"
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              />
              {errors.name && (
                <span className="mt-1 block text-[11px] font-semibold text-rose-600">
                  {errors.name[0]}
                </span>
              )}
            </label>

            {/* Category */}
            <label className="block text-xs font-bold text-slate-700">
              Category *
              <select
                required
                value={form.category_id}
                onChange={(e) => change("category_id", e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Product Code */}
            <label className="block text-xs font-bold text-slate-700">
              Product Code (auto-generated if empty)
              <input
                type="text"
                value={form.product_code}
                onChange={(e) => change("product_code", e.target.value)}
                placeholder="e.g. PRD-10203"
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-mono font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              />
            </label>

            {/* Barcode */}
            <label className="block text-xs font-bold text-slate-700">
              Barcode (optional)
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => change("barcode", e.target.value)}
                placeholder="Scan or enter barcode"
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-mono font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              />
              {errors.barcode && (
                <span className="mt-1 block text-[11px] font-semibold text-rose-600">
                  {errors.barcode[0]}
                </span>
              )}
            </label>

            {/* Base Unit */}
            <label className="block text-xs font-bold text-slate-700">
              Base Unit *
              <select
                required
                value={form.base_unit_id}
                onChange={(e) => change("base_unit_id", e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43]"
              >
                <option value="">Select Base Unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </label>

            {/* Default Purchase Unit */}
            <label className="block text-xs font-bold text-slate-700">
              Default Purchase Unit *
              <select
                required
                value={form.default_purchase_unit_id}
                onChange={(e) => change("default_purchase_unit_id", e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43]"
              >
                <option value="">Select Purchase Unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </label>

            {/* Est Purchase Cost */}
            <label className="block text-xs font-bold text-slate-700">
              Est. Purchase Cost (PKR)
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.purchase_cost}
                onChange={(e) => change("purchase_cost", e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              />
            </label>

            {/* Est Selling Price */}
            <label className="block text-xs font-bold text-slate-700">
              Est. Selling Price (PKR)
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.selling_price}
                onChange={(e) => change("selling_price", e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-mono font-bold text-emerald-700 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              />
            </label>

            {/* Supplier Item Code */}
            <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
              Supplier Item Code (Optional Vendor SKU)
              <input
                type="text"
                value={form.supplier_item_code}
                onChange={(e) => change("supplier_item_code", e.target.value)}
                placeholder="e.g. WS-50 or VENDOR-REF-09"
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-800 outline-none transition focus:border-[#FF9F43]"
              />
            </label>
          </div>

          {/* Tracking Options Cards */}
          <div className="pt-2">
            <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Inventory Tracking Controls
            </span>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => change("track_stock", !form.track_stock)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
                  form.track_stock
                    ? "border-orange-300 bg-orange-50/70 text-[#0B1E38] shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`grid size-4.5 place-items-center rounded-md text-[10px] font-black transition ${
                    form.track_stock
                      ? "bg-[#FF9F43] text-white shadow-xs"
                      : "border border-slate-300 bg-slate-100 text-transparent"
                  }`}
                >
                  ✓
                </div>
                <span className="text-xs font-extrabold">Track Stock Qty</span>
              </button>

              <button
                type="button"
                onClick={() => change("track_batches", !form.track_batches)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
                  form.track_batches
                    ? "border-orange-300 bg-orange-50/70 text-[#0B1E38] shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`grid size-4.5 place-items-center rounded-md text-[10px] font-black transition ${
                    form.track_batches
                      ? "bg-[#FF9F43] text-white shadow-xs"
                      : "border border-slate-300 bg-slate-100 text-transparent"
                  }`}
                >
                  ✓
                </div>
                <span className="text-xs font-extrabold">Track Batches</span>
              </button>

              <button
                type="button"
                onClick={() => change("track_expiry", !form.track_expiry)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
                  form.track_expiry
                    ? "border-orange-300 bg-orange-50/70 text-[#0B1E38] shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`grid size-4.5 place-items-center rounded-md text-[10px] font-black transition ${
                    form.track_expiry
                      ? "bg-[#FF9F43] text-white shadow-xs"
                      : "border border-slate-300 bg-slate-100 text-transparent"
                  }`}
                >
                  ✓
                </div>
                <span className="text-xs font-extrabold">Track Expiry</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF9F43] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition cursor-pointer disabled:opacity-50"
            >
              <Icon name="check" className="size-4" />
              <span>{loading ? "Creating Product..." : "Create & Add to Purchase"}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default QuickAddProductDialog;
