import Modal from "../Modal";
import StatusBadge from "../StatusBadge";
import { receiptUrl } from "../../api/expensesApi";
import { formatCurrency, formatDate } from "../../utils/calculateSaleTotals";

function ExpenseDetailsModal({ expense, canManage = true, onClose, onEdit, onVoid }) {
  if (!expense) return null;

  return (
    <Modal
      isOpen={Boolean(expense)}
      title="Expense Details"
      description="Saved financial record and audit status."
      onClose={onClose}
      size="md"
    >
      <div className="space-y-5 p-5 text-xs">
        {/* Header Title & Status */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400">
              {formatDate(expense.expense_date)} · {expense.category_name || "General"}
            </span>
            <h3 className="mt-1 text-lg font-black text-[#0B1E38]">{expense.title}</h3>
          </div>
          <StatusBadge status={expense.status || "active"} />
        </div>

        {/* Amount */}
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">
            Recorded Amount
          </span>
          <strong className="mt-1 block text-3xl font-black text-rose-600">
            {formatCurrency(expense.amount)}
          </strong>
        </div>

        {/* Grid Meta Details */}
        <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-400">Payment Method</dt>
            <dd className="mt-1 capitalize font-bold text-slate-700">
              {(expense.payment_method || "cash").replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-400">Added By</dt>
            <dd className="mt-1 font-bold text-slate-700">
              {expense.added_by_role || "Admin"}
            </dd>
          </div>
          {expense.reference_number && (
            <div>
              <dt className="text-[10px] font-bold uppercase text-slate-400">Reference #</dt>
              <dd className="mt-1 font-mono font-bold text-slate-700">
                {expense.reference_number}
              </dd>
            </div>
          )}
          {expense.voided_at && (
            <div>
              <dt className="text-[10px] font-bold uppercase text-rose-500">Voided At</dt>
              <dd className="mt-1 font-bold text-rose-600">
                {formatDate(expense.voided_at)}
              </dd>
            </div>
          )}
        </dl>

        {/* Notes / Description */}
        {expense.description && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-slate-700">
            <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Description / Notes
            </span>
            <p className="font-medium text-slate-700 leading-relaxed">{expense.description}</p>
          </div>
        )}

        {/* Receipt Image if available */}
        {expense.receipt_image && (
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
              Receipt Attachment
            </span>
            <a
              href={receiptUrl(expense.receipt_image)}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-slate-200 hover:opacity-90 transition"
            >
              <img
                src={receiptUrl(expense.receipt_image)}
                className="max-h-60 w-full object-contain bg-slate-50"
                alt="Expense Receipt"
              />
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>

          {canManage && expense.status === "active" && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(expense)}
              className="rounded-xl bg-[#FF9F43] px-4 py-2 text-xs font-bold text-white hover:bg-[#F38C2A] transition cursor-pointer"
            >
              Edit Expense
            </button>
          )}

          {canManage && expense.status === "active" && onVoid && (
            <button
              type="button"
              onClick={() => onVoid(expense)}
              className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              Void
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ExpenseDetailsModal;
