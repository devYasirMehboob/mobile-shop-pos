import { Link } from "react-router-dom";
import Icon from "../Icon";

export default function DreamsBottomInsights({
  totalCategories = 698,
  totalProducts = 7899,
}) {
  const topCustomers = [
    { name: "Carlos Curran", country: "USA", orders: 24, spend: "$8,965", avatar: "CC" },
    { name: "Stan Gaunter", country: "UAE", orders: 22, spend: "$6,985", avatar: "SG" },
    { name: "Richard Wilson", country: "Germany", orders: 14, spend: "$5,366", avatar: "RW" },
    { name: "Mary Bronson", country: "Belgium", orders: 8, spend: "$4,569", avatar: "MB" },
    { name: "Annie Tremblay", country: "Greenland", orders: 14, spend: "$35,698", avatar: "AT" },
  ];

  // Heatmap rows (Hours: 12mp to 2am vs Days: Mon-Sun)
  const heatmapHours = ["12 mp", "12 pm", "02 pm", "12 am", "10 am", "8 am", "6 am", "4 am", "2 am"];
  const heatmapDays = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];

  // Heatmap intensity grid: 0 (cream), 1 (light peach), 2 (vibrant orange)
  const heatmapGrid = [
    [1, 1, 1, 1, 1, 2, 2],
    [1, 1, 1, 1, 2, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [2, 2, 2, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 2, 2],
    [1, 1, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 1, 1, 1],
    [2, 2, 2, 1, 1, 1, 1],
  ];

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
            <Link to="/users" className="text-xs font-extrabold text-[#FF9F43] hover:underline">
              View All
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {topCustomers.map((cust, idx) => (
              <div
                key={cust.name + idx}
                className="flex items-center justify-between gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#0E2040] to-[#1E3A8A] text-white text-[11px] font-black shadow-xs">
                    {cust.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-[#0B1E38]">
                      {cust.name}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      📍 {cust.country} • {cust.orders} Orders
                    </p>
                  </div>
                </div>

                <strong className="text-xs font-extrabold text-[#0B1E38] shrink-0">
                  {cust.spend}
                </strong>
              </div>
            ))}
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
            <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
              Weekly ⌄
            </span>
          </div>

          {/* Donut Chart Graphics + Legend */}
          <div className="mt-4 flex items-center justify-around gap-2">
            {/* Donut graphic mockup with percentages */}
            <div className="relative size-32 shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#FF9F43]"
                  strokeDasharray="50, 100"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#0E2040]"
                  strokeDasharray="24, 100"
                  strokeWidth="4"
                  strokeDashoffset="-50"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#1D6AE5]"
                  strokeDasharray="16, 100"
                  strokeWidth="4"
                  strokeDashoffset="-74"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <span className="text-xs font-black text-[#0B1E38]">50%</span>
              </div>
            </div>

            {/* Breakdown legend */}
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="size-2 rounded-full bg-[#FF9F43]" />
                  <span className="text-slate-500">Electronics</span>
                </div>
                <strong className="text-xs font-black text-[#0B1E38] pl-3.5">
                  698 <span className="text-[10px] font-normal text-slate-400">Sales</span>
                </strong>
              </div>

              <div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="size-2 rounded-full bg-[#0E2040]" />
                  <span className="text-slate-500">Sports</span>
                </div>
                <strong className="text-xs font-black text-[#0B1E38] pl-3.5">
                  545 <span className="text-[10px] font-normal text-slate-400">Sales</span>
                </strong>
              </div>

              <div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="size-2 rounded-full bg-[#1D6AE5]" />
                  <span className="text-slate-500">Lifestyles</span>
                </div>
                <strong className="text-xs font-black text-[#0B1E38] pl-3.5">
                  456 <span className="text-[10px] font-normal text-slate-400">Sales</span>
                </strong>
              </div>
            </div>
          </div>

          {/* Category Statistics Summary Footer */}
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1.5 text-xs font-bold">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-600" /> Total Number Of Categories
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">{totalCategories}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-orange-500" /> Total Number Of Products
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">{totalProducts.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ORDER STATISTICS HEATMAP */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
                📦
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Order Statistics
              </strong>
            </div>
            <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
              Weekly ⌄
            </span>
          </div>

          {/* Heatmap Grid Graphics */}
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[240px]">
              {/* Heatmap Table */}
              <div className="space-y-1">
                {heatmapHours.map((hour, rIdx) => (
                  <div key={hour} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-10 text-slate-400 font-bold shrink-0">{hour}</span>
                    <div className="grid grid-cols-7 gap-1 flex-1">
                      {heatmapGrid[rIdx].map((val, cIdx) => (
                        <div
                          key={cIdx}
                          className={`h-4 rounded-sm transition hover:scale-110 relative group ${
                            val === 2
                              ? "bg-[#FF9F43]"
                              : val === 1
                              ? "bg-[#FFE7D1]"
                              : "bg-[#FFF8F2]"
                          }`}
                        >
                          {/* Tooltip on active cell */}
                          {rIdx === 1 && cIdx === 2 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex items-center rounded-lg bg-[#0E2040] text-white px-2 py-1 text-[9px] font-extrabold whitespace-nowrap shadow-lg z-20">
                              297 Orders
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Day Labels */}
              <div className="flex items-center gap-1.5 mt-2 pl-10 text-[10px] font-bold text-slate-400">
                {heatmapDays.map((day) => (
                  <span key={day} className="flex-1 text-center">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
