import { Link } from "react-router-dom";
import Icon from "../Icon";

const categoryColors = [
  { stroke: "text-[#FF9F43]", bg: "bg-[#FF9F43]" },
  { stroke: "text-[#0E2040]", bg: "bg-[#0E2040]" },
  { stroke: "text-[#1D6AE5]", bg: "bg-[#1D6AE5]" },
  { stroke: "text-[#0E9384]", bg: "bg-[#0E9384]" },
];

export default function DreamsBottomInsights({
  topCustomers = [],
  topCategories = [],
  totalCategories = 0,
  totalProducts = 0,
  heatmapGrid = [],
}) {
  const heatmapHours = ["12 mp", "12 pm", "02 pm", "12 am", "10 am", "8 am", "6 am", "4 am", "2 am"];
  const heatmapDays = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];

  const grid =
    heatmapGrid.length > 0
      ? heatmapGrid
      : Array(9)
          .fill(0)
          .map(() => Array(7).fill(0));

  // Compute donut offsets
  let cumulativeOffset = 0;
  const donutSlices = (topCategories.length > 0 ? topCategories : [{ name: "Inventory", sales: 0, percentage: 100 }]).map((cat, idx) => {
    const color = categoryColors[idx % categoryColors.length];
    const slice = {
      ...cat,
      color,
      dasharray: `${cat.percentage || 100}, 100`,
      dashoffset: `-${cumulativeOffset}`,
    };
    cumulativeOffset += cat.percentage || 0;
    return slice;
  });

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* 1. TOP CUSTOMERS */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-bold">
                👥
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Top Customers
              </strong>
            </div>
            <Link to="/sales" className="text-xs font-extrabold text-[#FF9F43] hover:underline">
              View Invoices
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {topCustomers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No customer orders recorded yet.
              </div>
            ) : (
              topCustomers.slice(0, 5).map((cust, idx) => (
                <div
                  key={cust.name + idx}
                  className="flex items-center justify-between gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#0E2040] to-[#1E3A8A] text-white text-[11px] font-black shadow-xs">
                      {cust.avatar || "CU"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-[#0B1E38]">
                        {cust.name}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {cust.orders} Orders placed
                      </p>
                    </div>
                  </div>

                  <strong className="text-xs font-extrabold text-[#0B1E38] shrink-0">
                    {cust.spend}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. TOP CATEGORIES DONUT CHART */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-pink-50 text-pink-600 text-xs font-bold">
                🌸
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Top Categories
              </strong>
            </div>
            <Link to="/categories" className="text-xs font-extrabold text-[#FF9F43] hover:underline">
              Categories
            </Link>
          </div>

          {/* Donut Chart Graphics + Legend */}
          <div className="mt-4 flex items-center justify-around gap-2">
            <div className="relative size-32 shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {donutSlices.map((slice) => (
                  <path
                    key={slice.name}
                    className={slice.color.stroke}
                    strokeDasharray={slice.dasharray}
                    strokeWidth="4"
                    strokeDashoffset={slice.dashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <span className="text-xs font-black text-[#0B1E38]">
                  {topCategories.length > 0 ? `${topCategories[0].percentage}%` : "100%"}
                </span>
              </div>
            </div>

            {/* Breakdown legend */}
            <div className="space-y-2 text-xs">
              {topCategories.length === 0 ? (
                <div className="text-[11px] text-slate-400">All products in store</div>
              ) : (
                topCategories.slice(0, 3).map((cat, idx) => (
                  <div key={cat.name}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={`size-2 rounded-full ${categoryColors[idx % categoryColors.length].bg}`} />
                      <span className="text-slate-500 truncate max-w-[100px]">{cat.name}</span>
                    </div>
                    <strong className="text-xs font-black text-[#0B1E38] pl-3.5">
                      {cat.sales} <span className="text-[10px] font-normal text-slate-400">Sales</span>
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Counts */}
        <div className="mt-5 space-y-2 border-t border-slate-100 pt-3 text-xs font-bold text-slate-700">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-600" />
              <span>Total Number Of Categories</span>
            </span>
            <strong className="text-sm font-black text-[#0B1E38]">
              {totalCategories}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#FF9F43]" />
              <span>Total Number Of Products</span>
            </span>
            <strong className="text-sm font-black text-[#0B1E38]">
              {totalProducts}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. ORDER STATISTICS HEATMAP */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-bold">
                📦
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Order Statistics
              </strong>
            </div>
            <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
              Weekly Activity
            </span>
          </div>

          {/* Heatmap Grid */}
          <div className="mt-4 flex items-center justify-between gap-1 sm:gap-2">
            {/* Hours Labels */}
            <div className="flex flex-col justify-between h-48 text-[9px] font-bold text-slate-400 py-0.5 pr-1">
              {heatmapHours.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {/* Matrix Columns */}
            <div className="flex flex-1 flex-col justify-between h-48">
              {grid.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1 items-center">
                  {row.map((intensity, cIdx) => (
                    <div
                      key={cIdx}
                      className={`h-3.5 rounded-xs sm:rounded-sm transition-all hover:scale-110 ${
                        intensity === 2
                          ? "bg-[#FF9F43] shadow-2xs"
                          : intensity === 1
                          ? "bg-[#FFE4CC]"
                          : "bg-[#FFF6ED]"
                      }`}
                      title={`${heatmapDays[cIdx]} ${heatmapHours[rIdx]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Days Labels Footer */}
          <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-1.5 pl-9 text-center text-[10px] font-bold text-slate-400">
            {heatmapDays.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
