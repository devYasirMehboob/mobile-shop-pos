// Offline module decommissioned.
import React, { createContext } from "react";

export const OfflineContext = createContext({
  isOnline: true,
  isEmergencyMode: false,
  offlineUser: null,
  pendingSyncCount: 0,
  isSyncing: false,
  syncStatusMessage: "",
});

export function OfflineProvider({ children }) {
  return <>{children}</>;
}

export default OfflineContext;
