import { useState } from "react";
import Icon from "../Icon";
import useAlert from "../../hooks/useAlert";
import useConfirmation from "../../hooks/useConfirmation";
import { seedDemoStoreData } from "../../utils/seedDatabaseClient";

export default function DemoDataSettings() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const alert = useAlert();
  const confirm = useConfirmation();

  const handleSeed = async () => {
    const confirmed = await confirm({
      title: "Seed Complete Demo Data?",
      description:
        "This will insert 30+ products across 10 categories, batches, suppliers, purchases, expenses, and sales into Supabase.",
      confirmText: "Yes, Seed Demo Store",
      tone: "primary",
    });

    if (!confirmed) return;

    setIsSeeding(true);
    setLastResult(null);

    try {
      const res = await seedDemoStoreData();
      if (res.success) {
        setLastResult(res.results);
        alert.success(
          `Demo data seeded successfully! Added ${res.results.products} products, ${res.results.categories} categories, and sales.`
        );
      }
    } catch (err) {
      alert.error(err.message || "Failed to seed demo data.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-orange-100 text-base">
                ⚡
              </span>
              <h2 className="text-base font-black text-[#0B1E38]">
                Store Demo Data & Test Migration
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
              Populate realistic mobile shop inventory, categories, batches, suppliers, expenses, and sales to test all POS features and reports.
            </p>
          </div>

          <button
            type="button"
            disabled={isSeeding}
            onClick={handleSeed}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF9F43] px-5 py-2.5 text-xs font-black text-white shadow-sm shadow-orange-500/20 hover:bg-[#F38C2A] transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Icon
              name={isSeeding ? "refresh" : "database"}
              className={`size-4 ${isSeeding ? "animate-spin" : ""}`}
            />
            <span>{isSeeding ? "Seeding Store Data..." : "Seed Demo Store"}</span>
          </button>
        </div>

        {lastResult && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <h3 className="text-xs font-black text-emerald-800">
              ✓ Database Populated Successfully:
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-bold text-emerald-700">
              <div>📦 {lastResult.products} Products</div>
              <div>📂 {lastResult.categories} Categories</div>
              <div>🏢 {lastResult.suppliers} Suppliers</div>
              <div>💰 {lastResult.expenses} Expenses</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. SQL Migration File Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-blue-100 text-base">
            📄
          </span>
          <h2 className="text-base font-black text-[#0B1E38]">
            Supabase SQL Migration Script
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
          You can also run the comprehensive SQL migration file in the Supabase SQL Editor.
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-700">
              supabase/seed_data.sql
            </span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
              Ready
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Contains 30+ products across 10 categories, batch tracking, supplier balances, 6 expense categories, and sales for August 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
