import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://iukpojiguyolesysjnmb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1a3BvamlndXlvbGVzeXNqbm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTgyMTMsImV4cCI6MjEwMjczNDIxM30.ZbBefjjoRI_m0MYr7n97BYxm20MaNC0reTBfsfVrPrk";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from("categories").select("id, name");
  console.log("Categories in Supabase:", data?.length, error?.message || "OK");
}

test();
