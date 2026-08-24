import { money } from "./reportFormat";

function ReportChart({ rows = [] }) {
  const data = rows.slice(-15);
  if (data.length === 0) return null;

  const valueOf = (row) =>
    Number(
      row.value ??
        row.net_sales ??
        row.grand_total ??
        row.total ??
        row.amount ??
        row.gross_amount ??
        row.estimated_stock_value ??
        row.quantity_sold ??
        row.quantity ??
        row.transaction_count ??
        0
    );

  const secondOf = (row) =>
    Number(
      row.secondary ??
        row.expenses ??
        row.cost_of_goods ??
        row.refunded_amount ??
        row.amount_paid ??
        0
    );

  const maxVal = Math.max(
    1,
    ...data.flatMap((row) => [valueOf(row), secondOf(row)])
  );

  const primaryLegend = data[0]?.primaryLabel || "Primary Volume / Net Sales";
  const secondaryLegend = data[0]?.secondaryLabel || "Secondary (Expenses / Cost / Paid)";
  const hasSecondary = data.some((row) => secondOf(row) > 0);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs select-none break-inside-avoid print:border print:border-slate-300 print:p-4 print:mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:mb-3">
        <div>
          <h3 className="text-base font-black text-[#0B1E38] tracking-tight print:text-sm">
            Analytical Trend &amp; Performance
          </h3>
          <p className="mt-0.5 text-xs text-slate-400 font-medium print:text-[10px] print:text-slate-600">
            Dynamic visualization model calculated for the selected period.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600 print:text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-blue-600 print:bg-blue-700 shadow-xs" />
            <span>{primaryLegend}</span>
          </span>
          {hasSecondary && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#FF9F43] print:bg-amber-600 shadow-xs" />
              <span>{secondaryLegend}</span>
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-6 pb-2 print:pt-4">
        {/* Y-Axis Grid Lines */}
        <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-40 print:opacity-60">
          <div className="border-b border-dashed border-slate-200 print:border-slate-300 w-full flex items-center justify-end pr-1">
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-600">{money(maxVal)}</span>
          </div>
          <div className="border-b border-dashed border-slate-200 print:border-slate-300 w-full flex items-center justify-end pr-1">
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-600">{money(maxVal / 2)}</span>
          </div>
          <div className="border-b border-slate-200 print:border-slate-300 w-full flex items-center justify-end pr-1">
            <span className="text-[9px] font-mono text-slate-400 print:text-slate-600">Rs. 0</span>
          </div>
        </div>

        {/* Bars Container */}
        <div className="relative flex h-52 print:h-36 items-end justify-between gap-2 sm:gap-3 px-2">
          {data.map((row, idx) => {
            const primary = valueOf(row);
            const secondary = secondOf(row);
            const label = String(
              row.label ??
                row.period_start ??
                row.period_key ??
                row.product_name ??
                row.category_name ??
                row.supplier_name ??
                row.payment_method ??
                `Item ${idx + 1}`
            );

            const primaryHeight = Math.min(100, Math.max(primary > 0 ? 6 : 0, (primary / maxVal) * 100));
            const secondaryHeight = Math.min(100, Math.max(secondary > 0 ? 6 : 0, (secondary / maxVal) * 100));

            return (
              <div
                key={`${label}-${idx}`}
                className="group relative flex h-full flex-1 flex-col items-center justify-end min-w-[20px]"
              >
                {/* Floating Tooltip for Screen */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex print:hidden flex-col items-center pointer-events-none transition-all duration-150">
                  <div className="bg-slate-900 text-white rounded-xl px-2.5 py-1 text-[10px] font-bold shadow-lg whitespace-nowrap text-center">
                    <p className="text-slate-300 font-medium text-[9px] truncate max-w-[120px]">{label}</p>
                    <p className="text-blue-300 font-extrabold">{money(primary)}</p>
                    {secondary > 0 && (
                      <p className="text-[#FF9F43] font-bold text-[9px]">{money(secondary)}</p>
                    )}
                  </div>
                  <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                </div>

                {/* Print Value Label directly above bar */}
                {primary > 0 && (
                  <span className="hidden print:block text-[8px] font-black text-slate-800 mb-1 scale-90 whitespace-nowrap">
                    {primary >= 1000 ? `${(primary / 1000).toFixed(0)}k` : primary}
                  </span>
                )}

                {/* Bars */}
                <div className="flex items-end justify-center gap-1 w-full max-w-[36px] print:max-w-[24px] h-full">
                  {/* Primary Bar */}
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-500 print:bg-blue-600 print:!opacity-100 transition-all duration-300 group-hover:brightness-110 shadow-2xs"
                    style={{ height: `${primaryHeight}%` }}
                  />

                  {/* Secondary Bar */}
                  {secondary > 0 && (
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-400 print:bg-amber-600 print:!opacity-100 transition-all duration-300 group-hover:brightness-110 shadow-2xs"
                      style={{ height: `${secondaryHeight}%` }}
                    />
                  )}
                </div>

                {/* X-Axis Label */}
                <span className="mt-3 print:mt-1 block w-full truncate text-center text-[10px] print:text-[8px] font-bold text-slate-500 print:text-slate-800 group-hover:text-slate-900 transition">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ReportChart;
