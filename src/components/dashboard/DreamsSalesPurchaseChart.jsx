import { useState } from "react";
import Icon from "../Icon";

export default function DreamsSalesPurchaseChart({
  suppliersCount = 6987,
  customersCount = 4896,
  ordersCount = 487,
}) {
  const [activeRange, setActiveRange] = useState("1Y");
  const ranges = ["1D", "1W", "1M", "3M", "6M", "1Y"];

  const months = [
    { name: "Jan", purchase: 52, sales: 12 },
    { name: "Feb", purchase: 38, sales: 24 },
    { name: "Mar", purchase: 22, sales: 8 },
    { name: "Apr", purchase: 52, sales: 14 },
    { name: "May", purchase: 54, sales: 25 },
    { name: "Jun", purchase: 52, sales: 12 },
    { name: "July", purchase: 24, sales: 9 },
    { name: "Aug", purchase: 30, sales: 22 },
    { name: "Sep", purchase: 54, sales: 42 },
    { name: "Oct", purchase: 32, sales: 5 },
    { name: "Nov", purchase: 46, sales: 28 },
    { name: "Dec", purchase: 32, sales: 14 },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* LEFT 7/12 COLS: Sales & Purchase Dual Bar Chart */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 lg:col-span-8 shadow-xs">
        {/* Header with Title & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43]">
              <Icon name="pos" className="size-4" />
            </span>
            <strong className="text-base font-black text-[#0B1E38]">
              Sales & Purchase
            </strong>
          </div>

          {/* Time range pills */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-50 p-1 border border-slate-200/60">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRange(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  activeRange === r
                    ? "bg-[#FF9F43] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200/60">
            <span className="size-2.5 rounded-full bg-[#FFD8B2]" />
            <span className="text-slate-500">Total Purchase:</span>
            <span className="font-extrabold text-[#0B1E38]">49K</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200/60">
            <span className="size-2.5 rounded-full bg-[#FF9F43]" />
            <span className="text-slate-500">Total Sales:</span>
            <span className="font-extrabold text-[#0B1E38]">38K</span>
          </div>
        </div>

        {/* Bar Chart Graphics */}
        <div className="mt-6 flex items-end justify-between gap-2 sm:gap-4 h-52 px-1">
          {/* Y Axis scale */}
          <div className="flex flex-col justify-between h-full text-[10px] font-bold text-slate-400 pb-6 pr-2">
            <span>60K</span>
            <span>40K</span>
            <span>20K</span>
            <span>0</span>
          </div>

          {/* Month Columns */}
          <div className="grid grid-cols-12 gap-1.5 sm:gap-3 flex-1 h-full items-end pb-6 border-b border-slate-100">
            {months.map((m) => (
              <div key={m.name} className="flex flex-col items-center h-full justify-end group">
                <div className="relative w-full max-w-[28px] h-full flex flex-col justify-end">
                  {/* Purchase Bar (Light Peach background) */}
                  <div
                    style={{ height: `${(m.purchase / 60) * 100}%` }}
                    className="w-full rounded-t-lg bg-[#FFD8B2] transition-all group-hover:brightness-95 relative"
                  >
                    {/* Sales Bar (Vibrant Orange foreground inside purchase) */}
                    <div
                      style={{ height: `${(m.sales / m.purchase) * 100}%` }}
                      className="w-full absolute bottom-0 rounded-t-lg bg-[#FF9F43] transition-all group-hover:brightness-105 shadow-xs"
                    />
                  </div>
                </div>
                <span className="mt-2 text-[10px] sm:text-[11px] font-bold text-slate-400 group-hover:text-slate-900 transition">
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT 4/12 COLS: Overall Information & Customers Overview */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 lg:col-span-4 shadow-xs">
        {/* Top Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
            ℹ️
          </span>
          <strong className="text-sm font-black text-[#0B1E38]">
            Overall Information
          </strong>
        </div>

        {/* 3 Overview Stat Cards */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition hover:bg-slate-50">
            <span className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-600 mx-auto">
              <Icon name="users" className="size-4" />
            </span>
            <span className="mt-2 block text-[11px] font-semibold text-slate-400">
              Suppliers
            </span>
            <strong className="block text-sm font-black text-[#0B1E38]">
              {suppliersCount.toLocaleString()}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition hover:bg-slate-50">
            <span className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43] mx-auto">
              <Icon name="admin-role" className="size-4" />
            </span>
            <span className="mt-2 block text-[11px] font-semibold text-slate-400">
              Customer
            </span>
            <strong className="block text-sm font-black text-[#0B1E38]">
              {customersCount.toLocaleString()}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition hover:bg-slate-50">
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 mx-auto">
              <Icon name="pos" className="size-4" />
            </span>
            <span className="mt-2 block text-[11px] font-semibold text-slate-400">
              Orders
            </span>
            <strong className="block text-sm font-black text-[#0B1E38]">
              {ordersCount.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Customers Overview Section with Donut Ring */}
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-extrabold text-[#0B1E38]">
              Customers Overview
            </span>
            <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
              Today ⌄
            </span>
          </div>

          <div className="mt-3 flex items-center justify-around gap-4">
            {/* Donut progress ring mockup */}
            <div className="relative size-20 shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#FF9F43]"
                  strokeDasharray="60, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-teal-500"
                  strokeDasharray="30, 100"
                  strokeWidth="3.5"
                  strokeDashoffset="-60"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>

            {/* Metrics breakdown */}
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#FF9F43]" />
                  <strong className="text-sm font-black text-[#0B1E38]">5.5K</strong>
                  <span className="text-[10px] text-slate-400 font-semibold">First Time</span>
                </div>
                <span className="mt-0.5 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-600">
                  ↑ 25%
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-teal-500" />
                  <strong className="text-sm font-black text-[#0B1E38]">3.5K</strong>
                  <span className="text-[10px] text-slate-400 font-semibold">Return</span>
                </div>
                <span className="mt-0.5 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-600">
                  ↑ 21%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
