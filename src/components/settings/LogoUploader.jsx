import { useRef } from "react";
import Icon from "../Icon";
import apiClient from "../../api/apiClient";

const shopImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return new URL(url, apiClient.defaults.baseURL).href;
};

function LogoUploader({ shop, isBusy, onUpload, onRemove }) {
  const input = useRef(null);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs mb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Logo Preview Square */}
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 shadow-2xs">
          {shop?.logo_url ? (
            <img
              src={shopImageUrl(shop.logo_url)}
              alt="Shop logo"
              className="size-full object-contain p-1.5"
            />
          ) : (
            <span className="text-xl font-black text-[#0B1E38]/40">
              {(shop?.shop_name || "MS").slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info and Actions */}
        <div className="flex-1">
          <h3 className="text-sm font-black text-[#0B1E38]">Shop Logo &amp; Receipt Branding</h3>
          <p className="mt-0.5 text-xs text-slate-400 font-medium">
            Appears on POS dashboard, sales reports, and 80mm thermal receipts. (JPG, PNG or WebP, max 2MB)
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              disabled={isBusy}
              onClick={() => input.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E2040] px-3.5 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-[#19325C] transition cursor-pointer disabled:opacity-50"
            >
              <Icon name="upload" className="size-3.5 text-[#FF9F43]" />
              <span>Upload New Logo</span>
            </button>

            {shop?.logo_url && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onRemove}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-extrabold text-rose-600 shadow-2xs hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
              >
                <Icon name="trash" className="size-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LogoUploader;
