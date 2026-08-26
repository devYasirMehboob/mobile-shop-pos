import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";

function formatDate(value) {
  if (!value) return "Never";
  try {
    return new Intl.DateTimeFormat("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value.replace(" ", "T")));
  } catch {
    return value;
  }
}

const roleBadges = {
  admin: "bg-purple-50 text-purple-700 border-purple-200/60",
  cashier: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  manager: "bg-orange-50 text-orange-700 border-orange-200/60",
};

function UsersTable({
  users = [],
  currentUserId,
  onView,
  onEdit,
  onReset,
  onStatus,
  onPermissions,
  onDelete,
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="overflow-x-auto min-h-[320px]">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-[#F8F9FA] text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/70">
          <tr>
            <th className="px-5 py-3.5">User</th>
            <th className="px-4 py-3.5">Contact</th>
            <th className="px-4 py-3.5">Assigned Role</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5">Last Login</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 font-medium">
          {users.map((user) => {
            const isSelf = Number(user.id) === Number(currentUserId);
            const isMenuOpen = activeMenuId === user.id;
            const roleBadgeClass =
              roleBadges[user.role?.toLowerCase()] ||
              "bg-slate-50 text-slate-700 border-slate-200";

            return (
              <tr key={user.id} className="transition hover:bg-slate-50/80">
                {/* User Identity */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="block text-sm font-black text-[#0B1E38]">
                          {user.name}
                        </strong>
                        {isSelf && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black text-blue-700 border border-blue-200/60 shadow-2xs">
                            You
                          </span>
                        )}
                        {(user.is_demo === 1 || user.is_demo === true || user.email?.toLowerCase() === "test@mobileshop.com") && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 border border-amber-200/80 shadow-2xs" title="Demo account protected from credential changes">
                            🔒 Demo
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        UID: #{String(user.id).padStart(4, "0")}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-4 py-4">
                  <div className="text-slate-600 space-y-0.5">
                    {user.email ? (
                      <span className="block text-slate-700 font-semibold">
                        {user.email}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">No email</span>
                    )}
                    {user.phone && (
                      <span className="block text-[11px] font-mono text-slate-400">
                        {user.phone}
                      </span>
                    )}
                  </div>
                </td>

                {/* Role */}
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase border shadow-2xs ${roleBadgeClass}`}
                  >
                    <Icon name="user" className="size-3" />
                    {user.role || "Cashier"}
                  </span>
                </td>

                {/* Interactive Status Toggle */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    disabled={isSelf}
                    onClick={() => onStatus(user)}
                    title={
                      isSelf
                        ? "Cannot change own account status"
                        : user.status === "active"
                          ? "Click to deactivate user"
                          : "Click to activate user"
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase border transition shadow-2xs ${
                      isSelf
                        ? "opacity-60 cursor-not-allowed bg-emerald-50 text-emerald-700 border-emerald-200/80"
                        : user.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 cursor-pointer group"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 cursor-pointer group"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full transition-colors ${
                        user.status === "active"
                          ? "bg-emerald-500 group-hover:bg-rose-500"
                          : "bg-slate-400 group-hover:bg-emerald-500"
                      }`}
                    />
                    <span>
                      {user.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </button>
                </td>

                {/* Last Login */}
                <td className="px-4 py-4 whitespace-nowrap text-slate-500 font-medium">
                  {formatDate(user.last_login_at)}
                </td>

                {/* Actions: Direct View Icon + 3-Dots Dropdown */}
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* 1. Direct View Details Icon */}
                    <button
                      type="button"
                      onClick={() => onView(user)}
                      className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-[#FF9F43] hover:bg-orange-50/40 hover:text-[#FF9F43] transition cursor-pointer"
                      title="View Details"
                    >
                      <Icon name="eye" className="size-3.5" />
                    </button>

                    {/* 2. Actions Dropdown */}
                    <div
                      className="relative inline-block text-left"
                      ref={isMenuOpen ? menuRef : null}
                    >
                      {/* Trigger Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId((prev) =>
                            prev === user.id ? null : user.id,
                          )
                        }
                        className={`grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-[#FF9F43] hover:bg-orange-50/50 hover:text-[#FF9F43] transition cursor-pointer ${
                          isMenuOpen
                            ? "border-[#FF9F43] bg-orange-50/70 text-[#FF9F43] ring-2 ring-orange-100"
                            : ""
                        }`}
                        title="More Actions"
                      >
                        <span className="text-sm font-black leading-none select-none">
                          ⋮
                        </span>
                      </button>

                      {/* Dropdown Floating Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-8 top-0 z-50 w-48 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-100 text-left">
                          {/* Edit User */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onEdit(user);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-[#FF9F43] transition cursor-pointer"
                          >
                            <Icon
                              name="edit"
                              className="size-3.5 text-[#FF9F43]"
                            />
                            <span>Edit User</span>
                          </button>

                          {/* Custom Permissions */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onPermissions(user);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition cursor-pointer"
                          >
                            <Icon
                              name="key"
                              className="size-3.5 text-purple-600"
                            />
                            <span>Permissions</span>
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onReset(user);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                          >
                            <Icon
                              name="lock"
                              className="size-3.5 text-blue-600"
                            />
                            <span>Reset Password</span>
                          </button>

                          {/* Delete User */}
                          {onDelete && !isSelf && (
                            <>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDelete(user);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Icon
                                  name="trash"
                                  className="size-3.5 text-rose-500"
                                />
                                <span>Delete Account</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default UsersTable;
