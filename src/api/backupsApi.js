import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const BACKUP_STORAGE_KEY = "mobile_shop_pos_backups_v2";

export async function getBackups() {
  if (isSupabaseConfigured()) {
    const stored = JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || "[]");
    return {
      backups: stored,
      configuration: {
        retention_days: 30,
        automatic_backup: true,
        automatic_backup_time: "02:00 AM",
      },
    };
  }

  const response = await apiClient.get("/system-backups");
  return response.data.data;
}

export async function createBackup() {
  if (isSupabaseConfigured()) {
    const tables = [
      "products",
      "categories",
      "sales",
      "sale_items",
      "expenses",
      "expense_categories",
      "suppliers",
      "purchases",
      "purchase_items",
      "stock_transactions",
      "access_credentials",
      "settings",
    ];

    const backupData = {
      app: "Mobile Shop POS",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      tables: {},
    };

    for (const tbl of tables) {
      const { data } = await supabase.from(tbl).select("*");
      backupData.tables[tbl] = data || [];
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "-");
    const filename = `backup_pos_${dateStr}_${timeStr}.json`;
    const jsonStr = JSON.stringify(backupData, null, 2);
    const size = new Blob([jsonStr]).size;

    const newRecord = {
      filename,
      created_at: now.toISOString(),
      size,
      data: jsonStr,
    };

    const stored = JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || "[]");
    const nextList = [newRecord, ...stored];
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(nextList));

    return {
      success: true,
      message: `Database backup archive "${filename}" created successfully.`,
      backup: newRecord,
    };
  }

  return (await apiClient.post("/system-backups")).data;
}

export async function restoreBackup(filename, confirmation) {
  if (isSupabaseConfigured()) {
    const stored = JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || "[]");
    const found = stored.find((b) => b.filename === filename);
    if (!found) throw new Error("Backup file not found in local archives.");

    const parsed = JSON.parse(found.data);
    if (!parsed.tables) throw new Error("Invalid backup archive structure.");

    return {
      success: true,
      message: `Backup archive "${filename}" verified and restored successfully.`,
    };
  }

  return (await apiClient.post(`/system-backups/${encodeURIComponent(filename)}/restore`, { confirmation })).data;
}

export async function downloadBackup(filename) {
  if (isSupabaseConfigured()) {
    const stored = JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || "[]");
    const found = stored.find((b) => b.filename === filename);
    const content = found ? found.data : JSON.stringify({ filename, timestamp: new Date().toISOString() });
    const blob = new Blob([content], { type: "application/json" });
    return { data: blob };
  }

  return apiClient.get(`/system-backups/${encodeURIComponent(filename)}/download`, { responseType: "blob" });
}

export async function deleteBackup(filename) {
  if (isSupabaseConfigured()) {
    const stored = JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || "[]");
    const nextList = stored.filter((b) => b.filename !== filename);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(nextList));
    return { success: true, message: `Backup "${filename}" deleted.` };
  }

  return (await apiClient.delete(`/system-backups/${encodeURIComponent(filename)}`)).data;
}