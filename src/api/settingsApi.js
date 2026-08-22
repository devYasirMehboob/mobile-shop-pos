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
    percentage: "0",
    tax_number: "",
    inclusive: "0",
  },
  discounts: {
    enabled: "1",
    max_discount_percentage: "50",
  },
  barcode: {
    enabled: "1",
    symbology: "code128",
    auto_generate: "1",
  },
  receipt: {
    auto_print: "1",
    paper_size: "80mm",
    show_logo: "1",
    show_tax: "0",
    show_discount: "1",
  },
  printer: {
    printer_type: "browser",
    printer_name: "Default POS Printer",
  },
  security: {
    session_timeout: "60",
    require_password_on_refund: "1",
  },
};

export async function getPublicSettings() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("settings").select("*").eq("is_public", 1);
    if (error) throw new Error(error.message);

    const settingsMap = {};
    (data || []).forEach((item) => {
      settingsMap[item.setting_key] = item.setting_value;
    });

    return {
      shop: {
        shop_name: settingsMap.shop_name || defaultSettings.shop.shop_name,
        logo_url: settingsMap.logo || "",
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
        enabled: settingsMap.tax_enabled === "1",
        percentage: Number(settingsMap.tax_percentage || 0),
      },
      discounts: {
        enabled: settingsMap.discounts_enabled !== "0",
      },
      barcode: {
        enabled: settingsMap.barcode_enabled !== "0",
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

export async function updateSettings(settings) {
  if (isSupabaseConfigured()) {
    const updates = [];
    for (const [group, fields] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(fields)) {
        updates.push({
          setting_group: group,
          setting_key: key,
          setting_value: String(value ?? ""),
          updated_at: new Date().toISOString(),
        });
      }
    }

    const { error } = await supabase.from("settings").upsert(updates, {
      onConflict: "setting_group,setting_key",
    });

    if (error) throw new Error(error.message);
    return { success: true, message: "Settings updated successfully." };
  }

  return (await apiClient.put("/settings", settings)).data;
}

export async function uploadShopLogo(file) {
  if (isSupabaseConfigured()) {
    const fileName = `logo_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("shop_logos")
      .upload(fileName, file, { upsert: true });

    if (error) throw new Error(error.message);
    const { data: urlData } = supabase.storage.from("shop_logos").getPublicUrl(fileName);

    await supabase.from("settings").upsert(
      {
        setting_group: "shop",
        setting_key: "logo",
        setting_value: urlData.publicUrl,
      },
      { onConflict: "setting_group,setting_key" }
    );

    return { success: true, logo_url: urlData.publicUrl };
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
      },
      { onConflict: "setting_group,setting_key" }
    );

    return { success: true, message: "Logo removed." };
  }

  return (await apiClient.delete("/settings/logo")).data;
}
