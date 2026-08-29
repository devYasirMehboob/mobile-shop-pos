import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import useSettings from "../hooks/useSettings";
import normalizeApiError from "../utils/normalizeApiError";
import { exportReportToPdf } from "../utils/pdfExport";

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

const defaultInitial = {
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
    Object.entries(filters).filter(
      ([, value]) => value !== "" && value !== null,
    ),
  );
}

function ReportsPage() {
  const { reportType } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Report Type from Route (fallback to overview)
  const activeType = useMemo(() => {
    if (reportType && configs[reportType]) return reportType;
    return "overview";
  }, [reportType]);

  // Initial Filters synced from URL search params
  const [filters, setFilters] = useState(() => {
    const urlFrom = searchParams.get("date_from");
    const urlTo = searchParams.get("date_to");
    const urlSearch = searchParams.get("search");
    const urlCat = searchParams.get("category_id");
    const urlSupp = searchParams.get("supplier_id");
    const urlMethod = searchParams.get("payment_method");

    return {
      ...defaultInitial,
      date_from: urlFrom || defaultInitial.date_from,
      date_to: urlTo || defaultInitial.date_to,
      search: urlSearch || "",
      category_id: urlCat || "",
      supplier_id: urlSupp || "",
      payment_method: urlMethod || "",
    };
  });

  const [search, setSearch] = useState(searchParams.get("search") || "");
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
  const { settings } = useSettings();
  const [exporting, setExporting] = useState(false);
  const config = configs[activeType] || configs.overview;

  useEffect(() => {
    document.title = `${config.title} | Reports | BiteBlix POS`;
  }, [config]);

  useEffect(() => {
    getReportOptions()
      .then(setOptions)
      .catch((e) => {
        if (e.name !== "CanceledError") {
          setError(normalizeApiError(e).message);
        }
      });
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => {
        if (current.search === search) return current;
        return { ...current, search, page: 1 };
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load report data from API / Supabase
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setRefreshing(true);
      setError("");
      try {
        const result = await getReport(
          activeType,
          params({ ...filters, search }),
          controller.signal,
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
  }, [activeType, filters, search, reload]);

  // Update filter handler
  function update(patch) {
    if (Object.hasOwn(patch, "search")) {
      setSearch(patch.search);
      return;
    }
    setFilters((current) => {
      const next = { ...current, ...patch };
      // Sync dates/search to searchParams cleanly
      const query = new URLSearchParams();
      if (next.date_from) query.set("date_from", next.date_from);
      if (next.date_to) query.set("date_to", next.date_to);
      if (search) query.set("search", search);
      setSearchParams(query, { replace: true });
      return next;
    });
  }

  function clear() {
    setSearch("");
    const reset = { ...defaultInitial, ...initialDates() };
    setFilters(reset);
    const query = new URLSearchParams();
    query.set("date_from", reset.date_from);
    query.set("date_to", reset.date_to);
    setSearchParams(query, { replace: true });
  }

  function changeType(next) {
    setSearch("");
    const query = new URLSearchParams();
    if (filters.date_from) query.set("date_from", filters.date_from);
    if (filters.date_to) query.set("date_to", filters.date_to);
    navigate(`/reports/${next}?${query.toString()}`);
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

  async function handleDownloadPdf() {
    setExporting(true);
    try {
      await exportReportToPdf(
        config.title,
        data.rows || [],
        visibleColumns,
        data.summary || {},
        filters,
        settings?.shop || {}
      );
      alert.success("Report PDF downloaded successfully.");
    } catch (e) {
      alert.error(normalizeApiError(e).message);
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
          ].includes(key),
      ),
    [config, data.permissions],
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
            <span className="text-slate-600 font-bold">
              Reports &amp; Analytics
            </span>
            {activeType !== "overview" && (
              <>
                <span>›</span>
                <span className="text-[#FF9F43] font-bold capitalize">
                  {config.title}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Right Actions: Download PDF, Print, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download PDF Button */}
          <button
            type="button"
            disabled={exporting || !data.rows?.length}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            title="Download PDF Document"
            aria-label="Download PDF"
          >
            <Icon name="download" className="size-3.5 text-rose-600" />
            <span>PDF</span>
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

      {/* 2. TOP FULL WIDTH: DYNAMIC METRIC SUMMARY CARDS */}
      <section className="no-print">
        <ReportSummaryCards summary={data.summary} />
      </section>

      {/* 3. 2-COLUMN MAIN BODY (WORKSPACE ON LEFT, REPORT NAVIGATION ON RIGHT) */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main Analytics Workspace */}
        <div className="min-w-0 space-y-5 report-print-root">
          <ReportPrintHeader title={config.title} filters={filters} />

          {/* Report Title & Filter Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs no-print">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#0B1E38] tracking-tight">
                  {config.title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400 font-medium">
                  {config.description}
                </p>
              </div>
              <span className="rounded-lg bg-orange-100 px-3 py-1 text-[11px] font-black uppercase text-[#FF9F43] tracking-widest">
                ACTIVE MODULE
              </span>
            </div>

            {/* Filter Controls Bar */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <ReportFilters
                type={activeType}
                filters={{ ...filters, search }}
                options={options}
                onChange={update}
                onClear={clear}
              />
            </div>
          </section>

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
              {/* Chart Visualizer */}
              {data.chart?.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <ReportChart rows={data.chart} />
                </div>
              )}

              {/* Report Table Panel (Interactive DataTable) */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                {data.rows?.length ? (
                  <ReportTable
                    rows={data.rows}
                    columns={visibleColumns}
                    filters={filters}
                    onSort={sort}
                    pagination={data.pagination}
                    onPageChange={(page) =>
                      setFilters((current) => ({ ...current, page }))
                    }
                    onLimitChange={(limit) =>
                      setFilters((current) => ({ ...current, limit, page: 1 }))
                    }
                  />
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

        {/* Right Navigation Panel (Sticky & Compact) */}
        <div className="no-print lg:sticky lg:top-20 self-start">
          <ReportNavigation active={activeType} onChange={changeType} />
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
