import apiClient from "./apiClient";
import supabase, { isSupabaseConfigured } from "./supabaseClient";

const dataOf = (response) => response.data?.data || response.data;

export const defaultSettings = {
  shop: {
    shop_name: "Mobile Shop POS",
    address: "Main Boulevard, Lahore",
    phone: "+92 300 1234567",
    email: "info@mobileshop.pk",
    registration_number: "REG-10023",
    default_customer_name: "Walk-in Customer",
    receipt_footer: "Thank you for shopping with us! Please visit again.",
    return_policy: "7-day check warranty on mobile accessories with original bill.",
    logo: "",
  },
  localization: {
    currency_code: "PKR",
    currency_symbol: "Rs.",
    currency_position: "before",
    decimal_places: 2,
    thousand_separator: ",",
    decimal_separator: ".",
    timezone: "Asia/Karachi",
    date_format: "d-m-Y",
    time_format: "12",
    first_day_of_week: "monday",
  },
  tax: {
    enabled: "0",
    name: "GST / Sale Tax",
    percentage: "0",
    calculation_mode: "after_discount",
    show_on_receipt: "0",
  },
  discounts: {
    enabled: "1",
    default_type: "percentage",
    default_value: "0",
    maximum_cashier_discount: "50",
    allow_cashier_discounts: "1",
    require_admin_above_limit: "1",
  },
  inventory: {
    global_tracking_enabled: "1",
    default_minimum_stock: "5",
    allow_negative_stock: "0",
    low_stock_alerts: "1",
    out_of_stock_alerts: "1",
    wastage_tracking: "1",
    expiry_tracking: "0",
  },
  barcode: {
    enabled: "1",
    auto_focus: "1",
    auto_add: "1",
    input_timeout_ms: "50",
  },
  customers: {
    enabled: "1",
    use_walk_in: "1",
    require_phone: "0",
    save_optional_information: "1",
  },
  receipt: {
    paper_width: "80mm",
    show_phone: "1",
    show_logo: "1",
    show_customer: "1",
    show_cashier: "1",
    show_tax: "0",
    show_discount: "1",
    show_payment_method: "1",
    show_change: "1",
    auto_print: "1",
  },
  printer: {
    printing_method: "browser",
    printer_name: "Default POS Printer",
    label_printer_name: "Default Label Printer",
    direct_printing_enabled: "0",
    copies: "1",
  },
  security: {
    automatic_logout: "0",
    inactivity_timeout_minutes: "60",
    require_password_for_sensitive_actions: "1",
  },
  backups: {
    backup_folder: "C:/MobileShopPOS/Backups",
    retention_days: "30",
    automatic_backup: "1",
    automatic_backup_time: "23:00",
  },
};

/**
 * Resizes and converts an image file into a lightweight base64 data URL
 */
function fileToBase64(file, maxDimension = 400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result); // Fallback to raw base64
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(mime, quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function getPublicSettings() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("settings").select("*");
    if (error) throw new Error(error.message);

    const settingsMap = {};
    (data || []).forEach((item) => {
      settingsMap[item.setting_key] = item.setting_value;
    });

    return {
      shop: {
        shop_name: settingsMap.shop_name || defaultSettings.shop.shop_name,
        logo_url: settingsMap.logo || "",
        logo: settingsMap.logo || "",
        address: settingsMap.address || defaultSettings.shop.address,
        phone: settingsMap.phone || defaultSettings.shop.phone,
        email: settingsMap.email || defaultSettings.shop.email,
        default_customer_name: settingsMap.default_customer_name || "Walk-in Customer",
        receipt_footer: settingsMap.receipt_footer || defaultSettings.shop.receipt_footer,
        return_policy: settingsMap.return_policy || defaultSettings.shop.return_policy,
      },
      localization: {
        currency_symbol: settingsMap.currency_symbol || "Rs.",
        currency_code: settingsMap.currency_code || "PKR",
        decimal_places: Number(settingsMap.decimal_places || 2),
      },
      tax: {
        enabled: settingsMap.tax_enabled === "1" || settingsMap.enabled === "1",
        percentage: Number(settingsMap.percentage || settingsMap.tax_percentage || 0),
      },
      discounts: {
        enabled: settingsMap.discounts_enabled !== "0" && settingsMap.enabled !== "0",
      },
      barcode: {
        enabled: settingsMap.barcode_enabled !== "0" && settingsMap.enabled !== "0",
      },
    };
  }

  return dataOf(await apiClient.get("/settings/public"));
}

export async function getSettings() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("settings").select("*");
    if (error) throw new Error(error.message);

    const grouped = JSON.parse(JSON.stringify(defaultSettings));
    (data || []).forEach((item) => {
      if (!grouped[item.setting_group]) {
        grouped[item.setting_group] = {};
      }
      grouped[item.setting_group][item.setting_key] = item.setting_value;
    });

    return grouped;
  }

  return dataOf(await apiClient.get("/settings"));
}

export async function updateSettings(groupOrSettings, fields) {
  if (isSupabaseConfigured()) {
    let settingsToUpdate = {};
    if (typeof groupOrSettings === "string") {
      settingsToUpdate = { [groupOrSettings]: fields || {} };
    } else if (typeof groupOrSettings === "object" && groupOrSettings !== null) {
      settingsToUpdate = groupOrSettings;
    }

    const updates = [];
    for (const [group, groupFields] of Object.entries(settingsToUpdate)) {
      if (groupFields && typeof groupFields === "object") {
        for (const [key, value] of Object.entries(groupFields)) {
          updates.push({
            setting_group: group,
            setting_key: key,
            setting_value: String(value ?? ""),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    if (updates.length > 0) {
      const { error } = await supabase.from("settings").upsert(updates, {
        onConflict: "setting_group,setting_key",
      });
      if (error) throw new Error(error.message);
    }
    return { success: true, message: "Settings updated successfully." };
  }

  const payload = typeof groupOrSettings === "string" ? { [groupOrSettings]: fields } : groupOrSettings;
  return (await apiClient.put("/settings", payload)).data;
}

export async function uploadShopLogo(file) {
  if (isSupabaseConfigured()) {
    let logoUrl = "";

    // 1. Try Supabase Storage
    try {
      const fileName = `logo_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("shop_logos")
        .upload(fileName, file, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("shop_logos").getPublicUrl(fileName);
        logoUrl = urlData?.publicUrl || "";
      }
    } catch {
      // Storage bucket not created or failed, fall back to Base64
    }

    // 2. If storage upload was skipped or failed, convert to high-performance base64 data URL
    if (!logoUrl) {
      logoUrl = await fileToBase64(file, 400, 0.85);
    }

    // 3. Save into Supabase settings table
    const { error: dbError } = await supabase.from("settings").upsert(
      {
        setting_group: "shop",
        setting_key: "logo",
        setting_value: logoUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_group,setting_key" }
    );

    if (dbError) throw new Error(dbError.message);

    return { success: true, message: "Logo updated successfully.", logo_url: logoUrl };
  }

  const body = new FormData();
  body.append("logo", file);
  return (await apiClient.post("/settings/logo", body, { headers: { "Content-Type": undefined } })).data;
}

export async function removeShopLogo() {
  if (isSupabaseConfigured()) {
    await supabase.from("settings").upsert(
      {
        setting_group: "shop",
        setting_key: "logo",
        setting_value: "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_group,setting_key" }
    );

    return { success: true, message: "Logo removed successfully." };
  }

  return (await apiClient.delete("/settings/logo")).data;
}
