import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../Icon";
import useAuth from "../../hooks/useAuth";
import usePermissions from "../../hooks/usePermissions";
import useSettings from "../../hooks/useSettings";
import NotificationBell from "../notifications/NotificationBell";

export default function DreamsTopbar({ isCollapsed, setIsCollapsed, onOpenMobileSidebar }) {
  const { user, logout } = useAuth();
  const { can, canAny } = usePermissions();
  const { settings } = useSettings();
  const shop = settings?.shop || {};
  const navigate = useNavigate();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showAddNewMenu, setShowAddNewMenu] = useState(false);
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedLang, setSelectedLang] = useState("EN");

  const searchInputRef = useRef(null);
  const addNewRef = useRef(null);
  const storeRef = useRef(null);
  const userRef = useRef(null);
  const langRef = useRef(null);
  const msgRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (addNewRef.current && !addNewRef.current.contains(e.target)) setShowAddNewMenu(false);
      if (storeRef.current && !storeRef.current.contains(e.target)) setShowStoreMenu(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
      if (langRef.current && !langRef.current.contains(e.target)) setShowLangMenu(false);
      if (msgRef.current && !msgRef.current.contains(e.target)) setShowMessages(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fullscreen handler
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => undefined);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => undefined);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const quickNavLinks = [
    { label: "Point of Sale", path: "/pos", icon: "pos", desc: "Open billing workspace" },
    { label: "Products", path: "/products", icon: "products", desc: "Manage catalogue" },
    { label: "Categories", path: "/categories", icon: "categories", desc: "Manage categories" },
    { label: "Sales & Receipts", path: "/sales", icon: "sales", desc: "View orders" },
    { label: "Inventory Stock", path: "/inventory", icon: "inventory", desc: "Stock levels" },
    { label: "Expenses", path: "/expenses", icon: "expenses", desc: "Daily spending" },
    { label: "Shop Settings", path: "/settings", icon: "settings", desc: "Configure shop" },
  ];

  const filteredNav = quickNavLinks.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/90 bg-white px-3 sm:px-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      {/* LEFT AREA: Mobile Menu + Collapse Toggle + Search Bar */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden shrink-0"
          aria-label="Open sidebar"
        >
          <Icon name="menu" className="size-5" />
        </button>



        {/* Global Search Box */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 transition-all focus-within:border-[#FF9F43] focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">
            <Icon name="search" className="size-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="ml-2 w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-slate-400 shadow-sm">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </div>

          {/* Quick Search Results Dropdown */}
          {showSearchDropdown && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Navigation Matches
              </div>
              <div className="mt-1 space-y-0.5 max-h-60 overflow-y-auto">
                {filteredNav.length > 0 ? (
                  filteredNav.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-[#FF9F43]"
                    >
                      <span className="grid size-7 place-items-center rounded-lg bg-slate-100 text-slate-500">
                        <Icon name={item.icon} className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs font-bold text-slate-800">{item.label}</strong>
                        <span className="block truncate text-[10px] text-slate-400">{item.desc}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching pages found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT ACTION CONTROLS */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 1. Store / Branch Selector (Freshmart style) */}
        <div className="relative hidden md:block" ref={storeRef}>
          <button
            type="button"
            onClick={() => setShowStoreMenu(!showStoreMenu)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="grid size-6 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">
              🏪
            </span>
            <span className="max-w-[110px] truncate">{shop.shop_name || "Freshmart"}</span>
            <Icon name="chevron-down" className="size-3.5 text-slate-400" />
          </button>

          {showStoreMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Active Branch
              </div>
              <div className="p-2">
                <div className="flex items-center gap-2.5 rounded-xl bg-orange-50/60 p-2 text-xs font-bold text-slate-800 border border-orange-200/50">
                  <span className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-slate-900">{shop.shop_name || "Main Store"}</p>
                    <p className="truncate text-[10px] text-slate-500">{shop.address || "Online Cloud Terminal"}</p>
                  </div>
                </div>
                {can("settings.manage") && (
                  <Link
                    to="/settings"
                    onClick={() => setShowStoreMenu(false)}
                    className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#FF9F43] hover:bg-orange-50 transition"
                  >
                    <Icon name="settings" className="size-3.5" />
                    <span>Store Settings</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. "+ Add New" Orange Button */}
        {canAny(["products.create", "purchases.create", "expenses.manage", "suppliers.manage"]) && (
          <div className="relative" ref={addNewRef}>
            <button
              type="button"
              onClick={() => setShowAddNewMenu(!showAddNewMenu)}
              className="flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95"
            >
              <Icon name="plus-circle" className="size-4" />
              <span className="hidden sm:inline">Add New</span>
            </button>

            {showAddNewMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Quick Actions
              </div>
              <div className="mt-1 space-y-0.5">
                <Link
                  to="/products"
                  onClick={() => setShowAddNewMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#FF9F43] transition"
                >
                  <Icon name="products" className="size-4 text-[#FF9F43]" />
                  <span>Add Product</span>
                </Link>
                <Link
                  to="/pos"
                  onClick={() => setShowAddNewMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <Icon name="pos" className="size-4 text-blue-600" />
                  <span>New Sale</span>
                </Link>
                <Link
                  to="/categories"
                  onClick={() => setShowAddNewMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition"
                >
                  <Icon name="categories" className="size-4 text-emerald-600" />
                  <span>Add Category</span>
                </Link>
                <Link
                  to="/expenses"
                  onClick={() => setShowAddNewMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  <Icon name="expenses" className="size-4 text-rose-600" />
                  <span>Add Expense</span>
                </Link>
                <Link
                  to="/suppliers"
                  onClick={() => setShowAddNewMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition"
                >
                  <Icon name="users" className="size-4 text-purple-600" />
                  <span>Add Supplier</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

        {/* 3. "POS" Deep Navy Button */}
        <Link
          to="/pos"
          className="flex items-center gap-1.5 rounded-xl bg-[#0E2040] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-extrabold text-white shadow-sm shadow-slate-900/20 transition-all hover:bg-[#19325C] active:scale-95"
        >
          <Icon name="monitor" className="size-4 text-white" />
          <span className="font-extrabold tracking-wide">POS</span>
        </Link>

        {/* 4. Language Selector (Flag Icon) */}
        <div className="relative hidden sm:block" ref={langRef}>
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-sm shadow-sm transition hover:bg-slate-50"
            title="Language"
          >
            {selectedLang === "EN" ? "🇺🇸" : "🇵🇰"}
          </button>

          {showLangMenu && (
            <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl z-50">
              <button
                type="button"
                onClick={() => {
                  setSelectedLang("EN");
                  setShowLangMenu(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition ${selectedLang === "EN" ? "bg-orange-50 text-[#FF9F43]" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <span>🇺🇸</span>
                <span>English</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLang("UR");
                  setShowLangMenu(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition ${selectedLang === "UR" ? "bg-orange-50 text-[#FF9F43]" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <span>🇵🇰</span>
                <span>Urdu (اردو)</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden sm:grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          aria-label="Toggle Fullscreen"
        >
          <Icon name={isFullscreen ? "shrink" : "expand"} className="size-4" />
        </button>

        {/* 6. Messages / Mail Icon with badge */}
        <div className="relative hidden md:block" ref={msgRef}>
          <button
            type="button"
            onClick={() => setShowMessages(!showMessages)}
            className="relative grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            title="Messages"
          >
            <Icon name="mail" className="size-4" />
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white">
              1
            </span>
          </button>

          {showMessages && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <strong className="text-xs font-extrabold text-slate-900">Messages & Alerts</strong>
                <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">1 New</span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="rounded-xl bg-slate-50 p-2.5 text-xs">
                  <p className="font-bold text-slate-800">System Ready</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mobile Shop POS is connected to Supabase cloud database.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Just now</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. Notification Bell */}
        {can("notifications.view") && (
          <div className="relative">
            <NotificationBell />
          </div>
        )}

        {/* 8. Settings Gear Icon */}
        <Link
          to="/settings"
          className="hidden sm:grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          title="Settings & Profile"
        >
          <Icon name="settings" className="size-4" />
        </Link>

        {/* 9. User Profile Avatar & Dropdown */}
        <div className="relative ml-1" ref={userRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-100/70"
            aria-label="User menu"
          >
            <div className="relative">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-tr from-[#0E2040] to-[#1E3A8A] text-xs font-black text-white shadow-sm ring-2 ring-slate-200">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="hidden lg:block text-left">
              <strong className="block truncate text-xs font-extrabold text-slate-900 max-w-[100px] leading-tight">
                {user.name}
              </strong>
              <span className="block text-[10px] font-semibold text-slate-400 capitalize">
                {user.role}
              </span>
            </div>
            <Icon name="chevron-down" className="hidden lg:block size-3 text-slate-400 ml-0.5" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-black text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email || `${user.role}@mobileshop.com`}</p>
                <span className="mt-1.5 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 capitalize">
                  {user.role} Access
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                <Link
                  to={can("dashboard.view") ? "/dashboard" : "/pos"}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Icon name={can("dashboard.view") ? "dashboard" : "pos"} className="size-4 text-slate-400" />
                  <span>{can("dashboard.view") ? "Dashboard" : "POS Workspace"}</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Icon name="settings" className="size-4 text-slate-400" />
                  <span>Settings & Profile</span>
                </Link>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                >
                  <Icon name="logout" className="size-4 text-red-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
