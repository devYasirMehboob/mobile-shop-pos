import Modal from "../Modal";
import StatusBadge from "../StatusBadge";
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

function UserDetailsModal({ details, onClose }) {
  if (!details) return null;
  const { user, recent_activity: activity = [] } = details;

  return (
    <Modal
      isOpen
      title="User Account Details"
      description="Identity, security role, assigned permissions, and activity history."
      onClose={onClose}
      size="lg"
    >
      <div className="grid max-h-[75vh] gap-5 overflow-y-auto p-5 text-xs lg:grid-cols-[1fr_1.1fr]">
        {/* Left Column: Profile Card & Permissions */}
        <section className="space-y-4">
          {/* Identity Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3.5">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 text-base font-black text-[#FF9F43] border border-orange-200/70 shadow-2xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <strong className="block text-base font-black text-[#0B1E38]">{user.name}</strong>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 mt-1">
                  <Icon name="user" className="size-2.5" />
                  {user.role} account
                </span>
              </div>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 font-bold uppercase text-[10px]">Status</dt>
                <dd>
                  <StatusBadge status={user.status || "active"} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 font-bold uppercase text-[10px]">Email Address</dt>
                <dd className="font-bold text-slate-700">{user.email || "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 font-bold uppercase text-[10px]">Phone Number</dt>
                <dd className="font-bold font-mono text-slate-700">{user.phone || "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 font-bold uppercase text-[10px]">Last Login</dt>
                <dd className="font-semibold text-slate-600">{formatDate(user.last_login_at)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 font-bold uppercase text-[10px]">Created At</dt>
                <dd className="font-semibold text-slate-600">{formatDate(user.created_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Permissions Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
              Effective Permissions
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(details.effective_permissions || []).map((key) => (
                <span
                  key={key}
                  className="rounded-lg bg-orange-50 border border-orange-200/60 px-2 py-1 text-[10px] font-black text-[#FF9F43] shadow-2xs"
                >
                  ✓ {key}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Recent Activity Logs */}
        <section className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Recent Staff Activity
          </h4>
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-xs text-slate-400 font-medium">
              <span className="text-xl block mb-1">📜</span>
              No audit logs recorded yet for this user.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              {activity.map((item) => (
                <article key={item.id} className="p-3.5 space-y-1">
                  <div className="flex justify-between gap-2">
                    <strong className="text-xs font-bold text-[#0B1E38]">
                      {item.description}
                    </strong>
                    <time className="whitespace-nowrap text-[10px] text-slate-400 font-medium">
                      {formatDate(item.created_at)}
                    </time>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {item.actor_name || "System"} · {item.action}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="flex justify-end p-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export default UserDetailsModal;