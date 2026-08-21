import Icon from "../Icon";

const sectionIcons = {
  shop: "store",
  localization: "globe",
  tax: "percent",
  discounts: "tag",
  inventory: "inventory",
  barcode: "barcode",
  printer: "printer",
  backups: "backups",
  security: "shield",
};

function SettingsNavigation({ sections, active, onSelect, dirty }) {
  return (
    <nav
      className="no-scrollbar space-y-2 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-2 select-none"
      aria-label="Settings sections"
    >
      {sections.map((section) => {
        const isActive = active === section.key;
        const iconName = sectionIcons[section.key] || "settings";

        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onSelect(section.key)}
            className={`flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-200 cursor-pointer border ${
              isActive
                ? "border-orange-200/80 bg-[#FFF5EC] text-[#FF9F43] shadow-xs shadow-orange-500/10 font-bold"
                : "border-slate-200/70 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-[#0B1E38] shadow-2xs"
            }`}
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${
                isActive
                  ? "bg-[#FF9F43] text-white shadow-sm shadow-orange-500/20"
                  : "bg-slate-50 text-slate-400 border border-slate-100"
              }`}
            >
              <Icon name={iconName} className="size-[18px]" />
            </span>

            <span className="min-w-0 flex-1">
              <strong className={`block truncate text-xs ${isActive ? "text-[#0B1E38] font-black" : "font-extrabold text-slate-700"}`}>
                {section.label}
              </strong>
              <small
                className={`mt-0.5 block truncate text-[10px] font-semibold ${
                  isActive ? "text-[#FF9F43]" : "text-slate-400"
                }`}
              >
                {section.description}
              </small>
            </span>

            {dirty === section.key && (
              <span className="size-2 rounded-full bg-orange-400 ring-4 ring-orange-100 shrink-0" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default SettingsNavigation;
