import { useState } from "react";
import Modal from "../Modal";
import StatusBadge from "../StatusBadge";
import Icon from "../Icon";
import { receiptUrl } from "../../api/expensesApi";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../utils/calculateSaleTotals";
import { exportExpenseToPdf } from "../../utils/pdfExport";
import useSettings from "../../hooks/useSettings";
import useAlert from "../../hooks/useAlert";

function ExpenseDetailsModal({
  expense,
  canManage = true,
  onClose,
  onEdit,
  onVoid,
}) {
  const { settings } = useSettings();
  const alert = useAlert();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!expense) return null;

  const shop = settings?.shop || {};
  const expenseNumber =
    expense.expense_number || `EXP-${String(expense.id).padStart(4, "0")}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportExpenseToPdf(expense, shop);
      alert.success("Expense voucher PDF downloaded!");
    } catch (e) {
      alert.error(e.message || "Failed to export expense PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(expense)}
      title="Expense Details"
      description={`Record: ${expenseNumber} · ${expense.category_name || "General"}`}
      onClose={onClose}
      size="md"
      showCloseButton={false}
      headerActions={
        <div className="no-print flex items-center gap-2">
          {/* PDF Download Button */}
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Download PDF Voucher"
          >
            <Icon name="download" className="size-3.5 text-[#FF9F43]" />
            <span>{isExportingPdf ? "Saving..." : "PDF"}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 rounded-xl bg-[#0B1E38] px-3 py-1 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition cursor-pointer"
            title="Print Thermal Voucher"
          >
            <Icon name="print" className="size-3.5 text-orange-400" />
            <span>Print</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-5 text-xs">
        {/* Printable Voucher Section (Active during window.print()) */}
        <div
          id="printable-expense"
          className="hidden print:block font-mono text-xs text-slate-900 bg-white p-4"
        >
          {/* Shop Logo & Name */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            {(shop.logo || shop.logo_url) && (
              <div className="flex justify-center pb-1">
                <img
                  src={shop.logo || shop.logo_url}
                  alt={shop.shop_name || "Shop Logo"}
                  className="max-h-12 max-w-[120px] object-contain"
                />
              </div>
            )}
            <h2 className="text-sm font-black uppercase text-slate-900 font-sans tracking-wide">
              {shop.shop_name || "MOBILE SHOP POS"}
            </h2>
            {shop.address && (
              <p className="text-[10px] text-slate-600 font-sans">
                {shop.address}
              </p>
            )}
            {shop.phone && (
              <p className="text-[10px] text-slate-600 font-mono">
                Tel: {shop.phone}
              </p>
            )}
            <div className="pt-1 text-[11px] font-black uppercase text-rose-700">
              *** EXPENSE PAYMENT VOUCHER ***
            </div>
          </div>

          {/* Meta */}
          <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Expense #:</span>
              <span className="font-bold text-rose-700">{expenseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="font-medium text-slate-800">
                {formatDate(expense.expense_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-slate-900">
                {expense.category_name || "General"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold uppercase text-slate-800">
                {(expense.payment_method || "cash").replaceAll("_", " ")}
              </span>
            </div>
            {expense.reference_number && (
              <div className="flex justify-between">
                <span className="text-slate-500">Ref / Bill #:</span>
                <span className="font-bold text-slate-800">
                  {expense.reference_number}
                </span>
              </div>
            )}
          </div>

          {/* Purpose & Amount */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5">
            <div className="text-slate-500 font-bold uppercase text-[10px]">
              Purpose:
            </div>
            <div className="font-bold text-slate-900 text-xs">
              {expense.title}
            </div>
            <div className="pt-2 flex justify-between items-center">
              <span className="font-bold text-slate-800">Paid Amount:</span>
              <span className="font-black text-rose-600 text-sm">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          </div>

          {expense.description && (
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px]">
              <span className="font-bold uppercase text-slate-500">Notes:</span>
              <p className="mt-0.5 text-slate-700 italic">
                {expense.description}
              </p>
            </div>
          )}

          <div className="pt-3 text-center text-[10px] text-slate-500 space-y-0.5">
            <p className="font-bold">*** Approved Financial Record ***</p>
            <p className="text-[9px] text-slate-400">Store Expense Voucher</p>
          </div>
        </div>

        {/* Modal Normal Screen View */}
        <div className="no-print space-y-4">
          {/* Header Title & Status */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400">
                {formatDate(expense.expense_date)} ·{" "}
                {expense.category_name || "General"}
              </span>
              <h3 className="mt-1 text-base font-black text-[#0B1E38]">
                {expense.title}
              </h3>
            </div>
            <StatusBadge status={expense.status || "active"} />
          </div>

          {/* Amount */}
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Recorded Amount
            </span>
            <strong className="mt-0.5 block text-2xl font-black text-rose-600">
              {formatCurrency(expense.amount)}
            </strong>
          </div>

          {/* Grid Meta Details */}
          <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
            <div>
              <dt className="text-[10px] font-black uppercase text-slate-400">
                Payment Method
              </dt>
              <dd className="mt-1 capitalize font-bold text-slate-700">
                {(expense.payment_method || "cash").replaceAll("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-black uppercase text-slate-400">
                Added By
              </dt>
              <dd className="mt-1 font-bold text-slate-700">
                {expense.added_by_role || "Admin"}
              </dd>
            </div>
            {expense.reference_number && (
              <div className="col-span-2">
                <dt className="text-[10px] font-black uppercase text-slate-400">
                  Reference / Bill #
                </dt>
                <dd className="mt-1 font-mono font-bold text-slate-800">
                  {expense.reference_number}
                </dd>
              </div>
            )}
            {expense.voided_at && (
              <div className="col-span-2">
                <dt className="text-[10px] font-black uppercase text-rose-500">
                  Voided At
                </dt>
                <dd className="mt-1 font-bold text-rose-600">
                  {formatDateTime(expense.voided_at)}
                </dd>
              </div>
            )}
          </dl>

          {/* Notes / Description */}
          {expense.description && (
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-slate-700">
              <span className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Description / Notes
              </span>
              <p className="font-medium text-slate-700 leading-relaxed">
                {expense.description}
              </p>
            </div>
          )}

          {/* Receipt Image if available */}
          {expense.receipt_image && (
            <div>
              <span className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">
                Receipt Attachment
              </span>
              <a
                href={receiptUrl(expense.receipt_image)}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl border border-slate-200 hover:opacity-90 transition bg-slate-50 p-1"
              >
                <img
                  src={receiptUrl(expense.receipt_image)}
                  className="max-h-48 w-full object-contain rounded-lg"
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
      </div>
    </Modal>
  );
}

export default ExpenseDetailsModal;
