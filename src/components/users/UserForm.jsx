import { useEffect, useState } from "react";
import Modal from "../Modal";

const empty = {
  name: "",
  email: "",
  phone: "",
  role: "cashier",
  status: "active",
  password: "",
  password_confirmation: "",
};

function UserForm({ isOpen, user, roles = [], onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(
        user
          ? {
              ...empty,
              name: user.name || "",
              email: user.email || "",
              phone: user.phone || "",
              role: user.role || "cashier",
              status: user.status || "active",
            }
          : empty
      );
      setErrors({});
    }
  }, [isOpen, user]);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
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

          {/* Password for New Users */}
          {!user && (
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                  name="password"
                  type="password"
                  placeholder="Min. 4 characters"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={change}
                />
                <FieldError errors={errors.password} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm Password</label>
                <input
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                  name="password_confirmation"
                  type="password"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  value={form.password_confirmation}
                  onChange={change}
                />
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