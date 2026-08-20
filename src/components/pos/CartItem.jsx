import { useEffect, useState } from "react";
import ProductImage from "../products/ProductImage";
import Icon from "../Icon";
import ReadableStock from "../products/ReadableStock";
import { formatCurrency } from "../../utils/calculateSaleTotals";

const WHOLE = new Set(["piece", "pack", "dozen", "box", "bottle"]);

function CartItem({ item, onQuantity, onRemove }) {
  const step = WHOLE.has(String(item.unit_type || "").toLowerCase()) ? 1 : 0.001;

  const [localValue, setLocalValue] = useState(item.cartQuantity);
  useEffect(() => {
    setLocalValue(item.cartQuantity);
  }, [item.cartQuantity]);

  function handleChange(event) {
    const val = event.target.value;
    setLocalValue(val);
    if (val !== "" && val !== "0" && val !== "0.") {
      onQuantity(item, val);
    }
  }

  const isSharedVariant = item.stock_mode === "shared";
  const isSharedPack = isSharedVariant && Number(item.allow_custom_sale) !== 1;
  const isWeightUnit = ["gram", "grams", "g", "kilogram", "kg", "kilos", "millilitre", "ml", "litre", "liter", "l"].includes(String(item.unit_type || "").toLowerCase());
  const displayUnit = isSharedPack && isWeightUnit ? "Pack" : (item.unit_type || "piece");

  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition hover:border-[#FF9F43]/50">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <ProductImage product={item} className="size-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Header row: title and delete button */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate text-xs font-black text-[#0B1E38]">{item.name}</h4>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-[#FF9F43]">
                <span>{formatCurrency(item.selling_price)}</span>
                <span className="text-slate-400 font-normal">/ {displayUnit}</span>
              </p>
            </div>
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              onClick={() => onRemove(item)}
              aria-label={`Remove ${item.name}`}
            >
              <Icon name="trash" className="size-3.5" />
            </button>
          </div>

          {/* Stepper and Line total */}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
            {/* Stepper */}
            <div className="flex h-7 items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50/60 shadow-2xs">
              <button
                type="button"
                className="grid size-7 place-items-center text-xs font-bold text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                onClick={() => onQuantity(item, Math.round((item.cartQuantity - step) * 1000) / 1000)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                aria-label={`${item.name} quantity`}
                type="number"
                min={step}
                step={step}
                value={localValue}
                onChange={handleChange}
                className="h-7 w-11 border-x border-slate-200 bg-white text-center text-xs font-black text-slate-800 outline-none"
              />
              <button
                type="button"
                className="grid size-7 place-items-center text-xs font-bold text-[#FF9F43] hover:bg-orange-100 transition cursor-pointer"
                onClick={() => onQuantity(item, Math.round((item.cartQuantity + step) * 1000) / 1000)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Line Total */}
            <strong className="text-xs font-black text-[#0B1E38]">
              {formatCurrency(Number(item.selling_price || 0) * Number(item.cartQuantity || 1))}
            </strong>
          </div>
        </div>
      </div>
    </article>
  );
}

export default CartItem;
