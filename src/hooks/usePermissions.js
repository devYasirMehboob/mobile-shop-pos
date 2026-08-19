import { useCallback } from "react";
import useAuth from "./useAuth";

const ADMIN_ALL_PERMISSIONS = [
  "dashboard.view", "pos.access", "sales.view", "sales.view_all", "sales.complete",
  "sales.hold", "sales.cancel", "sales.refund", "sales.reprint", "products.view",
  "products.create", "products.update", "products.delete", "products.costs.view",
  "categories.manage", "inventory.view", "inventory.adjust", "expenses.view",
  "expenses.manage", "reports.view", "reports.profit", "reports.export",
  "users.manage", "settings.manage", "backups.create", "backups.restore",
  "activity_logs.view", "barcodes.generate", "labels.print", "suppliers.view",
  "suppliers.manage", "purchases.view", "purchases.create", "purchases.update",
  "purchases.cancel", "purchases.pay", "purchases.return", "purchases.export",
  "notifications.view", "notifications.manage"
];

function usePermissions() {
  const { user } = useAuth();
  
  const can = useCallback((permission) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    const list = user.permissions || [];
    return list.includes(permission);
  }, [user]);

  const canAny = useCallback((permissions) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return permissions.some((permission) => can(permission));
  }, [user, can]);

  const permissions = user?.role === "admin" ? ADMIN_ALL_PERMISSIONS : (user?.permissions || []);

  return { permissions, can, canAny };
}

export default usePermissions;