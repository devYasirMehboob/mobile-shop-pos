import { Link } from "react-router-dom";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

export default function DreamsMetricCards({ summary = {} }) {
  // Top Row 4 Solid Colored Cards
  const topCards = [
    {
      label: "Total Sales",
      value: formatCurrency(summary.total_sales ?? 0),
      badge: summary.today_orders ? `+${summary.today_orders} today` : "Live",
      badgePositive: true,
      bg: "bg-[#FF9F43]",
      iconBg: "bg-white/20 text-white",
      badgeBg: "bg-white/25 text-white",
      icon: "sales",
      link: "/sales",
    },
    {
      label: "Total Sales Return",
      value: formatCurrency(summary.total_sales_return ?? 0),
      badge: "Invoices",
      badgePositive: true,
      bg: "bg-[#0E2040]",
      iconBg: "bg-white/15 text-white",
      badgeBg: "bg-white/20 text-slate-200",
      icon: "refund",
      link: "/sales?tab=returns",
    },
    {
      label: "Total Purchase",
      value: formatCurrency(summary.total_purchase ?? 0),
      badge: "Stock In",
      badgePositive: true,
      bg: "bg-[#0E9384]",
      iconBg: "bg-white/20 text-white",
      badgeBg: "bg-white/25 text-white",
      icon: "purchases",
      link: "/purchases",
    },
    {
      label: "Total Purchase Return",
      value: formatCurrency(summary.total_purchase_return ?? 0),
      badge: "Refunds",
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
      title: "Today's Profit",
      value: formatCurrency(summary.today_profit ?? 0),
      trend: "Net revenue today",
      trendPositive: Number(summary.today_profit || 0) >= 0,
      icon: "profit",
      iconColor: "text-cyan-500 bg-cyan-50",
      link: "/reports",
    },
    {
      title: "Supplier Due",
      value: formatCurrency(summary.invoice_due ?? 0),
      trend: "Payable balance",
      trendPositive: Number(summary.invoice_due || 0) <= 0,
      icon: "clock",
      iconColor: "text-teal-600 bg-teal-50",
      link: "/purchases",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(summary.total_expenses ?? 0),
      trend: "Store operations",
      trendPositive: true,
      icon: "expenses",
      iconColor: "text-orange-500 bg-orange-50",
      link: "/expenses",
    },
    {
      title: "Low Stock Items",
      value: `${summary.low_stock_count ?? 0} Products`,
      trend: "Reorder required",
      trendPositive: Number(summary.low_stock_count || 0) === 0,
      icon: "inventory",
      iconColor: "text-purple-600 bg-purple-50",
      link: "/inventory",
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
            className={`group relative overflow-hidden rounded-2xl ${card.bg} p-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer`}
          >
            {/* Background pattern circles */}
            <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-2 -bottom-4 size-16 rounded-full bg-white/5" />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-white/80">{card.label}</span>
                <h3 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-white">
                  {card.value}
                </h3>
              </div>

              <span
                className={`grid size-11 place-items-center rounded-xl backdrop-blur-xs ${card.iconBg}`}
              >
                <Icon name={card.icon} className="size-5" />
              </span>
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-[11px] font-semibold">
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${card.badgeBg}`}>
                {card.badge}
              </span>
              <span className="flex items-center gap-1 text-white/80 group-hover:text-white transition">
                <span>View Details</span>
                <Icon name="arrow" className="size-3 group-hover:translate-x-0.5 transition" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ROW 2: 4 White Modern Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bottomCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">{card.title}</span>
                <h4 className="mt-1 text-xl font-black text-[#0B1E38] tracking-tight">
                  {card.value}
                </h4>
              </div>

              <span className={`grid size-11 place-items-center rounded-xl ${card.iconColor}`}>
                <Icon name={card.icon} className="size-5" />
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
              <span
                className={`inline-flex items-center gap-1 font-bold ${
                  card.trendPositive ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {card.trend}
              </span>
              <span className="text-slate-400 group-hover:text-[#FF9F43] transition">
                <Icon name="arrow" className="size-3 group-hover:translate-x-0.5 transition" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
