import Icon from "../Icon";
import StatusBadge from "../StatusBadge";

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
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-[#F8F9FA] text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/70">
          <tr>
            <th className="px-5 py-3.5">User Identity</th>
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
            const roleBadgeClass =
              roleBadges[user.role?.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-200";

            return (
              <tr key={user.id} className="transition hover:bg-slate-50/80">
                {/* User Identity */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 text-xs font-black text-[#FF9F43] border border-orange-200/60 shadow-2xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
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
                      <span className="block text-slate-700 font-semibold">{user.email}</span>
                    ) : (
                      <span className="text-slate-300 italic">No email</span>
                    )}
                    {user.phone && (
                      <span className="block text-[11px] font-mono text-slate-400">{user.phone}</span>
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

                {/* Status */}
                <td className="px-4 py-4">
                  <StatusBadge status={user.status || "active"} />
                </td>

                {/* Last Login */}
                <td className="px-4 py-4 whitespace-nowrap text-slate-500 font-medium">
                  {formatDate(user.last_login_at)}
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => onView(user)}
                      className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                      title="View Details"
                    >
                      <Icon name="eye" className="size-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF9F43] transition cursor-pointer"
                      title="Edit User"
                    >
                      <Icon name="edit" className="size-3.5" />
                    </button>

                    {/* Permissions */}
                    <button
                      type="button"
                      onClick={() => onPermissions(user)}
                      className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
                      title="Custom Permissions"
                    >
                      <Icon name="key" className="size-3.5" />
                    </button>

                    {/* Reset Password */}
                    <button
                      type="button"
                      onClick={() => onReset(user)}
                      className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                      title="Reset Password"
                    >
                      <Icon name="lock" className="size-3.5" />
                    </button>

                    {/* Status Toggle */}
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => onStatus(user)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase transition cursor-pointer ${
                        isSelf
                          ? "opacity-30 cursor-not-allowed bg-slate-100 text-slate-400"
                          : user.status === "active"
                          ? "border border-amber-200/80 bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-2xs"
                          : "border border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-2xs"
                      }`}
                    >
                      {user.status === "active" ? "Deactivate" : "Activate"}
                    </button>

                    {/* Delete */}
                    {onDelete && !isSelf && (
                      <button
                        type="button"
                        onClick={() => onDelete(user)}
                        className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        title="Delete User"
                      >
                        <Icon name="trash" className="size-3.5" />
                      </button>
                    )}
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