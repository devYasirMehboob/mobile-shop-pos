import usePermissions from "../../hooks/usePermissions";
import { purchaseTypes, reportGroups } from "./reportConfig";
import Icon from "../Icon";

const groupIcons = {
  Sales: "sales",
  Inventory: "products",
  Purchases: "purchases",
  Financial: "expenses",
  Audit: "shield",
};

function ReportNavigation({ active, onChange }) {
  const { can } = usePermissions();

  const groups = reportGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        ([key]) => !purchaseTypes.has(key) || can("purchases.view")
      ),
    }))
    .filter((group) => group.items.length);

  return (
    <aside className="no-scrollbar space-y-4 lg:sticky lg:top-[90px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2 select-none">
      {groups.map((group) => {
        const iconName = groupIcons[group.label] || "reports";

        return (
          <div
            key={group.label}
            className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs"
          >
            <div className="flex items-center gap-2 px-2.5 pb-2.5 mb-1.5 border-b border-slate-100">
              <Icon name={iconName} className="size-4 text-[#FF9F43]" />
              <p className="text-[11px] font-black uppercase tracking-wider text-[#0B1E38]">
                {group.label} Reports
              </p>
            </div>

            <div className="space-y-1">
              {group.items.map(([key, label]) => {
                const isActive = active === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#FFF5EC] text-[#FF9F43] font-bold shadow-2xs"
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
    </aside>
  );
}

export default ReportNavigation;
