import { useEffect, useState } from "react";
import Modal from "../Modal";
import Icon from "../Icon";

const empty = {
  name: "",
  email: "",
  phone: "",
  role: "cashier",
  status: "active",
  is_demo: 0,
  password: "",
  password_confirmation: "",
};

function UserForm({ isOpen, user, roles = [], onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowPassword(false);
      setShowConfirmPassword(false);
      setForm(
        user
          ? {
              ...empty,
              name: user.name || "",
              email: user.email || "",
              phone: user.phone || "",
              role: user.role || "cashier",
              status: user.status || "active",
              is_demo: user.is_demo === 1 || user.is_demo === true ? 1 : 0,
            }
          : empty
      );
      setErrors({});
    }
  }, [isOpen, user]);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: ["User display name is required."] });
      return;
    }

    if (!user && (!form.password || form.password.length < 4)) {
      setErrors({ password: ["Password must be at least 4 characters."] });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const payload = user
        ? {
            name: form.name,
            email: form.email,
            phone: form.phone,
            role: form.role,
            status: form.status,
            is_demo: form.is_demo === 1 ? 1 : 0,
          }
        : form;
      await onSave(payload);
    } catch (error) {
      setErrors(
        error.response?.data?.errors || {
          form: [error.message || "Unable to save user account."],
        }
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={user ? "Edit User Account" : "Add New User"}
      description={
        user
          ? "Update account credentials, role assignment, or status."
          : "Create a staff login with assigned roles and credentials."
      }
      onClose={saving ? () => {} : onClose}
      size="md"
    >
      <form onSubmit={submit} noValidate className="text-xs">
        <div className="space-y-4 p-5">
          {errors.form && (
            <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
              {errors.form[0]}
            </p>
          )}

          {/* Full Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
              name="name"
              placeholder="e.g. Yasir Mehboob"
              value={form.name}
              onChange={change}
              autoFocus
            />
            <FieldError errors={errors.name} />
          </div>

          {/* Email & Phone */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                name="email"
                type="email"
                placeholder="user@mobileshop.pk"
                value={form.email}
                onChange={change}
              />
              <FieldError errors={errors.email} />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                name="phone"
                placeholder="0300-1234567"
                value={form.phone}
                onChange={change}
              />
              <FieldError errors={errors.phone} />
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
                name="role"
                value={form.role}
                onChange={change}
              >
                <option value="cashier">Cashier (POS & Receipts)</option>
                <option value="manager">Manager (Stock & Sales)</option>
                <option value="admin">Administrator (All Access)</option>
              </select>
              <FieldError errors={errors.role} />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Account Status</label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
                name="status"
                value={form.status}
                onChange={change}
              >
                <option value="active">Active (Can Login)</option>
                <option value="inactive">Inactive (Suspended)</option>
              </select>
              <FieldError errors={errors.status} />
            </div>
          </div>

          {/* Public Demo Account Toggle */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-center justify-between gap-3">
            <div>
              <strong className="block text-xs font-black text-amber-950">
                🔒 Public Demo Account Protection
              </strong>
              <p className="text-[11px] font-medium text-amber-800">
                Locks email, phone number, and password from being changed in public live testing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                name="is_demo"
                checked={form.is_demo === 1 || form.is_demo === true}
                onChange={change}
                className="size-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-[#FF9F43] cursor-pointer"
              />
            </label>
          </div>

          {/* Password for New Users */}
          {!user && (
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    className="h-10 w-full rounded-xl border border-slate-200 pl-3 pr-10 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 4 characters"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={change}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon name={showPassword ? "eye-off" : "eye"} className="size-4" />
                  </button>
                </div>
                <FieldError errors={errors.password} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    className="h-10 w-full rounded-xl border border-slate-200 pl-3 pr-10 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                    name="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    value={form.password_confirmation}
                    onChange={change}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <Icon name={showConfirmPassword ? "eye-off" : "eye"} className="size-4" />
                  </button>
                </div>
                <FieldError errors={errors.password_confirmation} />
              </div>
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#FF9F43] px-5 py-2.5 text-xs font-black text-white hover:bg-[#F38C2A] shadow-2xs transition cursor-pointer disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : user ? "Save Changes" : "Create User"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function FieldError({ errors }) {
  return errors ? <span className="mt-1 block text-[10px] font-bold text-rose-600">{errors[0]}</span> : null;
}

export default UserForm;