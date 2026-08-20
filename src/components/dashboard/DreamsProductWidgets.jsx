import { Link } from "react-router-dom";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

export default function DreamsProductWidgets({
  topSelling = [],
  lowStock = [],
  recentSales = [],
}) {
  const fallbackRecentSales = [
    {
      id: 1,
      name: "Apple Watch Series 9",
      category: "Electronics",
      price: "$640",
      status: "Processing",
      statusColor: "bg-purple-100 text-purple-700",
      time: "Today",
      icon: "smartphone",
    },
    {
      id: 2,
      name: "Gold Bracelet",
      category: "Fashion",
      price: "$126",
      status: "Cancelled",
      statusColor: "bg-red-100 text-red-700",
      time: "Today",
      icon: "shopping-bag",
    },
    {
      id: 3,
      name: "Parachute Down Duvet",
      category: "Health",
      price: "$89",
      status: "On Hold",
      statusColor: "bg-cyan-100 text-cyan-700",
      time: "15 Jan 2025",
      icon: "box",
    },
    {
      id: 4,
      name: "YETI Rambler Tumbler",
      category: "Sports",
      price: "$65",
      status: "Processing",
      statusColor: "bg-purple-100 text-purple-700",
      time: "12 Jan 2025",
      icon: "box",
    },
    {
      id: 5,
      name: "Osmo Genius Starter Kit",
      category: "Lifestyles",
      price: "$87.56",
      status: "Completed",
      statusColor: "bg-emerald-100 text-emerald-700",
      time: "11 Jan 2025",
      icon: "pos",
    },
  ];

  const salesToShow = recentSales.length > 0 ? recentSales : fallbackRecentSales;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* 1. TOP SELLING PRODUCTS */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-pink-50 text-pink-600 text-xs font-bold">
                ⭐
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Top Selling Products
              </strong>
            </div>
            <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
              Today ⌄
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {topSelling.slice(0, 5).map((product, idx) => (
              <div
                key={product.id || idx}
                className="flex items-center justify-between gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs overflow-hidden border border-slate-200/60">
                    {product.image ? (
                      <img src={product.image} alt="" className="size-full object-cover" />
                    ) : (
                      <Icon name="products" className="size-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-[#0B1E38]">
                      {product.name}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {formatCurrency(product.price || 187)} •{" "}
                      <span className="text-[#FF9F43]">{product.sold_quantity || 247}+ Sales</span>
                    </p>
                  </div>
                </div>

                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-600 shrink-0">
                  {product.trend || "↑ 25%"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. LOW STOCK PRODUCTS */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-bold">
                ⚠️
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Low Stock Products
              </strong>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-extrabold text-[#FF9F43] hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {lowStock.slice(0, 5).map((product, idx) => (
              <div
                key={product.id || idx}
                className="flex items-center justify-between gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50/60 text-orange-600 font-black text-xs overflow-hidden border border-orange-200/50">
                    <Icon name="box" className="size-5 text-[#FF9F43]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-[#0B1E38]">
                      {product.name}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      ID: #{product.product_code || product.code || 940004 + idx}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="block text-[10px] text-slate-400 font-semibold">Instock</span>
                  <strong className="text-xs font-black text-rose-500">
                    {String(product.quantity || 3).padStart(2, "0")}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. RECENT SALES */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
                🛒
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Recent Sales
              </strong>
            </div>
            <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
              Today ⌄
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {salesToShow.slice(0, 5).map((sale, idx) => (
              <div
                key={sale.id || idx}
                className="flex items-center justify-between gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs overflow-hidden border border-slate-200/60">
                    <Icon name={sale.icon || "pos"} className="size-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-[#0B1E38]">
                      {sale.name || sale.customer_name || `Order #${sale.invoice_number || sale.id}`}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {sale.category || "Electronics"} •{" "}
                      <span className="font-bold text-slate-700">{sale.price || formatCurrency(sale.grand_total || 250)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="block text-[10px] text-slate-400 font-medium">{sale.time || "Today"}</span>
                  <span
                    className={`mt-0.5 inline-block rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                      sale.statusColor || (sale.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700")
                    }`}
                  >
                    {sale.status || "Completed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
