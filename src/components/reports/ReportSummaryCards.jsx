import { label, display } from "./reportFormat";

const preferred = [
  "gross_sales",
  "net_sales",
  "total_discounts",
  "discounts",
  "cost_of_goods",
  "gross_profit",
  "total_expenses",
  "estimated_net_profit",
  "completed_sales",
  "expense_count",
  "stock_value",
  "low_stock_count",
  "out_of_stock_count",
  "refunded_amount",
  "average_sale_value",
  "transaction_count",
  "total_purchases",
  "amount_paid",
  "balance_due",
  "total_returned",
];

function ReportSummaryCards({ summary = {} }) {
  const keys = [...new Set([...preferred, ...Object.keys(summary)])]
    .filter(
      (key) =>
        summary[key] !== undefined &&
        summary[key] !== null &&
        !Array.isArray(summary[key]) &&
        typeof summary[key] !== "object"
    )
    .slice(0, 8);

  if (keys.length === 0) return null;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {keys.map((key, index) => {
        const val = summary[key];
        const isMoney = String(key).includes("sales") || String(key).includes("profit") || String(key).includes("amount") || String(key).includes("total") || String(key).includes("cost") || String(key).includes("value");

        return (
          <article
            key={key}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 truncate max-w-[150px]">
                {label(key)}
              </span>
              <span className={`grid size-7 place-items-center rounded-lg text-xs font-black ${
                index % 4 === 0
                  ? "bg-blue-50 text-blue-600"
                  : index % 4 === 1
                  ? "bg-emerald-50 text-emerald-600"
                  : index % 4 === 2
                  ? "bg-orange-50 text-[#FF9F43]"
                  : "bg-rose-50 text-rose-600"
              }`}>
                {index % 4 === 0 ? "📊" : index % 4 === 1 ? "💰" : index % 4 === 2 ? "📈" : "🧾"}
              </span>
            </div>

            <p className="mt-2 text-xl font-black text-[#0B1E38] tracking-tight">
              {display(key, val)}
            </p>

            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <span>Summary Metric</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default ReportSummaryCards;
