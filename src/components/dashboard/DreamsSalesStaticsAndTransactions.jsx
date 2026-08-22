import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

function formatCompact(val) {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return `${val}`;
}

export default function DreamsSalesStaticsAndTransactions({
  transactions = [],
  monthlyData = [],
  totalRevenue = 0,
  totalExpense = 0,
}) {
  const [activeTab, setActiveTab] = useState("Sale");
  const tabs = ["Sale", "Invoices", "Expenses", "Purchase"];

  const currentYear = new Date().getFullYear();

  const staticsMonths =
    monthlyData.length > 0
      ? monthlyData
      : [
          { name: "Jan", rev: 0, exp: 0 },
          { name: "Feb", rev: 0, exp: 0 },
          { name: "Mar", rev: 0, exp: 0 },
          { name: "Apr", rev: 0, exp: 0 },
          { name: "May", rev: 0, exp: 0 },
          { name: "Jun", rev: 0, exp: 0 },
          { name: "Jul", rev: 0, exp: 0 },
          { name: "Aug", rev: 0, exp: 0 },
          { name: "Sep", rev: 0, exp: 0 },
          { name: "Oct", rev: 0, exp: 0 },
          { name: "Nov", rev: 0, exp: 0 },
          { name: "Dec", rev: 0, exp: 0 },
        ];

  // Maximum value for scaling +/-
  const maxScaleVal = Math.max(
    ...staticsMonths.map((m) => Math.max(m.rev || 0, Math.abs(m.exp || 0))),
    500
  );
  const step = Math.ceil(maxScaleVal / 3);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* LEFT 6/12 COLS: Sales Statics 12-Month Dual Chart */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 lg:col-span-6 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-bold">
              📊
            </span>
            <strong className="text-sm font-black text-[#0B1E38]">
              Sales Statics
            </strong>
          </div>
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
            📅 {currentYear}
          </span>
        </div>

        {/* Badges: Revenue vs Expense */}
        <div className="mt-4 flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-1.5 border border-teal-200/60">
            <span className="text-teal-700 font-extrabold text-sm">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-black text-teal-800">
              Live
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Revenue</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-1.5 border border-orange-200/60">
            <span className="text-[#FF9F43] font-extrabold text-sm">
              {formatCurrency(totalExpense)}
            </span>
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-black text-orange-800">
              Live
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Expense</span>
          </div>
        </div>

        {/* Up & Down Dual Bar Graphics */}
        <div className="mt-6 flex items-center justify-between gap-2 h-48 px-1">
          {/* Y Axis scale */}
          <div className="flex flex-col justify-between h-full text-[9px] font-bold text-slate-400 pb-4 pr-1">
            <span>+{formatCompact(step * 3)}</span>
            <span>+{formatCompact(step * 2)}</span>
            <span>+{formatCompact(step)}</span>
            <span>0</span>
            <span>-{formatCompact(step)}</span>
            <span>-{formatCompact(step * 2)}</span>
            <span>-{formatCompact(step * 3)}</span>
          </div>

          {/* Month Columns */}
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2 flex-1 h-full items-center">
            {staticsMonths.map((m) => {
              const revHeight = maxScaleVal > 0 ? (m.rev / maxScaleVal) * 100 : 0;
              const expHeight = maxScaleVal > 0 ? (Math.abs(m.exp || 0) / maxScaleVal) * 100 : 0;

              return (
                <div key={m.name} className="flex flex-col items-center h-full justify-center group">
                  {/* Revenue Bar (Teal Upwards) */}
                  <div className="w-full max-w-[12px] sm:max-w-[14px] flex flex-col justify-end h-1/2">
                    <div
                      style={{ height: `${Math.min(revHeight, 100)}%` }}
                      className="w-full rounded-t-sm bg-[#0E9384] transition-all group-hover:brightness-110"
                      title={`${m.name} Revenue: Rs. ${(m.rev || 0).toLocaleString()}`}
                    />
                  </div>

                  {/* Expense Bar (Orange Downwards) */}
                  <div className="w-full max-w-[12px] sm:max-w-[14px] flex flex-col justify-start h-1/2">
                    <div
                      style={{ height: `${Math.min(expHeight, 100)}%` }}
                      className="w-full rounded-b-sm bg-[#FF9F43] transition-all group-hover:brightness-110"
                      title={`${m.name} Expenses: Rs. ${(m.exp || 0).toLocaleString()}`}
                    />
                  </div>

                  <span className="mt-1 text-[9px] font-bold text-slate-400 group-hover:text-slate-900 transition">
                    {m.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT 6/12 COLS: Recent Transactions Table */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 lg:col-span-6 shadow-xs">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-bold">
                🚩
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Recent Transactions
              </strong>
            </div>
            <Link to="/sales" className="text-xs font-extrabold text-[#FF9F43] hover:underline">
              View All
            </Link>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-3 flex items-center gap-4 text-xs font-bold border-b border-slate-100 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`transition cursor-pointer pb-1 ${
                  activeTab === tab
                    ? "border-b-2 border-[#FF9F43] text-[#FF9F43]"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <div className="mt-3 space-y-2">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No recent transactions found.
              </div>
            ) : (
              transactions.slice(0, 4).map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="flex items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-medium text-slate-400 w-20 shrink-0">
                      {t.date}
                    </span>
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-700 border border-slate-200">
                      {t.avatar || "WK"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-[#0B1E38]">
                        {t.customer}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {t.invoice_number || `#${t.id}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                        t.statusColor || "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {t.status}
                    </span>
                    <strong className="text-xs font-black text-[#0B1E38] w-16 text-right">
                      {formatCurrency(t.total)}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
