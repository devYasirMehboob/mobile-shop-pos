import { useState } from "react";
import Icon from "../Icon";
import useAuth from "../../hooks/useAuth";
import useAlert from "../../hooks/useAlert";
import { updateMyProfile, changeMyPassword } from "../../api/usersApi";
import normalizeApiError from "../../utils/normalizeApiError";

const roleBadgeColors = {
  admin: "bg-purple-50 text-purple-700 border-purple-200/80",
  manager: "bg-orange-50 text-orange-700 border-orange-200/80",
  cashier: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
};

export default function UserProfileSettings() {
  const { user } = useAuth();
  const alert = useAlert();

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  // Handle Profile Update
  async function handleProfileSubmit(e) {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      alert.error("Please enter your name.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await updateMyProfile(user.id, profileForm);
      alert.success(res.message || "Profile updated successfully.");
    } catch (err) {
      alert.error(normalizeApiError(err).message);
    } finally {
      setSavingProfile(false);
    }
  }

  // Handle Password Change
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordErrors({});

    if (!passwordForm.current_password) {
      setPasswordErrors({ current_password: "Enter your current password." });
      return;
    }
    if (!passwordForm.new_password || passwordForm.new_password.length < 4) {
      setPasswordErrors({ new_password: "New password must be at least 4 characters." });
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors({ confirm_password: "Passwords do not match." });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changeMyPassword(user.id, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      alert.success(res.message || "Password changed successfully.");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      const msg = normalizeApiError(err).message;
      if (msg.toLowerCase().includes("current")) {
        setPasswordErrors({ current_password: msg });
      } else {
        alert.error(msg);
      }
    } finally {
      setSavingPassword(false);
    }
  }

  const role = user?.role?.toLowerCase() || "cashier";
  const roleClass = roleBadgeColors[role] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="space-y-6">
      {/* 1. USER OVERVIEW CARD */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0E2040] to-[#1E3A8A] text-xl font-black text-white shadow-md shadow-blue-900/10 ring-4 ring-slate-50">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#0B1E38] tracking-tight">{user?.name}</h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border shadow-2xs ${roleClass}`}
              >
                <Icon name="user" className="size-3" />
                {user?.role || "Staff"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400 font-mono">
              UID: #{String(user?.id || 1).padStart(4, "0")} • {user?.email || "No email assigned"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-2.5 text-right">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#FF9F43]">
            Account Status
          </span>
          <strong className="block text-xs font-black text-emerald-600">● Active & Authorized</strong>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 2. EDIT PROFILE DETAILS */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <span className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43] border border-orange-100 shadow-2xs">
                <Icon name="edit" className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-[#0B1E38]">Personal Information</h3>
                <p className="text-[11px] text-slate-400 font-medium">Update your name, contact and email</p>
              </div>
            </div>

            <form id="profile-form" onSubmit={handleProfileSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                  placeholder="e.g. user@mobileshop.com"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                  placeholder="0300-1234567"
                />
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              form="profile-form"
              disabled={savingProfile}
              className="rounded-xl bg-[#FF9F43] px-5 py-2.5 text-xs font-black text-white hover:bg-[#F38C2A] shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? "Saving Profile..." : "Save Profile Details"}
            </button>
          </div>
        </div>

        {/* 3. CHANGE PASSWORD */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <span className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                <Icon name="lock" className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-[#0B1E38]">Change Password</h3>
                <p className="text-[11px] text-slate-400 font-medium">Update your login password securely</p>
              </div>
            </div>

            <form id="password-form" onSubmit={handlePasswordSubmit} className="mt-5 space-y-4 text-xs">
              {/* Current Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={passwordForm.current_password}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }));
                      setPasswordErrors((prev) => ({ ...prev, current_password: undefined }));
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 pl-3 pr-10 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    <Icon name={showCurrentPassword ? "eye-off" : "eye"} className="size-4" />
                  </button>
                </div>
                {passwordErrors.current_password && (
                  <span className="mt-1 block text-[10px] font-bold text-rose-600">
                    {passwordErrors.current_password}
                  </span>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={passwordForm.new_password}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }));
                      setPasswordErrors((prev) => ({ ...prev, new_password: undefined }));
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 pl-3 pr-10 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                    placeholder="Min. 4 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    <Icon name={showNewPassword ? "eye-off" : "eye"} className="size-4" />
                  </button>
                </div>
                {passwordErrors.new_password && (
                  <span className="mt-1 block text-[10px] font-bold text-rose-600">
                    {passwordErrors.new_password}
                  </span>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={passwordForm.confirm_password}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }));
                      setPasswordErrors((prev) => ({ ...prev, confirm_password: undefined }));
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 pl-3 pr-10 text-xs font-bold text-slate-800 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                    placeholder="Repeat new password"
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
                {passwordErrors.confirm_password && (
                  <span className="mt-1 block text-[10px] font-bold text-rose-600">
                    {passwordErrors.confirm_password}
                  </span>
                )}
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              form="password-form"
              disabled={savingPassword}
              className="rounded-xl bg-[#0B1E38] px-5 py-2.5 text-xs font-black text-white hover:bg-[#152B4D] shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
