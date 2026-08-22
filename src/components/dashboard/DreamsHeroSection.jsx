import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import useAuth from "../../hooks/useAuth";

export default function DreamsHeroSection({
  todayOrders = 0,
  lowStockProducts = [],
  outOfStockProducts = [],
}) {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(true);

  // Formatted date range for right badge
  const currentDate = new Date();
  const pastWeek = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const formatDate = (d) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const dateRangeStr = `${formatDate(pastWeek)} - ${formatDate(currentDate)}`;

  const hasOutOfStock = outOfStockProducts.length > 0;
  const hasLowStock = lowStockProducts.length > 0;

  return (
    <div className="space-y-4">
      {/* Top Welcome Title & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-black text-[#0B1E38] tracking-tight">
            Welcome, {user?.name || "Staff Member"}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-500">
            You have <span className="text-[#FF9F43] font-bold">{todayOrders}</span> Orders Today
          </p>
        </div>

        {/* Date Range Picker Badge */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs">
          <Icon name="clock" className="size-4 text-slate-400" />
          <span>{dateRangeStr}</span>
        </div>
      </div>

      {/* Dynamic Stock Alert Banners */}
      {showBanner && hasOutOfStock && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200/90 bg-rose-50 px-4 py-3 text-xs text-rose-800 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-full bg-rose-200/80 text-rose-700 text-xs font-black shrink-0">
              🚫
            </span>
            <p className="font-medium text-rose-900 leading-relaxed">
              Critical Alert: Product{" "}
              <strong className="text-rose-950 font-black">{outOfStockProducts[0]?.name}</strong>{" "}
              {outOfStockProducts.length > 1 && (
                <span className="font-bold">
                  (and {outOfStockProducts.length - 1} other item{outOfStockProducts.length > 2 ? "s" : ""}){" "}
                </span>
              )}
              is <span className="font-extrabold text-red-600 underline">Out of Stock</span> (0 Pcs remaining).{" "}
              <Link
                to="/inventory"
                className="font-black text-rose-700 underline hover:text-rose-950 ml-1"
              >
                Restock Now →
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            className="grid size-6 place-items-center rounded-lg text-rose-400 hover:bg-rose-100 hover:text-rose-800 transition shrink-0 cursor-pointer"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      {showBanner && !hasOutOfStock && hasLowStock && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-200/80 bg-[#FFF5EC] px-4 py-3 text-xs text-slate-700 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-full bg-orange-100 text-orange-600 text-xs font-black shrink-0">
              ⚠️
            </span>
            <p className="font-medium text-slate-700 leading-relaxed">
              Inventory Alert: Product{" "}
              <strong className="text-[#FF9F43] font-black">{lowStockProducts[0]?.name}</strong>{" "}
              {lowStockProducts.length > 1 && (
                <span className="font-bold">
                  (and {lowStockProducts.length - 1} other item{lowStockProducts.length > 2 ? "s" : ""}){" "}
                </span>
              )}
              is running <span className="text-amber-600 font-bold">Low</span>, only{" "}
              <span className="font-black text-rose-600">{lowStockProducts[0]?.quantity} Pcs</span> left (minimum is {lowStockProducts[0]?.minimum_stock || 5} Pcs).{" "}
              <Link
                to="/inventory"
                className="font-black text-[#FF9F43] underline hover:text-[#e0852d] ml-1"
              >
                Add Stock →
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            className="grid size-6 place-items-center rounded-lg text-slate-400 hover:bg-orange-100 hover:text-slate-700 transition shrink-0 cursor-pointer"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
