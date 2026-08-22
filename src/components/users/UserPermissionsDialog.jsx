import { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import PermissionSelector from "./PermissionSelector";

function UserPermissionsDialog({
  details,
  permissions = [],
  onClose,
  onSave,
}) {
  const [overrides, setOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setOverrides(
      Object.fromEntries(
        (details?.permission_overrides || []).map((item) => [item.key, item.effect])
      )
    );
    setError("");
  }, [details]);

  const inherited = details?.inherited_permissions || [];
  const disabled = details?.user?.role === "admin";
  const effectiveCount = useMemo(
    () => details?.effective_permissions?.length || 0,
    [details]
  );

  if (!details) return null;

  function change(key, value) {
    setOverrides((current) => {
      const next = { ...current };
      if (value === "inherit") delete next[key];
      else next[key] = value;
      return next;
    });
  }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await onSave(overrides);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to update permissions.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      title={`${details.user.name} — Custom Permissions`}
      description={`${effectiveCount} effective permissions. Overrides apply specifically to this user account.`}
      onClose={saving ? () => {} : onClose}
      size="lg"
    >
      <div className="max-h-[65vh] overflow-y-auto p-5 text-xs space-y-4">
        {disabled && (
          <p className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-xs font-semibold text-blue-800">
            🛡️ Admin access is fully privileged and inherited from the Administrator role.
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
            {error}
          </p>
        )}

        <PermissionSelector
          permissions={permissions}
          inherited={inherited}
          overrides={overrides}
          onChange={change}
          disabled={disabled}
        />
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
          disabled={saving || disabled}
          onClick={submit}
        >
          {saving ? "Saving..." : "Save Overrides"}
        </button>
      </footer>
    </Modal>
  );
}

export default UserPermissionsDialog;