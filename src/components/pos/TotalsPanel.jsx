import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

function TotalsPanel({
  totals,
  discountType,
  discountValue,
  discountsEnabled,
  taxLabel,
  onDiscountType,
  onDiscountValue,
}) {
  return (
    <section className="border-t border-slate-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#0B1E38]">
            Order Summary
          </h4>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
            {taxLabel}
          </p>
        </div>
        <span className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43]">
          <Icon name="sales" className="size-4" />
        </span>
      </div>

      {/* Sale Discount Row */}
      {discountsEnabled && (
        <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            Apply Discount
          </p>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <select
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
              value={discountType}
              onChange={(e) => onDiscountType(e.target.value)}
              aria-label="Discount type"
            >
              <option value="none">No Discount</option>
              <option value="fixed">Fixed ($)</option>
              <option value="percentage">Percent (%)</option>
            </select>
            <input
              disabled={discountType === "none"}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none disabled:bg-slate-100 disabled:opacity-50"
              type="number"
              min="0"
              max={discountType === "percentage" ? "100" : undefined}
              step="0.01"
              value={discountValue}
              onChange={(e) => onDiscountValue(e.target.value)}
              aria-label="Discount value"
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {/* Summary lines */}
      <dl className="mt-3.5 space-y-2 text-xs font-semibold">
        <div className="flex justify-between text-slate-500">
          <dt>Subtotal</dt>
          <dd className="font-bold text-slate-800">
            {formatCurrency(totals.subtotal)}
          </dd>
        </div>

        {discountsEnabled && Number(totals.discount) > 0 && (
          <div className="flex justify-between text-slate-500">
            <dt>Discount</dt>
            <dd className="font-bold text-emerald-600">
              - {formatCurrency(totals.discount)}
            </dd>
          </div>
        )}

        <div className="flex justify-between text-slate-500">
          <dt>{taxLabel}</dt>
          <dd className="font-bold text-slate-700">
            {formatCurrency(totals.tax)}
          </dd>
        </div>
      </dl>

      {/* Grand Total Box */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-orange-100 bg-[#FFF5EC] p-4">
        <div>
          <small className="block text-[9px] font-black uppercase tracking-wider text-[#FF9F43]">
            Payable Amount
          </small>
          <strong className="text-xs font-extrabold text-[#0B1E38]">
            Grand Total
          </strong>
        </div>
        <strong className="text-xl font-black tracking-tight text-[#FF9F43]">
          {formatCurrency(totals.grandTotal)}
        </strong>
      </div>
    </section>
  );
}

export default TotalsPanel;
