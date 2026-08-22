import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../api/dashboardApi";
import AlertMessage from "../components/AlertMessage";
import LoadingState from "../components/LoadingState";
import DreamsHeroSection from "../components/dashboard/DreamsHeroSection";
import DreamsMetricCards from "../components/dashboard/DreamsMetricCards";
import DreamsSalesPurchaseChart from "../components/dashboard/DreamsSalesPurchaseChart";
import DreamsProductWidgets from "../components/dashboard/DreamsProductWidgets";
import DreamsSalesStaticsAndTransactions from "../components/dashboard/DreamsSalesStaticsAndTransactions";
import DreamsBottomInsights from "../components/dashboard/DreamsBottomInsights";

function safeErrorMessage(error) {
  return (
    error?.message ||
    error?.response?.data?.message ||
    "Dashboard data could not be loaded. Please try again."
  );
}

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setDashboard(await getDashboard());
    } catch (requestError) {
      setError(safeErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Dashboard | Dreams POS";
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <LoadingState label="Loading Dreams POS dashboard..." />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="space-y-4">
        <AlertMessage message={error} />
        <button
          type="button"
          className="rounded-xl bg-[#FF9F43] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#F38C2A] transition cursor-pointer"
          onClick={() => loadDashboard()}
        >
          Try again
        </button>
      </div>
    );
  }

  const summary = dashboard.summary || {};

  return (
    <div className="space-y-6 pb-8">
      {/* 1. HERO GREETING & LOW STOCK ALERT BANNER */}
      <DreamsHeroSection
        todayOrders={summary.today_orders ?? 0}
        lowStockProduct={
          dashboard.low_stock_products?.[0]?.name || "Products in inventory"
        }
      />

      {/* 2. TOP METRIC CARDS (4 Solid Banner Cards + 4 White Metric Cards) */}
      <DreamsMetricCards summary={summary} />

      {/* 3. SALES & PURCHASE DUAL BAR CHART + OVERALL INFO & CUSTOMERS OVERVIEW */}
      <DreamsSalesPurchaseChart
        monthlyData={dashboard.monthly_chart || []}
        customersOverview={dashboard.customers_overview || {}}
        suppliersCount={summary.total_suppliers_count ?? 0}
        customersCount={summary.total_customers_count ?? 0}
        ordersCount={summary.total_orders_count ?? 0}
      />

      {/* 4. TOP SELLING PRODUCTS + LOW STOCK PRODUCTS + RECENT SALES */}
      <DreamsProductWidgets
        topSelling={dashboard.best_selling_products || []}
        lowStock={dashboard.low_stock_products || []}
        recentSales={dashboard.recent_sales || []}
      />

      {/* 5. SALES STATICS (12-MONTH DUAL CHART) + RECENT TRANSACTIONS TABLE */}
      <DreamsSalesStaticsAndTransactions
        transactions={dashboard.recent_transactions || []}
        monthlyData={dashboard.monthly_chart || []}
        totalRevenue={summary.total_sales ?? 0}
        totalExpense={summary.total_expenses ?? 0}
      />

      {/* 6. TOP CUSTOMERS + TOP CATEGORIES DONUT + ORDER STATISTICS HEATMAP */}
      <DreamsBottomInsights
        topCustomers={dashboard.top_customers || []}
        topCategories={dashboard.top_categories || []}
        totalCategories={summary.total_categories_count ?? 0}
        totalProducts={summary.total_products_count ?? 0}
        heatmapGrid={dashboard.heatmap_grid || []}
      />

      {/* FOOTER COPYRIGHT */}
      <footer className="mt-8 pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-slate-400">
        <p>2014-2025 © DreamsPOS. All Rights Reserved</p>
        <p>
          Designed &amp; Developed By{" "}
          <span className="text-[#FF9F43] font-bold">Dreams</span>
        </p>
      </footer>
    </div>
  );
}

export default DashboardPage;
