import { useCallback } from "react";
import useAuth from "./useAuth";

export const ADMIN_ALL_PERMISSIONS = [
  "dashboard.view",
  "pos.access",
  "sales.view",
  "sales.view_all",
  "sales.complete",
  "sales.hold",
  "sales.cancel",
  "sales.refund",
  "sales.reprint",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "products.costs.view",
  "categories.manage",
  "inventory.view",
  "inventory.adjust",
  "expenses.view",
  "expenses.manage",
  "reports.view",
  "reports.profit",
  "reports.export",
  "users.manage",
  "settings.manage",
  "backups.create",
  "backups.restore",
  "activity_logs.view",
  "barcodes.generate",
  "labels.print",
  "suppliers.view",
  "suppliers.manage",
  "purchases.view",
  "purchases.create",
  "purchases.update",
  "purchases.cancel",
  "purchases.pay",
  "purchases.return",
  "purchases.export",
  "notifications.view",
  "notifications.manage",
];

export const MANAGER_PERMISSIONS = [
  "dashboard.view",
  "pos.access",
  "sales.view",
  "sales.view_all",
  "sales.complete",
  "sales.hold",
  "sales.reprint",
  "products.view",
  "products.create",
  "products.update",
  "products.costs.view",
  "categories.manage",
  "inventory.view",
  "inventory.adjust",
  "suppliers.view",
  "suppliers.manage",
  "purchases.view",
  "purchases.create",
  "purchases.update",
  "expenses.view",
  "expenses.manage",
  "reports.view",
  "notifications.view",
  "notifications.manage",
  "labels.print",
];

export const CASHIER_PERMISSIONS = [
  "pos.access",
  "sales.view",
  "sales.complete",
  "sales.hold",
  "sales.reprint",
  "products.view",
  "notifications.view",
];

function usePermissions() {
  const { user } = useAuth();

  const can = useCallback(
    (permission) => {
      if (!user) return false;
      const role = user.role?.toLowerCase() || "cashier";

      // Super Admin has unrestricted access to all modules
      if (role === "admin" || role === "super_admin") return true;

      // Check explicit user permissions array
      if (Array.isArray(user.permissions) && user.permissions.length > 0) {
        if (user.permissions.includes("all_access")) return true;
        if (user.permissions.includes(permission)) return true;
      }

      // Check default role-based capabilities
      if (role === "manager") {
        return MANAGER_PERMISSIONS.includes(permission);
      }

      if (role === "cashier") {
        return CASHIER_PERMISSIONS.includes(permission);
      }

      return false;
    },
    [user]
  );

  const canAny = useCallback(
    (permissionsList = []) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      return permissionsList.some((permission) => can(permission));
    },
    [user, can]
  );

  const role = user?.role?.toLowerCase() || "cashier";
  const permissions =
    role === "admin"
      ? ADMIN_ALL_PERMISSIONS
      : role === "manager"
      ? MANAGER_PERMISSIONS
      : CASHIER_PERMISSIONS;

  return { permissions, can, canAny };
}

export default usePermissions;