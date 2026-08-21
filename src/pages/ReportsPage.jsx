import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { exportReport, getReport, getReportOptions } from "../api/reportsApi";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import ReportChart from "../components/reports/ReportChart";
import ReportFilters from "../components/reports/ReportFilters";
import ReportNavigation from "../components/reports/ReportNavigation";
import ReportPagination from "../components/reports/ReportPagination";
import ReportPrintHeader from "../components/reports/ReportPrintHeader";
import ReportSummaryCards from "../components/reports/ReportSummaryCards";
import ReportTable from "../components/reports/ReportTable";
import { configs } from "../components/reports/reportConfig";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";

function localIso(date) {
  return (
    String(date.getFullYear()) +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

function initialDates() {
  const now = new Date();
  return {
    date_from: localIso(new Date(now.getFullYear(), now.getMonth(), 1)),
    date_to: localIso(now),
  };
}

const initial = {
  ...initialDates(),
  search: "",
  cashier_id: "",
  product_id: "",
  category_id: "",
  expense_category_id: "",
  user_id: "",
  supplier_id: "",
  payment_method: "",
  sale_status: "",
  expense_status: "active",
  stock_status: "",
  transaction_type: "",
  tracking: "",
  group_by: "day",
  min_total: "",
  max_total: "",
  min_amount: "",
  max_amount: "",
  page: 1,
  limit: 20,
  sort_by: "net_sales",
  sort_direction: "desc",
};

const emptyOptions = {
  products: [],
  categories: [],
  cashiers: [],
  expense_categories: [],
  suppliers: [],
};

function params(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "" && value !== null)
  );
}

function ReportsPage() {
  const [type, setType] = useState("overview");
  const [filters, setFilters] = useState(initial);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({
    summary: {},
    rows: [],
    chart: [],
    pagination: null,
  });
  const [options, setOptions] = useState(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const alert = useAlert();
  const [exporting, setExporting] = useState(false);
  const config = configs[type] || configs.overview;

  useEffect(() => {
    document.title = "Reports | Dreams POS";
  }, []);

  useEffect(() => {
    getReportOptions()
      .then(setOptions)
      .catch((e) => {
        if (e.name !== "CanceledError") {
          setError(normalizeApiError(e).message);
        }
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((current) =>
          current.search === search ? current : { ...current, search, page: 1 }
        ),
      350
    );
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setRefreshing(true);
      setError("");
      try {
        const result = await getReport(
          type,
          params(filters),
          controller.signal
        );
        setData(result);
      } catch (e) {
        if (e.name !== "CanceledError") {
          setError(normalizeApiError(e).message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    load();
    return () => controller.abort();
  }, [type, filters, reload]);

  function update(patch) {
    if (Object.hasOwn(patch, "search")) {
      setSearch(patch.search);
      return;
    }
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clear() {
    setSearch("");
    setFilters({ ...initial, ...initialDates() });
  }

  function changeType(next) {
    setType(next);
    setSearch("");
    setFilters((current) => ({
      ...initial,
      ...initialDates(),
      sort_by: configs[next]?.defaultSort || "created_at",
    }));
  }

  function sort(column) {
    setFilters((current) => ({
      ...current,
      sort_by: column,
      sort_direction:
        current.sort_by === column && current.sort_direction === "asc"
          ? "desc"
          : "asc",
    }));
  }

  async function download() {
    setExporting(true);
    try {
      const response = await exportReport(type, params(filters));
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dreams-pos-report-${type}-${localIso(new Date())}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      alert.success("Filtered report exported successfully.");
    } catch (e) {
      if (e.name !== "CanceledError") {
        alert.error(normalizeApiError(e).message);
      }
    } finally {
      setExporting(false);
    }
  }

  const visibleColumns = useMemo(
    () =>
      (config.columns || []).filter(
        ([key]) =>
          data.permissions?.can_view_costs !== false ||
          ![
            "cost_of_goods",
            "gross_profit",
            "estimated_net_profit",
            "estimated_stock_value",
            "cost_impact",
          ].includes(key)
      ),
    [config, data.permissions]
  );

  return (
    <div className="space-y-6 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Analytical Reports
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Reports &amp; Analytics</span>
          </nav>
        </div>

        {/* Right Actions: PDF, Excel, Print, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Export Icon */}
          <button
            type="button"
            onClick={() => window.print()}
            className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600 shadow-2xs hover:bg-rose-100 transition cursor-pointer"
            title="Export PDF"
            aria-label="Export PDF"
          >
            <span className="text-xs font-black">📄</span>
          </button>

          {/* Excel Export Icon */}
          <button
            type="button"
            disabled={exporting || data.permissions?.can_export === false}
            onClick={download}
            className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
            title="Export CSV / Excel"
            aria-label="Export CSV / Excel"
          >
            <span className="text-xs font-black">📊</span>
          </button>

          {/* Print Icon */}
          <button
            type="button"
            onClick={() => window.print()}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Print Report"
            aria-label="Print Report"
          >
            <Icon name="print" className="size-4" />
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            disabled={refreshing}
            onClick={() => setReload((v) => v + 1)}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <Icon
              name="refresh"
              className={`size-4 ${refreshing ? "animate-spin text-[#FF9F43]" : ""}`}
            />
          </button>
        </div>
      </section>

      {/* 2. 2-COLUMN LAYOUT (WORKSPACE ON LEFT, REPORT NAVIGATION ON RIGHT) */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main Analytics Workspace */}
        <div className="min-w-0 space-y-5 report-print-root">
          <ReportPrintHeader title={config.title} filters={filters} />

          {/* Report Title & Description Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#0B1E38] tracking-tight">
                  {config.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-400 font-medium">
                  {config.description}
                </p>
              </div>
              <span className="rounded-lg bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase text-[#FF9F43] tracking-widest">
                Active Module
              </span>
            </div>

            {/* Filter Controls Inside Workspace */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <ReportFilters
                type={type}
                filters={{ ...filters, search }}
                options={options}
                onChange={update}
                onClear={clear}
              />
            </div>
          </div>

          {/* Error Banner */}
          {error ? (
            <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center shadow-xs">
              <Icon name="alert" className="mx-auto size-8 text-rose-500" />
              <h3 className="mt-3 text-sm font-black text-[#0B1E38]">
                Report Generation Error
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => setReload((v) => v + 1)}
                className="mt-4 rounded-xl bg-[#0E2040] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#19325C] transition no-print cursor-pointer"
              >
                Retry
              </button>
            </section>
          ) : loading ? (
            <div className="py-16">
              <LoadingState label="Computing analytical models & metrics..." />
            </div>
          ) : (
            <>
              {/* Dynamic Summary Metric Cards */}
              <ReportSummaryCards summary={data.summary} />

              {/* Chart Visualizer */}
              {data.chart?.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <ReportChart rows={data.chart} />
                </div>
              )}

              {/* Report Table Panel */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                {data.rows?.length ? (
                  <>
                    <ReportTable
                      rows={data.rows}
                      columns={visibleColumns}
                      filters={filters}
                      onSort={sort}
                    />
                    <ReportPagination
                      pagination={data.pagination}
                      onPage={(page) =>
                        setFilters((current) => ({ ...current, page }))
                      }
                    />
                  </>
                ) : (
                  <EmptyState
                    icon="reports"
                    title="No report records found"
                    description="No transaction data matches the selected parameters and date window."
                  />
                )}
              </section>
            </>
          )}
        </div>

        {/* Right Navigation Panel */}
        <div className="no-print">
          <ReportNavigation active={type} onChange={changeType} />
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
