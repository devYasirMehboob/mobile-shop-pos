import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

const methods = [
  ["cash", "Cash", "cash"],
  ["card", "Card", "card"],
  ["bank_transfer", "Bank", "bank"],
  ["mobile_wallet", "Wallet", "wallet"],
  ["other", "Other", "other"],
];

const inputClass =
  "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100";

function PaymentPanel({ values, total, onChange }) {
  const change =
    values.payment_method === "cash"
      ? Math.max(0, Number(values.amount_received || 0) - total)
      : 0;

  return (
    <section className="border-t border-slate-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#0B1E38]">
            Payment Method
          </h4>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
            Select payment channel
          </p>
        </div>
        <span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon name="cash" className="size-4" />
        </span>
      </div>

      {/* Methods Pills */}
      <div className="mt-3.5 grid grid-cols-5 gap-1.5">
        {methods.map(([value, label, icon]) => (
          <label
            key={value}
            className={`cursor-pointer rounded-xl border p-2 text-center transition select-none ${
              values.payment_method === value
                ? "border-[#FF9F43] bg-orange-50/50 text-[#FF9F43] ring-1 ring-orange-200 font-extrabold"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name="payment_method"
              value={value}
              checked={values.payment_method === value}
              onChange={onChange}
            />
            <Icon name={icon} className="mx-auto size-4" />
            <span className="mt-1 block text-[10px]">{label}</span>
          </label>
        ))}
      </div>

      {/* Cash calculator */}
      {values.payment_method === "cash" ? (
        <div className="mt-3.5 grid grid-cols-[1fr_auto] items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Cash Received ($)
            </span>
            <input
              name="amount_received"
              value={values.amount_received}
              onChange={onChange}
              type="number"
              min="0"
              step="0.01"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-black text-slate-900 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-2 focus:ring-orange-100"
              placeholder="0.00"
            />
          </label>
          <div className="min-w-28 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
            <small className="block text-[9px] font-black uppercase tracking-wider text-emerald-600">
              Change
            </small>
            <strong className="block text-sm font-black text-emerald-800">
              {formatCurrency(change)}
            </strong>
          </div>
        </div>
      ) : (
        <label className="mt-3.5 block">
          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Payment Reference
          </span>
          <input
            name="payment_reference"
            maxLength="150"
            value={values.payment_reference}
            onChange={onChange}
            className={inputClass}
            placeholder="Transaction or Auth Ref #"
          />
        </label>
      )}

      {/* Customer details accordion */}
      <details className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50/60 open:bg-white transition">
        <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-600 select-none">
          Customer &amp; Note{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </summary>
        <div className="grid gap-2 border-t border-slate-200 p-3 sm:grid-cols-2">
          <input
            name="customer_name"
            maxLength="150"
            value={values.customer_name}
            onChange={onChange}
            placeholder="Customer name"
            className={inputClass}
          />
          <input
            name="customer_phone"
            maxLength="30"
            value={values.customer_phone}
            onChange={onChange}
            placeholder="Customer phone"
            className={inputClass}
          />
          <textarea
            name="note"
            maxLength="1000"
            value={values.note}
            onChange={onChange}
            placeholder="Sale note or IMEI details..."
            className={`${inputClass} min-h-14 py-1.5 sm:col-span-2 resize-none`}
          />
        </div>
      </details>
    </section>
  );
}

export default PaymentPanel;
