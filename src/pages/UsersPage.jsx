import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../components/feedback/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/feedback/LoadingState";
import PageErrorState from "../components/feedback/PageErrorState";
import RolePermissionsDialog from "../components/users/RolePermissionsDialog";
import ResetPasswordDialog from "../components/users/ResetPasswordDialog";
import UserDetailsModal from "../components/users/UserDetailsModal";
import UserFilters from "../components/users/UserFilters";
import UserForm from "../components/users/UserForm";
import UserPermissionsDialog from "../components/users/UserPermissionsDialog";
import UsersPagination from "../components/users/UsersPagination";
import UsersTable from "../components/users/UsersTable";
import {
  createUser,
  deleteUser,
  getPermissions,
  getRoles,
  getUser,
  getUsers,
  resetUserPassword,
  updateRolePermissions,
  updateUser,
  updateUserPermissions,
  updateUserStatus,
} from "../api/usersApi";
import useAuth from "../hooks/useAuth";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";

const initialFilters = {
  search: "",
  role: "",
  status: "",
  page: 1,
  limit: 15,
};

function UsersPage() {
  const { user: currentUser } = useAuth();
  const alert = useAlert();
  const confirmDialog = useConfirmation();

  const [filters, setFilters] = useState(initialFilters);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    total_users: 0,
    admins: 0,
    cashiers: 0,
    active_users: 0,
  });
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const [formUser, setFormUser] = useState(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [permissionDetails, setPermissionDetails] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [roleDialog, setRoleDialog] = useState(false);

  const load = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      setPageError(null);
      try {
        const [data, roleData, permissionData] = await Promise.all([
          getUsers(filters),
          getRoles(),
          getPermissions(),
        ]);
        setUsers(data.users || []);
        if (data.summary) setSummary(data.summary);
        setPagination(data.pagination);
        setRoles(roleData || []);
        setPermissions(permissionData || []);
      } catch (error) {
        setPageError(normalizeApiError(error));
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    document.title = "Users & Access Control | Mobile Shop POS";
    const timer = setTimeout(() => load(), filters.search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, filters.search]);

  function changeFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }

  async function saveUser(payload) {
    try {
      const response = formUser
        ? await updateUser(formUser.id, payload)
        : await createUser(payload);
      setFormOpen(false);
      alert.success(response.message || "User account saved successfully.");
      await load(false);
    } catch (e) {
      throw e;
    }
  }

  async function openDetails(user, setter) {
    try {
      setter(await getUser(user.id));
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    }
  }

  async function savePassword(payload) {
    try {
      const response = await resetUserPassword(resetUser.id, payload);
      setResetUser(null);
      alert.success(response.message || "Password updated successfully.");
      await load(false);
    } catch (e) {
      throw e;
    }
  }

  async function changeStatus(user) {
    const isActivating = user.status !== "active";
    const confirmed = await confirmDialog({
      title: isActivating ? "Activate Staff Account?" : "Deactivate Staff Account?",
      description: isActivating
        ? `${user.name} will be able to log in and access POS with assigned permissions.`
        : `${user.name} will be signed out immediately and blocked from logging in.`,
      confirmText: isActivating ? "Activate User" : "Deactivate User",
      tone: isActivating ? "neutral" : "danger",
    });

    if (!confirmed) return;

    try {
      const status = isActivating ? "active" : "inactive";
      const response = await updateUserStatus(user.id, status);
      alert.success(response.message || "User status updated.");
      await load(false);
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    }
  }

  async function handleDelete(user) {
    const confirmed = await confirmDialog({
      title: `Delete user "${user.name}"?`,
      description: "This staff account will be permanently removed from access credentials.",
      confirmText: "Delete Account",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteUser(user.id);
      alert.success("User account deleted.");
      await load(false);
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    }
  }

  async function saveOverrides(overrides) {
    try {
      const response = await updateUserPermissions(
        permissionDetails.user.id,
        overrides
      );
      setPermissionDetails(null);
      alert.success(response.message || "Permissions updated.");
      await load(false);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
      throw e;
    }
  }

  async function saveRole(roleId, keys) {
    try {
      const response = await updateRolePermissions(roleId, keys);
      setRoleDialog(false);
      alert.success(response.message || "Role permissions updated.");
    } catch (e) {
      alert.error(normalizeApiError(e).message);
      throw e;
    }
  }

  if (pageError) return <PageErrorState error={pageError} onRetry={() => load()} />;

  return (
    <div className="space-y-5">
      {/* 1. Header with Breadcrumbs & Action Buttons */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-[#FF9F43]">Access Control</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-[#0B1E38] sm:text-2xl">
            User Accounts & Staff
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage staff credentials, assigned roles, permissions, and active login sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Role Permissions */}
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            onClick={() => setRoleDialog(true)}
          >
            <Icon name="key" className="size-3.5 text-purple-600" />
            <span>Role Permissions</span>
          </button>

          {/* Add User Button */}
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF9F43] px-4 text-xs font-black text-white shadow-2xs hover:bg-[#F38C2A] transition cursor-pointer"
            onClick={() => {
              setFormUser(undefined);
              setFormOpen(true);
            }}
          >
            <Icon name="plus" className="size-4" />
            <span>Add User</span>
          </button>
        </div>
      </header>

      {/* 2. Top Metric KPI Summary Cards */}
      <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Card 1: Total Users */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total Users
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43]">
              👥
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0B1E38]">{summary.total_users}</p>
          <span className="text-[10px] font-bold text-slate-400">Registered staff</span>
        </div>

        {/* Card 2: Administrators */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">
              Administrators
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-purple-50 text-purple-600">
              🛡️
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-700">{summary.admins}</p>
          <span className="text-[10px] font-bold text-slate-400">Full system access</span>
        </div>

        {/* Card 3: Cashiers */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
              Cashiers
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              💳
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{summary.cashiers}</p>
          <span className="text-[10px] font-bold text-slate-400">POS & Billing staff</span>
        </div>

        {/* Card 4: Active Accounts */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
              Active Accounts
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
              🟢
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-700">{summary.active_users}</p>
          <span className="text-[10px] font-bold text-slate-400">Can authenticate</span>
        </div>
      </section>

      {/* 3. Search & Filters Bar */}
      <UserFilters
        filters={filters}
        roles={roles}
        onChange={changeFilter}
        onClear={() => setFilters(initialFilters)}
        onRefresh={() => load()}
        isLoading={loading}
      />

      {/* 4. Users Table & Pagination */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading staff accounts..." />
        ) : users.length === 0 ? (
          <EmptyState
            title="No staff users found"
            message="Try clearing your search filters or click '+ Add User' to create one."
          />
        ) : (
          <>
            <UsersTable
              users={users}
              currentUserId={currentUser?.id}
              onView={(user) => openDetails(user, setDetails)}
              onEdit={(user) => {
                setFormUser(user);
                setFormOpen(true);
              }}
              onReset={setResetUser}
              onStatus={changeStatus}
              onPermissions={(user) => openDetails(user, setPermissionDetails)}
              onDelete={handleDelete}
            />
            <UsersPagination
              pagination={pagination}
              onPage={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </>
        )}
      </section>

      {/* Modals & Dialogs */}
      <UserForm
        isOpen={formOpen}
        user={formUser}
        roles={roles}
        onClose={() => setFormOpen(false)}
        onSave={saveUser}
      />

      <UserDetailsModal
        details={details}
        onClose={() => setDetails(null)}
      />

      <ResetPasswordDialog
        user={resetUser}
        onClose={() => setResetUser(null)}
        onSave={savePassword}
      />

      <UserPermissionsDialog
        details={permissionDetails}
        permissions={permissions}
        onClose={() => setPermissionDetails(null)}
        onSave={saveOverrides}
      />

      <RolePermissionsDialog
        isOpen={roleDialog}
        roles={roles}
        permissions={permissions}
        onClose={() => setRoleDialog(false)}
        onSave={saveRole}
      />
    </div>
  );
}

export default UsersPage;
