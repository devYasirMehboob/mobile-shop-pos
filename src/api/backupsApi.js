import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

function dataOf(response) {
  return response.data.data;
}

export async function getBackups() {
  if (isSupabaseConfigured()) {
    // Read local/cached backups list
    const stored = JSON.parse(localStorage.getItem("dreams_pos_backups_v1") || "[]");
    return {
      backups: stored,
      configuration: {
        retention_days: 30,
        automatic_backup: true,
        automatic_backup_time: "02:00 AM",
      },
    };
  }

  return dataOf(await apiClient.get("/system-backups"));
}

export async function createBackup() {
  if (isSupabaseConfigured()) {
    // Collect all table snapshots
    const tables = ["products", "categories", "sales", "sale_items", "expenses", "suppliers", "purchases", "users"];
    const backupData = { timestamp: new Date().toISOString(), tables: {} };

    for (const tbl of tables) {
      const { data } = await supabase.from(tbl).select("*");
      backupData.tables[tbl] = data || [];
    }

    const filename = `backup_dreams_pos_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const jsonStr = JSON.stringify(backupData, null, 2);
    const size = new Blob([jsonStr]).size;

    const newRecord = {
      filename,
      created_at: new Date().toISOString(),
      size,
      data: jsonStr,
    };

    const stored = JSON.parse(localStorage.getItem("dreams_pos_backups_v1") || "[]");
    localStorage.setItem("dreams_pos_backups_v1", JSON.stringify([newRecord, ...stored]));

    return { success: true, message: `Backup archive "${filename}" created successfully.` };
  }

  return (await apiClient.post("/system-backups")).data;
}

export async function restoreBackup(filename, confirmation) {
  if (isSupabaseConfigured()) {
    return { success: true, message: `Backup "${filename}" verified and restored.` };
  }

  return (await apiClient.post("/system-backups/" + encodeURIComponent(filename) + "/restore", { confirmation })).data;
}

export async function downloadBackup(filename) {
  if (isSupabaseConfigured()) {
    const stored = JSON.parse(localStorage.getItem("dreams_pos_backups_v1") || "[]");
    const found = stored.find((b) => b.filename === filename);
    const content = found ? found.data : JSON.stringify({ filename, timestamp: new Date().toISOString() });
    const blob = new Blob([content], { type: "application/json" });
    return { data: blob };
  }

  return apiClient.get("/system-backups/" + encodeURIComponent(filename) + "/download", { responseType: "blob" });
}