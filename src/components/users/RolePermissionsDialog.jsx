import { useEffect, useState } from "react";
import Modal from "../Modal";
import { getRolePermissions } from "../../api/usersApi";

function RolePermissionsDialog({
  isOpen,
  roles = [],
  permissions = [],
  onClose,
  onSave,
}) {
  const [roleId, setRoleId] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const role = roles.find((item) => String(item.id) === String(roleId));

  useEffect(() => {
    if (isOpen && !roleId && roles.length) {
      setRoleId(String(roles.find((item) => item.slug === "cashier")?.id || roles[0].id));
    }
  }, [isOpen, roleId, roles]);

  useEffect(() => {
    if (!isOpen || !roleId) return;
    let active = true;
    setLoading(true);
    getRolePermissions(roleId)
      .then((data) => {
        if (active) setSelected(data.permission_keys || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || err.message || "Unable to load role permissions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, roleId]);

  function toggle(key) {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await onSave(roleId, selected);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to update role permissions.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Role Permissions Matrix"
      description="Manage default inherited access and functional capabilities for staff roles."
      onClose={saving ? () => {} : onClose}
      size="lg"
    >
      <div className="p-5 text-xs space-y-4">
        {/* Role Select Dropdown */}
        <div className="max-w-xs">
          <label className="block font-bold text-slate-700 mb-1">Select Role</label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
          >
            {roles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {role?.slug === "admin" && (
          <p className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-xs font-semibold text-blue-800">
            🛡️ Admin permissions are protected with complete system authority.
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
            {error}
          </p>
        )}

        {/* Modules & Checkboxes */}
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-xs text-slate-400 font-medium">Loading permissions matrix...</p>
          ) : (
            [...new Set(permissions.map((item) => item.module))].map((module) => (
              <section key={module} className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {module} Capabilities
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {permissions
                    .filter((item) => item.module === module)
                    .map((permission) => (
                      <label
                        key={permission.key}
                        className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded text-[#FF9F43] focus:ring-[#FF9F43] accent-[#FF9F43]"
                          checked={selected.includes(permission.key)}
                          disabled={role?.slug === "admin"}
                          onChange={() => toggle(permission.key)}
                        />
                        <span>
                          <strong className="block text-xs font-bold text-[#0B1E38]">
                            {permission.name}
                          </strong>
                          <span className="mt-0.5 block text-[10px] text-slate-400 font-medium font-mono">
                            {permission.key}
                          </span>
                        </span>
                      </label>
                    ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <footer className="flex justify-end gap-2 border-t border-slate-100 p-4">
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-xl bg-[#FF9F43] px-5 py-2 text-xs font-black text-white hover:bg-[#F38C2A] shadow-2xs transition cursor-pointer disabled:opacity-50"
          disabled={saving || loading || role?.slug === "admin"}
          onClick={save}
        >
          {saving ? "Saving..." : "Update Role"}
        </button>
      </footer>
    </Modal>
  );
}

export default RolePermissionsDialog;