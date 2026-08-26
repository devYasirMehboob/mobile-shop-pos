import { useState } from "react";
import Icon from "../Icon";

export default function ContactDeveloperModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState("");

  if (!isOpen) return null;

  const developerInfo = {
    name: "Yasir Mehboob",
    title: "Lead Full-Stack POS Engineer",
    email: "yasirmehboob.dev@gmail.com",
    whatsapp: "+923143328315",
    whatsappFormatted: "+92 314 3328315",
    availability: "Available for Custom POS Features & Support",
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  const whatsappUrl = `https://wa.me/${developerInfo.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    "Hello Yasir! I am using the Mobile Shop POS system and need support / custom feature development.",
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Developer Header Avatar */}
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
          <div className="relative">
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-tr from-[#0E2040] to-[#1E3A8A] text-xl font-black text-white shadow-md shadow-blue-950/20">
              Y
            </div>
            <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-[#0B1E38] tracking-tight">
                {developerInfo.name}
              </h3>
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-blue-700 border border-blue-200/60">
                Developer
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {developerInfo.title}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {developerInfo.availability}
            </span>
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="mt-5 space-y-3">
          {/* 1. WhatsApp Action */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-300 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-white text-lg shadow-sm">
                💬
              </span>
              <div>
                <strong className="block text-xs font-black text-emerald-950">
                  Chat on WhatsApp
                </strong>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {developerInfo.whatsappFormatted}
                </span>
              </div>
            </div>
            <span className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-2xs">
              Chat Now →
            </span>
          </a>

          {/* 2. Email Action */}
          <a
            href={`mailto:${developerInfo.email}?subject=Mobile%20Shop%20POS%20Support%20Inquiry`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 text-blue-900 transition hover:bg-blue-100 hover:border-blue-300 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white text-lg shadow-sm">
                ✉️
              </span>
              <div className="min-w-0">
                <strong className="block text-xs font-black text-blue-950">
                  Send Direct Email
                </strong>
                <span className="text-[11px] font-semibold text-blue-700 truncate block">
                  {developerInfo.email}
                </span>
              </div>
            </div>
            <span className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-2xs">
              Email →
            </span>
          </a>
        </div>

        {/* Copy Details Section */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-semibold">Email: {developerInfo.email}</span>
            <button
              type="button"
              onClick={() => handleCopy(developerInfo.email, "email")}
              className="font-bold text-[#FF9F43] hover:underline cursor-pointer"
            >
              {copied === "email" ? "Copied! ✓" : "Copy"}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            2025-2026 BiteBlix Solutions All right reserved <br />
            Designed &amp; Developed By{" "}
            <a
              href="https://biteblixsolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF9F43] font-bold hover:underline"
            >
              biteblixsolutions.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
