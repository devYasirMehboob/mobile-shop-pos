import { useEffect, useState } from "react";
import Modal from "../Modal";

function ResetPasswordDialog({ user, onClose, onSave }) {
  const [form, setForm] = useState({ password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ password: "", password_confirmation: "" });
    setErrors({});
  }, [user]);

  if (!user) return null;

  async function submit(event) {
    event.preventDefault();
    if (!form.password || form.password.length < 4) {
      setErrors({ password: ["Password must be at least 4 characters."] });
      return;
    }
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await onSave(form);
    } catch (error) {
      setErrors(
        error.response?.data?.errors || {
          form: [error.message || "Unable to reset password."],
        }
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      title="Reset Staff Password"
      description={`Set a new unique password for ${user.name}.`}
      onClose={saving ? () => {} : onClose}
      size="sm"
    >
      <form onSubmit={submit} className="text-xs">
        <div className="space-y-4 p-5">
          {errors.form && (
            <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
              {errors.form[0]}
            </p>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">New Password</label>
            <input
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              type="password"
              placeholder="Min. 4 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, password: e.target.value }));
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            {errors.password && (
              <span className="mt-1 block text-[10px] font-bold text-rose-600">
                {errors.password[0]}
              </span>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              type="password"
              placeholder="Repeat password"
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, password_confirmation: e.target.value }));
                setErrors((prev) => ({ ...prev, password_confirmation: undefined }));
              }}
            />
            {errors.password_confirmation && (
              <span className="mt-1 block text-[10px] font-bold text-rose-600">
                {errors.password_confirmation[0]}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            Staff will immediately use this new password on the next login screen.
          </p>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#FF9F43] px-5 py-2 text-xs font-black text-white hover:bg-[#F38C2A] shadow-2xs transition cursor-pointer disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Resetting..." : "Reset Password"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export default ResetPasswordDialog;