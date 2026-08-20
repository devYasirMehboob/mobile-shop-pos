import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import useAuth from "../../hooks/useAuth";

export default function DreamsHeroSection({ todayOrders = 200, lowStockProduct = "Apple iPhone 15" }) {
  const { user } = useAuth();
  const [showLowStockBanner, setShowLowStockBanner] = useState(true);

  // Formatted date range for right badge
  const currentDate = new Date();
  const pastWeek = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const formatDate = (d) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const dateRangeStr = `${formatDate(pastWeek)} - ${formatDate(currentDate)}`;

  return (
    <div className="space-y-4">
      {/* Top Welcome Title & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-black text-[#0B1E38] tracking-tight">
            Welcome, {user?.name || "Admin"}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-500">
            You have <span className="text-[#FF9F43] font-bold">{todayOrders}+</span> Orders Today
          </p>
        </div>

        {/* Date Range Picker Badge */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs">
          <Icon name="clock" className="size-4 text-slate-400" />
          <span>{dateRangeStr}</span>
        </div>
      </div>

      {/* Low Stock Notification Banner Alert */}
      {showLowStockBanner && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-200/80 bg-[#FFF5EC] px-4 py-3 text-xs text-slate-700 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-full bg-orange-100 text-orange-600 text-xs font-black shrink-0">
              ⚠️
            </span>
            <p className="font-medium text-slate-700 leading-relaxed">
              Your Product{" "}
              <strong className="text-[#FF9F43] font-extrabold">{lowStockProduct}</strong> is
              running <span className="text-red-500 font-bold">Low</span>, already below 5 Pcs.{" "}
              <Link
                to="/inventory"
                className="font-extrabold text-[#FF9F43] underline hover:text-[#e0852d] ml-1"
              >
                Add Stock
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLowStockBanner(false)}
            className="grid size-6 place-items-center rounded-lg text-slate-400 hover:bg-orange-100 hover:text-slate-700 transition shrink-0"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
