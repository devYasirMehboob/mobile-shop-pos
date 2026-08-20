import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

export default function DreamsSalesStaticsAndTransactions({
  transactions = [],
}) {
  const [activeTab, setActiveTab] = useState("Sale");
  const tabs = ["Sale", "Purchase", "Quotation", "Expenses", "Invoices"];

  const staticsMonths = [
    { name: "Jan", rev: 18, exp: -12 },
    { name: "Feb", rev: 26, exp: -16 },
    { name: "Mar", rev: 25, exp: -14 },
    { name: "Apr", rev: 22, exp: -20 },
    { name: "May", rev: 22, exp: -24 },
    { name: "Jun", rev: 20, exp: -18 },
    { name: "Jul", rev: 26, exp: -20 },
    { name: "Aug", rev: 21, exp: -18 },
    { name: "Sep", rev: 24, exp: -18 },
    { name: "Oct", rev: 18, exp: -14 },
    { name: "Nov", rev: 12, exp: -14 },
    { name: "Dec", rev: 22, exp: -18 },
  ];

  const fallbackTransactions = [
    {
      id: 114589,
      date: "24 May 2025",
      customer: "Andrea Willer",
      status: "Completed",
      statusColor: "bg-emerald-100 text-emerald-700",
      total: "$4,560",
      avatar: "AW",
    },
    {
      id: 114588,
      date: "23 May 2025",
      customer: "Timothy Sands",
      status: "Completed",
      statusColor: "bg-emerald-100 text-emerald-700",
      total: "$3,569",
      avatar: "TS",
    },
    {
      id: 114587,
      date: "22 May 2025",
      customer: "Bonnie Rodrigues",
      status: "Draft",
      statusColor: "bg-pink-100 text-pink-700",
      total: "$2,659",
      avatar: "BR",
    },
    {
      id: 114586,
      date: "21 May 2025",
      customer: "Randy McCree",
      status: "Completed",
      statusColor: "bg-emerald-100 text-emerald-700",
      total: "$2,155",
      avatar: "RM",
    },
  ];

  const listToShow = transactions.length > 0 ? transactions : fallbackTransactions;

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
            📅 2025 ⌄
          </span>
        </div>

        {/* Badges: Revenue vs Expense */}
        <div className="mt-4 flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-1.5 border border-teal-200/60">
            <span className="text-teal-700 font-extrabold text-sm">$48,988,078</span>
            <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-black text-teal-800">
              ↑ 25%
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Revenue</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-1.5 border border-orange-200/60">
            <span className="text-[#FF9F43] font-extrabold text-sm">$12,189</span>
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-black text-orange-800">
              ↓ 59%
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Expense</span>
          </div>
        </div>

        {/* Up & Down Dual Bar Graphics */}
        <div className="mt-6 flex items-center justify-between gap-2 h-48 px-1">
          {/* Y Axis scale */}
          <div className="flex flex-col justify-between h-full text-[9px] font-bold text-slate-400 pb-4 pr-1">
            <span>30K</span>
            <span>20K</span>
            <span>10K</span>
            <span>0</span>
            <span>-10K</span>
            <span>-20K</span>
            <span>-30K</span>
          </div>

          {/* Month Columns */}
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2 flex-1 h-full items-center">
            {staticsMonths.map((m) => (
              <div key={m.name} className="flex flex-col items-center h-full justify-center group">
                {/* Revenue Bar (Teal Upwards) */}
                <div className="w-full max-w-[12px] sm:max-w-[14px] flex flex-col justify-end h-1/2">
                  <div
                    style={{ height: `${(m.rev / 30) * 100}%` }}
                    className="w-full rounded-t-sm bg-[#0E9384] transition-all group-hover:brightness-110"
                  />
                </div>

                {/* Expense Bar (Orange Downwards) */}
                <div className="w-full max-w-[12px] sm:max-w-[14px] flex flex-col justify-start h-1/2">
                  <div
                    style={{ height: `${(Math.abs(m.exp) / 30) * 100}%` }}
                    className="w-full rounded-b-sm bg-[#FF9F43] transition-all group-hover:brightness-110"
                  />
                </div>

                <span className="mt-1 text-[9px] font-bold text-slate-400 group-hover:text-slate-900 transition">
                  {m.name}
                </span>
              </div>
            ))}
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
            <Link
              to="/sales"
              className="text-xs font-extrabold text-[#FF9F43] hover:underline"
            >
              View All
            </Link>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex items-center gap-3 overflow-x-auto border-b border-slate-100 pb-2 text-xs font-bold">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-1 transition ${
                  activeTab === tab
                    ? "border-b-2 border-[#FF9F43] text-[#FF9F43] font-black"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Transactions Table */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400">
                  <th className="pb-2 font-extrabold">Date</th>
                  <th className="pb-2 font-extrabold">Customer</th>
                  <th className="pb-2 font-extrabold">Status</th>
                  <th className="pb-2 text-right font-extrabold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {listToShow.slice(0, 4).map((tx, idx) => (
                  <tr key={tx.id || idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 text-slate-500 font-semibold">{tx.date || "24 May 2025"}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-slate-700">
                          {tx.avatar || "U"}
                        </span>
                        <div>
                          <p className="font-bold text-[#0B1E38] text-xs">
                            {tx.customer || tx.customer_name || "Customer"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            #{tx.id || tx.invoice_number || 114589}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                          tx.statusColor ||
                          (tx.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-pink-100 text-pink-700")
                        }`}
                      >
                        {tx.status || "Completed"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-extrabold text-[#0B1E38]">
                      {tx.total || formatCurrency(tx.grand_total || 4560)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
