import useSettings from "../../hooks/useSettings";
import { formatDateTime } from "../../utils/calculateSaleTotals";

function formatDateDisplay(d) {
  if (!d) return "All Time";
  try {
    const parts = String(d).split("-");
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return d;
  } catch {
    return d;
  }
}

function ReportPrintHeader({ title, filters }) {
  const { settings } = useSettings();
  const shop = settings?.shop || {};

  const shopName = shop.shop_name || "Abdullah Mobile Shop";
  const address = shop.address || "Main Market, Commercial Plaza, Lahore";
  const phone = shop.phone || "+92 300 1234567";
  const email = shop.email || "";
  const regNo = shop.registration_number || "";

  const fromFormatted = formatDateDisplay(filters?.date_from);
  const toFormatted = formatDateDisplay(filters?.date_to);

  return (
    <header className="hidden print:block mb-6 pb-4 border-b-2 border-slate-800 text-slate-900">
      {/* Top Row: Shop Branding & Report Title */}
      <div className="flex items-start justify-between gap-6">
        {/* Left: Shop Logo & Branding */}
        <div className="flex items-center gap-4">
          {shop.logo && (
            <img
              src={shop.logo}
              alt={shopName}
              className="size-14 object-contain rounded-lg border border-slate-200"
            />
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase font-sans">
              {shopName}
            </h1>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 max-w-md">
              {address}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium mt-1">
              {phone && <span>📞 {phone}</span>}
              {email && <span>✉️ {email}</span>}
              {regNo && <span>Reg: {regNo}</span>}
            </div>
          </div>
        </div>

        {/* Right: Report Title & Period */}
        <div className="text-right">
          <div className="inline-block bg-slate-900 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded">
            {title || "Business Analytical Report"}
          </div>
          <div className="mt-2 text-xs text-slate-700 font-semibold space-y-0.5">
            <p>
              <span className="text-slate-500 uppercase text-[10px] tracking-wider">
                Period:
              </span>{" "}
              <strong>{fromFormatted}</strong> to <strong>{toFormatted}</strong>
            </p>
            <p className="text-[11px] text-slate-500 font-normal">
              Generated: {formatDateTime(new Date())}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default ReportPrintHeader;