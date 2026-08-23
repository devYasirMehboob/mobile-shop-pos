import { formatCurrency } from "../../utils/calculateSaleTotals";
import Icon from "../Icon";

function PurchaseTotalsPanel({ values, onChange, totals }) {
  const balanceDue = Math.max(0, totals.grand - Number(values.amount_paid || 0));

  return (
    <section className="grid gap-5 lg:grid-cols-12">
      {/* Left: Financial Adjustments & Payment Details */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs lg:col-span-7 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43]">
            <Icon name="tag" className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0B1E38]">
              Additional Costs &amp; Payment Details
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Configure order discounts, tax, freight charges, and initial settlement.
            </p>
          </div>
        </div>

        {/* Adjustments 2x2 grid */}
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="block text-xs font-bold text-slate-700">
            Overall Discount (PKR)
            <div className="relative mt-1.5 flex items-center">
              <span className="pointer-events-none absolute left-3 text-xs font-bold text-rose-500">-</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.overall_discount}
                onChange={(e) => onChange("overall_discount", e.target.value)}
                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-right text-xs font-mono font-bold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                placeholder="0.00"
              />
            </div>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Tax Amount (GST)
            <div className="relative mt-1.5 flex items-center">
              <span className="pointer-events-none absolute left-3 text-xs font-bold text-slate-400">+</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.tax}
                onChange={(e) => onChange("tax", e.target.value)}
                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-right text-xs font-mono font-bold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                placeholder="0.00"
              />
            </div>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Shipping &amp; Freight
            <div className="relative mt-1.5 flex items-center">
              <span className="pointer-events-none absolute left-3 text-xs font-bold text-slate-400">+</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.shipping_amount}
                onChange={(e) => onChange("shipping_amount", e.target.value)}
                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-right text-xs font-mono font-bold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                placeholder="0.00"
              />
            </div>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Other Expenses
            <div className="relative mt-1.5 flex items-center">
              <span className="pointer-events-none absolute left-3 text-xs font-bold text-slate-400">+</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.other_charges}
                onChange={(e) => onChange("other_charges", e.target.value)}
                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-right text-xs font-mono font-bold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                placeholder="0.00"
              />
            </div>
          </label>
        </div>

        {/* Initial Payment Details */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3.5">
          <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
            Initial Payment Settlement
          </p>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Amount Paid to Supplier
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.amount_paid}
                onChange={(e) => onChange("amount_paid", e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-right text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                placeholder="0.00"
              />
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Payment Method
              <select
                value={values.payment_method}
                onChange={(e) => onChange("payment_method", e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-[#FF9F43]"
              >
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card / POS</option>
                <option value="bank_transfer">🏦 Bank Transfer</option>
                <option value="mobile_wallet">📱 EasyPaisa / JazzCash</option>
                <option value="cheque">📝 Cheque</option>
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
              Payment Reference / Cheque #
              <input
                type="text"
                value={values.payment_reference}
                onChange={(e) => onChange("payment_reference", e.target.value)}
                placeholder="e.g. TXN-89218 or Cheque # 001928"
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-[#FF9F43]"
              />
            </label>
          </div>
        </div>

        {/* Notes */}
        <label className="block text-xs font-bold text-slate-700">
          Purchase Notes &amp; Remarks
          <textarea
            rows="2"
            value={values.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            placeholder="Add internal remarks, invoice terms, or delivery conditions..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-[#FF9F43]"
          />
        </label>
      </div>

      {/* Right: Net Summary Breakdown Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-[#0B1E38] p-5 sm:p-6 text-white shadow-md lg:col-span-5 flex flex-col justify-between space-y-6">
        <div>
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 className="text-sm font-black tracking-wide text-white">
              Purchase Summary
            </h3>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-300">
              PKR
            </span>
          </div>

          <dl className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <dt>Items Subtotal</dt>
              <dd className="font-mono font-bold text-white">
                {formatCurrency(totals.subtotal)}
              </dd>
            </div>

            {totals.discount > 0 && (
              <div className="flex justify-between text-rose-400">
                <dt>Discount</dt>
                <dd className="font-mono font-bold">
                  -{formatCurrency(totals.discount)}
                </dd>
              </div>
            )}

            {totals.tax > 0 && (
              <div className="flex justify-between text-slate-300">
                <dt>Tax (GST)</dt>
                <dd className="font-mono font-bold text-white">
                  +{formatCurrency(totals.tax)}
                </dd>
              </div>
            )}

            {totals.charges > 0 && (
              <div className="flex justify-between text-slate-300">
                <dt>Freight &amp; Other Charges</dt>
                <dd className="font-mono font-bold text-white">
                  +{formatCurrency(totals.charges)}
                </dd>
              </div>
            )}

            <div className="my-2 border-t border-slate-700/70" />

            <div className="flex items-baseline justify-between pt-1">
              <dt className="text-sm font-black text-white">Total Payable</dt>
              <dd className="text-lg font-black text-[#FF9F43] font-mono">
                {formatCurrency(totals.grand)}
              </dd>
            </div>

            <div className="flex justify-between text-emerald-400 pt-1">
              <dt>Amount Paid</dt>
              <dd className="font-mono font-bold">
                {formatCurrency(values.amount_paid || 0)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Due Balance Status Banner */}
        <div className={`rounded-xl p-3.5 text-xs flex items-center justify-between border ${
          balanceDue > 0
            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
        }`}>
          <div className="flex items-center gap-2">
            <span>{balanceDue > 0 ? "⚠️" : "✅"}</span>
            <span className="font-bold">
              {balanceDue > 0 ? "Outstanding Balance Due:" : "Fully Paid Settlement"}
            </span>
          </div>
          <span className="font-mono font-extrabold text-sm">
            {formatCurrency(balanceDue)}
          </span>
        </div>
      </div>
    </section>
  );
}

export default PurchaseTotalsPanel;
