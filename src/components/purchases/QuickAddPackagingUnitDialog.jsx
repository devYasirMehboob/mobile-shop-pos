import { useEffect, useState } from "react";
import { saveProductPackagingUnit } from "../../api/purchasesApi";
import normalizeApiError from "../../utils/normalizeApiError";
import Icon from "../Icon";

function QuickAddPackagingUnitDialog({
  isOpen,
  onClose,
  product,
  currentItem,
  units = [],
  onConfigured,
}) {
  const [form, setForm] = useState({
    unit_id: "",
    conversion_to_base: "1",
    is_purchase_unit: true,
    purchase_cost: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && product) {
      const activeUnitId = currentItem?.unit_id ? String(currentItem.unit_id) : "";
      const purchaseUnits =
        currentItem?.purchase_units || product?.purchase_units || [];

      const existingUnit = activeUnitId
        ? purchaseUnits.find((u) => String(u.unit_id) === activeUnitId)
        : null;

      setForm({
        unit_id: activeUnitId || (units[0]?.id ? String(units[0].id) : ""),
        conversion_to_base: existingUnit
          ? String(existingUnit.conversion_to_base)
          : "1",
        is_purchase_unit: true,
        purchase_cost: existingUnit?.purchase_cost
          ? String(existingUnit.purchase_cost)
          : String(product.purchase_cost || ""),
      });
      setError("");
    }
  }, [isOpen, product, currentItem, units]);

  if (!isOpen || !product) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        unit_id: Number(form.unit_id),
        conversion_to_base: parseFloat(form.conversion_to_base || "1"),
        is_purchase_unit: 1,
        purchase_cost: form.purchase_cost ? String(form.purchase_cost) : null,
      };

      await saveProductPackagingUnit(product.id, payload);
      onConfigured(product.id);
      onClose();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  const selectedUnitObj = units.find((u) => String(u.id) === String(form.unit_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs border border-emerald-100/60">
              <Icon name="box" className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0B1E38] tracking-tight">
                Configure Packaging Unit
              </h3>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[220px]">
                {product.name}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <label className="block text-xs font-bold text-slate-700">
            Packaging Unit (e.g. Bori, Carton, Box, Dozen)
            <select
              required
              value={form.unit_id}
              onChange={(e) => setForm((p) => ({ ...p, unit_id: e.target.value }))}
              className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Select Packaging Unit...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Conversion Factor (Base Units per 1 {selectedUnitObj?.name || "Pack"})
            <input
              required
              type="number"
              step="any"
              min="0.001"
              value={form.conversion_to_base}
              onChange={(e) => setForm((p) => ({ ...p, conversion_to_base: e.target.value }))}
              placeholder="e.g. 50 (if 1 Bori = 50 kg)"
              className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
            />
            <p className="mt-1.5 text-[11px] font-medium text-slate-400">
              Example: If 1 {selectedUnitObj?.name || "Box"} contains 12 {product.base_unit_symbol || "pcs"}, enter <strong>12</strong>.
            </p>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Default Cost per {selectedUnitObj?.name || "Pack"} (Optional)
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.purchase_cost}
              onChange={(e) => setForm((p) => ({ ...p, purchase_cost: e.target.value }))}
              placeholder="e.g. 6900"
              className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
            />
          </label>

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
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
            >
              <Icon name="check" className="size-4" />
              <span>{loading ? "Saving Unit..." : "Save Packaging Unit"}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default QuickAddPackagingUnitDialog;
