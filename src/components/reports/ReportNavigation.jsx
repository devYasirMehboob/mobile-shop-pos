import usePermissions from "../../hooks/usePermissions";
import { purchaseTypes, reportGroups } from "./reportConfig";
import Icon from "../Icon";

const groupIcons = {
  "Sales reports": "sales",
  "Inventory reports": "products",
  "Purchase reports": "purchases",
  "Financial reports": "expenses",
};

function ReportNavigation({ active, onChange }) {
  const { can } = usePermissions();

  const groups = reportGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        ([key]) => !purchaseTypes.has(key) || can("purchases.view"),
      ),
    }))
    .filter((group) => group.items.length);

  const totalReportsCount = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <aside className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs select-none flex flex-col max-h-[calc(100vh-110px)]">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43]">
            <Icon name="reports" className="size-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-[#0B1E38]">
            Report Categories
          </span>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600">
          {totalReportsCount}
        </span>
      </div>

      {/* Scrollable Groups List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
        {groups.map((group) => {
          const iconName = groupIcons[group.label] || "reports";
          const title = group.label.replace(/reports/i, "").trim() + " Reports";

          return (
            <div key={group.label} className="space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <Icon name={iconName} className="size-3.5 text-[#FF9F43]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {title}
                </span>
              </div>

              <div className="space-y-0.5">
                {group.items.map(([key, label]) => {
                  const isActive = active === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange(key)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition cursor-pointer ${
                        isActive
                          ? "bg-[#FFF5EC] text-[#FF9F43] font-black shadow-2xs"
                          : "text-slate-600 font-medium hover:bg-slate-50 hover:text-[#0B1E38]"
                      }`}
                    >
                      <span className="truncate">{label}</span>
                      {isActive && (
                        <span className="size-1.5 rounded-full bg-[#FF9F43] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default ReportNavigation;
