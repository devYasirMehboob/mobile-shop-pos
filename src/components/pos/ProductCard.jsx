import ProductImage from "../products/ProductImage";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

function ProductCard({ product, onAdd }) {
  const tracked = Number(product.track_stock) !== 0;
  const out = product.status !== "active" || (tracked && Number(product.quantity) <= 0);
  const low = tracked && !out && Number(product.quantity) <= Number(product.minimum_stock);
  const label = !tracked ? "Untracked" : out ? "Out of Stock" : low ? "Low Stock" : "In Stock";
  const tone = !tracked
    ? "bg-slate-100 text-slate-600"
    : out
    ? "bg-rose-100 text-rose-700 font-bold"
    : low
    ? "bg-orange-100 text-[#FF9F43] font-bold"
    : "bg-emerald-100 text-emerald-800 font-bold";

  const isWeightUnit = ["gram", "grams", "g", "kilogram", "kg", "kilos", "millilitre", "ml", "litre", "liter", "l"].includes(String(product.unit_type || "").toLowerCase());
  const displayUnit = product.stock_mode === "shared" && isWeightUnit ? "Pcs" : (product.unit_type || "Pcs");
  const stockText = !tracked ? "Untracked" : `${Number(product.quantity)} ${displayUnit} left`;

  return (
    <div
      role="button"
      tabIndex={out ? -1 : 0}
      onClick={() => { if (!out) onAdd(product); }}
      onKeyDown={(e) => { if (!out && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onAdd(product); } }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left transition-all duration-200 select-none shadow-xs ${
        out
          ? "cursor-not-allowed opacity-55"
          : "cursor-pointer hover:-translate-y-1 hover:border-[#FF9F43] hover:shadow-lg hover:shadow-orange-500/10"
      }`}
    >
      {/* Top Image Container */}
      <div className="relative mb-3 aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
        <ProductImage
          product={product}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span
          className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[9px] uppercase tracking-wider ${tone}`}
        >
          {label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1">
        <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {product.brand || product.category_name || "General"}
        </span>
        <h4 className="truncate text-xs font-black text-[#0B1E38] group-hover:text-[#FF9F43] transition-colors">
          {product.name}
        </h4>
      </div>

      {/* Price & Action Row */}
      <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-2.5">
        <div>
          <strong className="block text-sm font-black text-[#0B1E38]">
            {formatCurrency(product.selling_price)}
          </strong>
          <span className="text-[10px] font-semibold text-slate-400">
            {stockText}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {Number(product.allow_custom_sale) === 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAdd(product, true); }}
              className="rounded-lg bg-orange-50 px-2 py-1 text-[10px] font-bold text-[#FF9F43] hover:bg-orange-100 transition"
            >
              Custom
            </button>
          )}

          <div className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] group-hover:bg-[#FF9F43] group-hover:text-white transition-colors shadow-2xs">
            <Icon name="plus" className="size-3.5 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
