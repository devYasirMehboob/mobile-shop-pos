import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import usePermissions from "../hooks/usePermissions";

function PermissionRoute({ permission, children }) {
  const { can } = usePermissions();
  const { user } = useAuth();

  if (can(permission)) {
    return children;
  }

  // If cashier tries to open restricted admin sections, gracefully fallback to POS
  if (user?.role === "cashier") {
    return <Navigate to="/pos" replace />;
  }

  return <Navigate to="/access-denied" replace />;
}

export default PermissionRoute;