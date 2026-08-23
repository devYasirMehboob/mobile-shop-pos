import { useEffect, useState, useMemo } from "react";
import Modal from "../Modal";
import StatusBadge from "../StatusBadge";
import Icon from "../Icon";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  updateExpenseCategoryStatus,
} from "../../api/expensesApi";
import useAlert from "../../hooks/useAlert";
import useConfirmation from "../../hooks/useConfirmation";
import normalizeApiError from "../../utils/normalizeApiError";
import InlineError from "../feedback/InlineError";

const blank = { name: "", description: "" };

function ExpenseCategoriesManager({ isOpen, onClose, onChanged }) {
  const alert = useAlert();
  const confirmDialog = useConfirmation();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setCategories(await getExpenseCategories());
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      setForm(blank);
      setEditing(null);
      setSearch("");
      setError("");
      load();
    }
  }, [isOpen]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const activeCount = categories.filter((c) => c.status === "active").length;

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await updateExpenseCategory(editing.id, form);
        alert.success("Category updated successfully.");
      } else {
        await createExpenseCategory(form);
        alert.success("Category created successfully.");
      }
      setForm(blank);
      setEditing(null);
      await load();
      onChanged?.();
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleStatus(c) {
    setBusy(true);
    try {
      const nextStatus = c.status === "active" ? "inactive" : "active";
      await updateExpenseCategoryStatus(c.id, nextStatus);
      await load();
      onChanged?.();
      alert.success(`Category set to ${nextStatus}.`);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    const confirmed = await confirmDialog({
      title: "Delete Expense Category?",
      description: `Are you sure you want to delete "${c.name}"? Only categories with 0 recorded expenses can be removed.`,
      confirmText: "Delete Category",
      tone: "danger",
      destructive: true,
      requiredText: c.name,
    });

    if (!confirmed) return;

    setBusy(true);
    try {
      await deleteExpenseCategory(c.id);
      await load();
      onChanged?.();
      alert.success("Category deleted.");
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Expense Categories"
      description="Manage business expense categories to keep spending records structured and auditable."
      onClose={onClose}
      size="xl"
    >
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left Column: Form Card (5 cols) */}
        <div className="md:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43]">
              <Icon name={editing ? "edit" : "plus"} className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0B1E38]">
                {editing ? "Edit Category" : "New Expense Category"}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {editing
                  ? `Modifying "${editing.name}"`
                  : "Add a category for store expenses"}
              </p>
            </div>
          </div>

          {error && <InlineError error={error} />}

          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
                maxLength={100}
                placeholder="e.g. Electricity, Shop Rent, Staff Tea"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Description
                </label>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((v) => ({ ...v, description: e.target.value }))
                }
                maxLength={500}
                placeholder="Brief details about what expenses fall into this category..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={busy || !form.name.trim()}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B1E38] px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                <Icon name={editing ? "check" : "plus"} className="size-3.5 text-orange-400" />
                <span>
                  {busy ? "Saving..." : editing ? "Save Changes" : "Create Category"}
                </span>
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(blank);
                    setError("");
                  }}
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Directory List (7 cols) */}
        <div className="md:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3.5">
          {/* Header & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Categories List
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700">
                {activeCount} Active
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" className="size-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-36 sm:w-48 rounded-xl border border-slate-200 bg-slate-50/80 pl-8 pr-2.5 text-xs font-medium text-slate-800 focus:border-[#FF9F43] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Categories Scrollable Container */}
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                Loading categories...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {search ? "No matching categories found." : "No expense categories yet."}
              </div>
            ) : (
              filteredCategories.map((c) => {
                const isUsed = Number(c.expense_count || 0) > 0;
                const isCurrentEdit = editing?.id === c.id;

                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                      isCurrentEdit
                        ? "border-[#FF9F43] bg-orange-50/40 ring-1 ring-[#FF9F43]/30"
                        : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    {/* Left Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs truncate">
                          {c.name}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.description && (
                        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                          {c.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <span className="font-mono">{c.expense_count || 0} expenses recorded</span>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(c);
                          setForm({
                            name: c.name,
                            description: c.description || "",
                          });
                          setError("");
                        }}
                        className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        title="Edit category"
                      >
                        <Icon name="edit" className="size-3.5" />
                      </button>

                      {/* Status Toggle Button */}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleStatus(c)}
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition cursor-pointer ${
                          c.status === "active"
                            ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        title={c.status === "active" ? "Disable category" : "Enable category"}
                      >
                        {c.status === "active" ? "Disable" : "Enable"}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        disabled={isUsed || busy}
                        onClick={() => remove(c)}
                        className={`grid size-7 place-items-center rounded-lg border transition cursor-pointer ${
                          isUsed
                            ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                            : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                        }`}
                        title={isUsed ? "Cannot delete: linked expenses exist" : "Delete category"}
                      >
                        <Icon name="trash" className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ExpenseCategoriesManager;
