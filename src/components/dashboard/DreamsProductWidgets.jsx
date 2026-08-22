import { Link } from "react-router-dom";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

export default function DreamsProductWidgets({
  topSelling = [],
  lowStock = [],
  recentSales = [],
}) {
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
            <Link to="/products" className="text-xs font-extrabold text-[#FF9F43] hover:underline">
              View All
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {topSelling.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No product sales recorded yet.
              </div>
            ) : (
              topSelling.slice(0, 5).map((product, idx) => (
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
                        {formatCurrency(product.price || 0)} •{" "}
                        <span className="text-[#FF9F43] font-bold">{product.sold_quantity || 0} Sold</span>
                      </p>
                    </div>
                  </div>

                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-600 shrink-0">
                    {formatCurrency(product.total_revenue || 0)}
                  </span>
                </div>
              ))
            )}
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
                Low Stock Alert
              </strong>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-extrabold text-[#FF9F43] hover:underline"
            >
              Manage Stock
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {lowStock.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 font-bold">
                ✓ All inventory items are adequately stocked.
              </div>
            ) : (
              lowStock.slice(0, 5).map((product, idx) => (
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
                        Code: {product.product_code || `#${product.id}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-[10px] text-slate-400 font-semibold">Available</span>
                    <strong className="text-xs font-black text-rose-500">
                      {String(product.quantity || 0).padStart(2, "0")} Pcs
                    </strong>
                  </div>
                </div>
              ))
            )}
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
            <Link to="/sales" className="text-xs font-extrabold text-[#FF9F43] hover:underline">
              View All
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {recentSales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No recent sales found.
              </div>
            ) : (
              recentSales.slice(0, 5).map((sale, idx) => (
                <div
                  key={sale.id || idx}
                  className="flex items-center justify-between gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs overflow-hidden border border-slate-200/60">
                      <Icon name="sales" className="size-5 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-[#0B1E38]">
                        {sale.name || `Sale #${sale.id}`}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {sale.category || "CASH"} •{" "}
                        <span className="font-bold text-slate-700">{formatCurrency(sale.price || 0)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-[10px] text-slate-400 font-medium">{sale.time || "Today"}</span>
                    <span
                      className={`mt-0.5 inline-block rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                        sale.statusColor || "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {sale.status || "Completed"}
                    </span>
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
