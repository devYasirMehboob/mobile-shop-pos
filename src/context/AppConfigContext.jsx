import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import supabase, { isSupabaseConfigured } from "../api/supabaseClient";
import { setDebugMode } from "../utils/logger";

const AppConfigContext = createContext();

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState({ debug: false, version: "1.0.0" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Configure default fallback first
    setDebugMode(false);

    if (isSupabaseConfigured()) {
      // In Supabase mode, resolve app config directly without legacy PHP server
      if (isMounted) {
        setConfig({ debug: false, version: "1.0.0", mode: "supabase" });
        setLoading(false);
      }
      return;
    }

    apiClient
      .get("/app-config", { silent: true })
      .then((response) => {
        if (isMounted && response.data?.success) {
          const fetchedConfig = response.data.data;
          setConfig(fetchedConfig);
          setDebugMode(fetchedConfig.debug);
        }
      })
      .catch(() => {
        // Safe fallback on error
        setDebugMode(false);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return null; // Don't render until config is loaded
  }

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppConfigContext);
