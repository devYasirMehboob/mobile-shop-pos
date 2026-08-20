import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://iukpojiguyolesysjnmb.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1a3BvamlndXlvbGVzeXNqbm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTgyMTMsImV4cCI6MjEwMjczNDIxM30.ZbBefjjoRI_m0MYr7n97BYxm20MaNC0reTBfsfVrPrk";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export default supabase;
