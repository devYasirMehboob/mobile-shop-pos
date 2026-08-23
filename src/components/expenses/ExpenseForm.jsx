import { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import Icon from "../Icon";
import { getExpenseCategories, receiptUrl } from "../../api/expensesApi";
import InlineError from "../feedback/InlineError";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card / POS Terminal" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_wallet", label: "JazzCash / EasyPaisa" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const empty = {
  expense_category_id: "",
  title: "",
  amount: "",
  expense_date: new Date().toISOString().slice(0, 10),
  description: "",
  payment_method: "cash",
  reference_number: "",
  receipt: null,
  remove_receipt: false,
};

function ExpenseForm({
  isOpen,
  expense,
  categories = [],
  isSubmitting,
  serverErrors,
  onClose,
  onSubmit,
  onOpenCategories,
}) {
  const [form, setForm] = useState(empty);
  const [localError, setLocalError] = useState("");
  const [categoryList, setCategoryList] = useState(categories);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoryList(categories);
    } else if (isOpen) {
      getExpenseCategories()
        .then((data) => setCategoryList(data || []))
        .catch(() => {});
    }
  }, [categories, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLocalError("");
      if (expense) {
        setForm({
          ...empty,
          expense_category_id: String(expense.expense_category_id || ""),
          title: expense.title || "",
          amount: String(expense.amount || ""),
          expense_date: expense.expense_date
            ? String(expense.expense_date).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          description: expense.description || "",
          payment_method: expense.payment_method || "cash",
          reference_number: expense.reference_number || "",
          receipt: null,
          remove_receipt: false,
        });
      } else {
        setForm(empty);
      }
    }
  }, [isOpen, expense]);

  const preview = useMemo(
    () => (form.receipt ? URL.createObjectURL(form.receipt) : ""),
    [form.receipt],
  );

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function change(key, value) {
    setForm((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (
      !form.title.trim() ||
      !form.expense_category_id ||
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      setLocalError(
        "Please select a category, enter a valid title and positive amount.",
      );
      return;
    }
    setLocalError("");
    onSubmit(form);
  }

  const activeCategories = (categoryList.length > 0 ? categoryList : categories).filter(
    (c) => !c.status || c.status === "active"
  );

  return (
    <Modal
      isOpen={isOpen}
      title={expense ? "Edit Expense Record" : "Add New Expense"}
      description={
        expense
          ? `Modifying expense entry #${expense.id}`
          : "Record shop overheads, bills, employee stipends, and daily petty cash."
      }
      onClose={isSubmitting ? () => {} : onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* Scrollable Fields Container */}
        <div className="max-h-[62vh] overflow-y-auto p-5 space-y-3.5 scrollbar-thin">
          {localError && <InlineError error={localError} />}

          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* 1. Title (Full Width) */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Expense Title / Purpose <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="tag" className="size-3.5" />
                </span>
                <input
                  autoFocus
                  required
                  type="text"
                  maxLength={150}
                  placeholder="e.g. July Electricity Bill, Staff Lunch, Shop Generator Fuel"
                  value={form.title}
                  onChange={(e) => change("title", e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold text-slate-900 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
              {serverErrors?.title && (
                <span className="mt-1 text-[11px] font-bold text-rose-600">
                  {serverErrors.title[0]}
                </span>
              )}
            </div>

            {/* 2. Category Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Category <span className="text-rose-500">*</span>
                </label>
                {onOpenCategories && (
                  <button
                    type="button"
                    onClick={onOpenCategories}
                    className="text-[10px] font-bold text-[#FF9F43] hover:underline cursor-pointer"
                  >
                    + Manage
                  </button>
                )}
              </div>
              <select
                required
                value={form.expense_category_id}
                onChange={(e) => change("expense_category_id", e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none cursor-pointer"
              >
                <option value="">Choose Expense Category...</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {serverErrors?.expense_category_id && (
                <span className="mt-1 text-[11px] font-bold text-rose-600">
                  {serverErrors.expense_category_id[0]}
                </span>
              )}
            </div>

            {/* 3. Amount Input */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                  Rs.
                </span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => change("amount", e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 font-mono text-xs font-black text-slate-900 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none"
                />
              </div>
              {serverErrors?.amount && (
                <span className="mt-1 text-[11px] font-bold text-rose-600">
                  {serverErrors.amount[0]}
                </span>
              )}
            </div>

            {/* 4. Payment Method */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Payment Method
              </label>
              <select
                value={form.payment_method}
                onChange={(e) => change("payment_method", e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Expense Date */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.expense_date}
                onChange={(e) => change("expense_date", e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none cursor-pointer"
              />
              {serverErrors?.expense_date && (
                <span className="mt-1 text-[11px] font-bold text-rose-600">
                  {serverErrors.expense_date[0]}
                </span>
              )}
            </div>

            {/* 6. Reference / Invoice Number */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Reference / Bill / Txn #
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Optional
                </span>
              </div>
              <input
                type="text"
                maxLength={150}
                placeholder="e.g. Utility Consumer #, Cheque #, Bank Txn ID"
                value={form.reference_number}
                onChange={(e) => change("reference_number", e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none placeholder:text-slate-400"
              />
            </div>

            {/* 7. Description / Notes */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Description &amp; Audit Notes
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Optional
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={1000}
                placeholder="Additional expenditure details or notes for accountant..."
                value={form.description}
                onChange={(e) => change("description", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none placeholder:text-slate-400"
              />
            </div>

            {/* 8. Receipt Attachment */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Attach Bill / Receipt Photo
                </label>
                <span className="text-[10px] text-slate-400">Max 2 MB</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-2.5">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    change("receipt", e.target.files?.[0] || null)
                  }
                  className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0B1E38] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white file:cursor-pointer hover:file:bg-slate-800 cursor-pointer"
                />

                {form.receipt && (
                  <button
                    type="button"
                    onClick={() => change("receipt", null)}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Existing / Selected Receipt Preview */}
              {(preview ||
                (expense?.receipt_image && !form.remove_receipt)) && (
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
                  <img
                    src={preview || receiptUrl(expense.receipt_image)}
                    alt="Receipt Preview"
                    className="size-12 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800">
                      {preview ? "New Upload Ready" : "Attached Receipt Image"}
                    </div>
                    {expense?.receipt_image && !preview && (
                      <label className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-rose-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.remove_receipt}
                          onChange={(e) =>
                            change("remove_receipt", e.target.checked)
                          }
                          className="rounded accent-rose-600"
                        />
                        <span>Remove Saved Receipt Image</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="flex items-center justify-end gap-2 pb-5 pr-5 border-t border-slate-100 pt-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1E38] px-5 py-2 text-xs font-black text-white shadow-md hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <Icon
              name={expense ? "check" : "plus"}
              className="size-3.5 text-orange-400"
            />
            <span>
              {isSubmitting
                ? "Saving..."
                : expense
                  ? "Update Expense"
                  : "Add Expense"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ExpenseForm;
