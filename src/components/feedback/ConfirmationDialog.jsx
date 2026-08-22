import React, { useEffect, useRef } from "react";
import Icon from "../Icon";

const toneConfig = {
  danger: {
    icon: "trash",
    iconBg: "bg-rose-50 border border-rose-200 text-rose-600",
    confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-200",
  },
  warning: {
    icon: "alert",
    iconBg: "bg-amber-50 border border-amber-200 text-amber-600",
    confirmBtn: "bg-[#FF9F43] hover:bg-[#F38C2A] text-white shadow-xs focus:ring-orange-200",
  },
  success: {
    icon: "check",
    iconBg: "bg-emerald-50 border border-emerald-200 text-emerald-600",
    confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-200",
  },
  info: {
    icon: "info",
    iconBg: "bg-blue-50 border border-blue-200 text-blue-600",
    confirmBtn: "bg-[#FF9F43] hover:bg-[#F38C2A] text-white shadow-xs focus:ring-orange-200",
  },
  neutral: {
    icon: "user",
    iconBg: "bg-orange-50 border border-orange-200 text-[#FF9F43]",
    confirmBtn: "bg-[#FF9F43] hover:bg-[#F38C2A] text-white shadow-xs focus:ring-orange-200",
  },
};

export default function ConfirmationDialog({ dialog, onResolve }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (confirmBtnRef.current && dialog?.tone !== "danger") {
      confirmBtnRef.current.focus();
    }
  }, [dialog?.tone]);

  if (!dialog) return null;

  const tone = toneConfig[dialog.tone] || toneConfig.neutral;

  const handleConfirm = () => onResolve(true);
  const handleCancel = () => onResolve(false);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog Box */}
      <div
        className="relative z-10 w-full max-w-md transform overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-2xl transition-all animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start gap-4">
          {/* Tone Icon */}
          <div
            className={`grid size-12 shrink-0 place-items-center rounded-2xl shadow-2xs ${tone.iconBg}`}
          >
            <Icon name={tone.icon} className="size-5" />
          </div>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-black tracking-tight text-[#0B1E38]"
              id="modal-title"
            >
              {dialog.title}
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed">
              {dialog.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            {dialog.cancelText || "Cancel"}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            onClick={handleConfirm}
            className={`rounded-xl px-5 py-2.5 text-xs font-black transition cursor-pointer focus:outline-none focus:ring-2 ${tone.confirmBtn}`}
          >
            {dialog.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
