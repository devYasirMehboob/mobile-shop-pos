// Offline module has been decommissioned. Cloud Supabase is the primary backend.
export default function useOffline() {
  return {
    isOnline: true,
    isEmergencyMode: false,
    offlineUser: null,
    pendingSyncCount: 0,
    isSyncing: false,
    syncStatusMessage: "",
    deviceConfig: null,
  };
}
