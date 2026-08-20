import { Link } from "react-router-dom";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

export default function DreamsMetricCards({ summary = {} }) {
  // Top Row 4 Solid Colored Cards
  const topCards = [
    {
      label: "Total Sales",
      value: formatCurrency(summary.total_sales || 48988078),
      badge: "+22%",
      badgePositive: true,
      bg: "bg-[#FF9F43]",
      iconBg: "bg-white/20 text-white",
      badgeBg: "bg-white/25 text-white",
      icon: "sales",
      link: "/sales",
    },
    {
      label: "Total Sales Return",
      value: formatCurrency(summary.total_sales_return || 16478145),
      badge: "-22%",
      badgePositive: false,
      bg: "bg-[#0E2040]",
      iconBg: "bg-white/15 text-white",
      badgeBg: "bg-white/20 text-red-200",
      icon: "refund",
      link: "/sales",
    },
    {
      label: "Total Purchase",
      value: formatCurrency(summary.total_purchase || 24145789),
      badge: "+22%",
      badgePositive: true,
      bg: "bg-[#0E9384]",
      iconBg: "bg-white/20 text-white",
      badgeBg: "bg-white/25 text-white",
      icon: "purchases",
      link: "/purchases",
    },
    {
      label: "Total Purchase Return",
      value: formatCurrency(summary.total_purchase_return || 18458747),
      badge: "-22%",
      badgePositive: false,
      bg: "bg-[#1D6AE5]",
      iconBg: "bg-white/20 text-white",
      badgeBg: "bg-white/25 text-white",
      icon: "purchase-returns",
      link: "/purchase-returns",
    },
  ];

  // Bottom Row 4 White Cards
  const bottomCards = [
    {
      title: "Profit",
      value: formatCurrency(summary.today_profit || 8458798),
      trend: "+35% vs Last Month",
      trendPositive: true,
      icon: "profit",
      iconColor: "text-cyan-500 bg-cyan-50",
      link: "/reports",
    },
    {
      title: "Invoice Due",
      value: formatCurrency(summary.invoice_due || 48988.78),
      trend: "-19% vs Last Month",
      trendPositive: false,
      icon: "clock",
      iconColor: "text-teal-600 bg-teal-50",
      link: "/sales",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(summary.total_expenses || 8980097),
      trend: "+41% vs Last Month",
      trendPositive: true,
      icon: "expenses",
      iconColor: "text-orange-500 bg-orange-50",
      link: "/expenses",
    },
    {
      title: "Total Payment Returns",
      value: formatCurrency(summary.total_payment_returns || 78458798),
      trend: "-20% vs Last Month",
      trendPositive: false,
      icon: "card",
      iconColor: "text-purple-600 bg-purple-50",
      link: "/sales",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ROW 1: 4 Colored Solid Banner Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className={`group relative overflow-hidden rounded-2xl ${card.bg} p-5 text-white shadow-sm transition hover:shadow-md hover:scale-[1.01]`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-xl ${card.iconBg} shadow-xs`}
                >
                  <Icon name={card.icon} className="size-6 text-white" />
                </span>
                <div>
                  <span className="block text-xs font-semibold text-white/80">
                    {card.label}
                  </span>
                  <strong className="mt-1 block text-lg sm:text-xl font-black tracking-tight">
                    {card.value}
                  </strong>
                </div>
              </div>

              {/* Trend Pill Badge */}
              <span
                className={`inline-flex items-center gap-0.5 rounded-lg ${card.badgeBg} px-2 py-1 text-[11px] font-black`}
              >
                {card.badgePositive ? "↑" : "↓"} {card.badge}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ROW 2: 4 White Minimal Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bottomCards.map((card) => (
          <div
            key={card.title}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <strong className="block text-xl font-black tracking-tight text-[#0B1E38]">
                  {card.value}
                </strong>
                <span className="mt-0.5 block text-xs font-semibold text-slate-400">
                  {card.title}
                </span>
              </div>
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${card.iconColor}`}
              >
                <Icon name={card.icon} className="size-5" />
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span
                className={`font-bold ${
                  card.trendPositive ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                {card.trend}
              </span>
              <Link
                to={card.link}
                className="font-extrabold text-slate-700 hover:text-[#FF9F43] transition"
              >
                View All
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
