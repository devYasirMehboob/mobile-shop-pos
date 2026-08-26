import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "../Icon";
import useAuth from "../../hooks/useAuth";
import usePermissions from "../../hooks/usePermissions";
import useSettings from "../../hooks/useSettings";
import ContactDeveloperModal from "../common/ContactDeveloperModal";

const sidebarGroups = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: "dashboard", permission: "dashboard.view", hasSub: true },
      { label: "Super Admin", path: "/users", icon: "admin-role", permission: "users.manage", hasArrow: true },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Products", path: "/products", icon: "products", permission: "products.view" },
      { label: "Create Product", path: "/products?action=new", icon: "create-product", permission: "products.create" },
      { label: "Batches", path: "/batches", icon: "batches", permission: "inventory.view" },
      { label: "Low Stocks", path: "/inventory?filter=low", icon: "low-stocks", permission: "inventory.view" },
      { label: "Category", path: "/categories", icon: "categories", permission: "categories.manage" },
      { label: "Units", path: "/units", icon: "units", permission: "categories.manage" },
      { label: "Suppliers", path: "/suppliers", icon: "users", permission: "suppliers.view" },
    ],
  },
  {
    label: "Stock",
    items: [
      { label: "Manage Stock", path: "/inventory", icon: "manage-stock", permission: "inventory.view" },
      { label: "Stock Adjustment", path: "/inventory?tab=adjustment", icon: "stock-adjustment", permission: "inventory.view" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Sales", path: "/sales", icon: "sales", permission: "sales.view", hasArrow: true },
      { label: "Invoices", path: "/sales?view=invoices", icon: "invoices", permission: "sales.view" },
      { label: "Sales Return", path: "/sales?tab=returns", icon: "returns", permission: "sales.view" },
      { label: "POS", path: "/pos", icon: "pos", permission: "pos.access", hasArrow: true, badge: "POS" },
    ],
  },
  {
    label: "Purchases & Expenses",
    items: [
      { label: "Purchases", path: "/purchases", icon: "purchases", permission: "purchases.view" },
      { label: "Purchase Returns", path: "/purchase-returns", icon: "purchase-returns", permission: "purchases.view" },
      { label: "Expenses", path: "/expenses", icon: "expenses", permission: "expenses.view" },
    ],
  },
  {
    label: "Reports & Settings",
    items: [
      { label: "Reports", path: "/reports", icon: "reports", permission: "reports.view" },
      { label: "Notifications", path: "/notifications", icon: "bell", permission: "notifications.view" },
      { label: "Backups", path: "/backups", icon: "backups", permission: "backups.create" },
      { label: "Settings", path: "/settings", icon: "settings" },
    ],
  },
];

export default function DreamsSidebar({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed,
  setIsCollapsed,
}) {
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const { settings } = useSettings();
  const shop = settings?.shop || {};
  const location = useLocation();
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);

  const visibleGroups = sidebarGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || can(item.permission)
      ),
    }))
    .filter((group) => group.items.length > 0);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#EAEFF5] bg-white transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-[280px] lg:w-[84px]" : "w-[260px]"}`}
      >
        {/* LOGO HEADER */}
        <div className="relative flex h-[72px] items-center justify-between px-5 border-b border-[#EAEFF5]">
          <div className="flex items-center gap-2.5">
            {/* Dreams POS Icon / Shop Logo */}
            {shop.logo || shop.logo_url ? (
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
                <img
                  src={shop.logo || shop.logo_url}
                  alt={shop.shop_name || "Logo"}
                  className="size-full object-contain p-1"
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#FF9F43] ring-2 ring-white" />
              </div>
            ) : (
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0E2040] to-[#172E56] shadow-sm">
                <Icon name="shopping-bag" className="size-5 text-[#FF9F43]" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#FF9F43] ring-2 ring-white" />
              </div>
            )}

            {/* Dreams POS Text Brand */}
            <div
              className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                isCollapsed
                  ? "lg:max-w-0 lg:opacity-0 lg:ml-0"
                  : "max-w-[160px] opacity-100"
              }`}
            >
              <div className="flex items-baseline gap-1">
                <span className="text-[19px] font-black tracking-tight text-[#0B1E38]">
                  {shop.shop_name || "Biteblix"}
                </span>
                <span className="rounded bg-orange-100 px-1 py-0.5 text-[10px] font-black uppercase text-[#FF9F43] tracking-widest leading-none">
                  POS
                </span>
              </div>
            </div>
          </div>

          {/* Orange Round Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3.5 top-5 z-50 size-7 items-center justify-center rounded-full bg-[#FF9F43] text-white shadow-md shadow-orange-500/20 transition hover:scale-105 hover:bg-[#F38C2A] active:scale-95"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            <Icon
              name={isCollapsed ? "chevrons-right" : "chevrons-left"}
              className="size-3.5"
            />
          </button>
        </div>

        {/* NAVIGATION SCROLL LIST */}
        <nav
          className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-3.5"
          aria-label="Main navigation"
        >
          {visibleGroups.map((group, groupIdx) => (
            <section key={group.label}>
              {/* Group Category Heading */}
              <p
                className={`px-3 mb-1.5 text-[11px] font-black uppercase tracking-wider text-[#0B1E38] transition-all duration-300 whitespace-nowrap overflow-hidden ${
                  isCollapsed ? "lg:max-h-0 lg:opacity-0 lg:mb-0" : "max-h-[22px] opacity-100"
                }`}
              >
                {group.label}
              </p>

              {/* Items in Group */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const [targetPath, targetQuery] = item.path.split("?");
                  let isActive = false;

                  if (targetQuery) {
                    if (location.pathname === targetPath) {
                      const targetParams = new URLSearchParams(targetQuery);
                      const currentParams = new URLSearchParams(location.search);
                      isActive = true;
                      for (const [key, value] of targetParams.entries()) {
                        if (currentParams.get(key) !== value) {
                          isActive = false;
                          break;
                        }
                      }
                    }
                  } else {
                    if (location.pathname === targetPath) {
                      // Ensure it doesn't activate if sub-actions or tabs are present
                      if (targetPath === "/products" && location.search.includes("action=new")) {
                        isActive = false;
                      } else if (
                        targetPath === "/inventory" &&
                        (location.search.includes("tab=adjustment") ||
                          location.search.includes("filter=low"))
                      ) {
                        isActive = false;
                      } else if (
                        targetPath === "/sales" &&
                        (location.search.includes("tab=returns") ||
                          location.search.includes("view=invoices"))
                      ) {
                        isActive = false;
                      } else {
                        isActive = true;
                      }
                    }
                  }

                  return (
                    <Link
                      key={item.label + item.path}
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex min-h-[42px] items-center rounded-xl px-3 transition-all duration-200 overflow-hidden ${
                        isActive
                          ? "bg-[#FFF5EC] text-[#FF9F43] font-bold"
                          : "text-[#5B6B79] font-medium hover:bg-slate-50 hover:text-[#0B1E38]"
                      } ${
                        isCollapsed
                          ? "lg:w-11 lg:px-0 lg:justify-center lg:mx-auto"
                          : "w-full"
                      }`}
                    >
                      {/* Item Icon */}
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-lg transition-colors ${
                          isActive ? "text-[#FF9F43]" : "text-[#7A8A99] group-hover:text-[#0B1E38]"
                        }`}
                      >
                        <Icon name={item.icon} className="size-[17px]" />
                      </span>

                      {/* Item Label */}
                      <span
                        className={`transition-all duration-300 whitespace-nowrap overflow-hidden flex-1 ${
                          isCollapsed
                            ? "lg:max-w-0 lg:opacity-0 lg:ml-0"
                            : "max-w-[150px] opacity-100 ml-2.5"
                        }`}
                      >
                        <span className="block truncate text-[13px]">
                          {item.label}
                        </span>
                      </span>

                      {/* Right Icons: Chevron down for Active Dashboard or Arrow › */}
                      {!isCollapsed && (
                        <>
                          {isActive && item.hasSub && (
                            <Icon
                              name="chevron-down"
                              className="size-3.5 text-[#FF9F43] shrink-0 ml-1"
                            />
                          )}

                          {!isActive && item.hasArrow && (
                            <Icon
                              name="chevron-right"
                              className="size-3 text-slate-300 group-hover:text-slate-500 shrink-0 ml-1 transition"
                            />
                          )}

                          {item.badge && (
                            <span className="rounded bg-[#0E2040] px-1.5 py-0.5 text-[9px] font-black text-white uppercase ml-1.5 shadow-xs">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Group divider */}
              {groupIdx < visibleGroups.length - 1 && (
                <div
                  className={`h-px bg-[#F1F5F9] my-3 ${
                    isCollapsed ? "lg:mx-auto lg:w-8" : "mx-2"
                  }`}
                />
              )}
            </section>
          ))}
        </nav>

        {/* SIDEBAR FOOTER (Contact Developer + User Account Details) */}
        <div className="p-3 border-t border-[#EAEFF5]">
          {/* Contact Developer Button */}
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-2 text-xs font-black text-blue-700 shadow-2xs hover:bg-blue-100 hover:border-blue-300 transition active:scale-98 cursor-pointer"
              title="Contact Developer via WhatsApp & Email"
            >
              <span>👨‍💻</span>
              <span>Contact Developer</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="mb-2.5 mx-auto flex size-8 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50/70 text-sm shadow-2xs hover:bg-blue-100 transition active:scale-95 cursor-pointer"
              title="Contact Developer"
            >
              👨‍💻
            </button>
          )}

          {/* User Profile Card */}
          <div
            className={`flex items-center rounded-xl bg-slate-50/90 p-2 border border-slate-200/60 transition-all duration-300 ${
              isCollapsed ? "lg:justify-center lg:p-1.5 lg:bg-transparent lg:border-transparent" : ""
            }`}
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-[#0E2040] to-[#1E3A8A] text-xs font-black text-white shadow-xs"
              title={isCollapsed ? user?.name : undefined}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </span>

            <div
              className={`transition-all duration-300 whitespace-nowrap overflow-hidden flex-1 ${
                isCollapsed
                  ? "lg:max-w-0 lg:opacity-0 lg:ml-0"
                  : "max-w-[125px] opacity-100 ml-2"
              }`}
            >
              <strong className="block truncate text-xs font-extrabold text-[#0B1E38]">
                {user?.name || "Staff"}
              </strong>
              <span className="block truncate text-[10px] capitalize text-[#7A8A99] font-medium">
                {user?.role || "Staff"}
              </span>
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={handleLogout}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-red-600 hover:shadow-xs transition"
                title="Logout"
                aria-label="Logout"
              >
                <Icon name="logout" className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Contact Developer Modal */}
      <ContactDeveloperModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </>
  );
}
