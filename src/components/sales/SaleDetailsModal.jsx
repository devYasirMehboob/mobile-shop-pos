import { useState } from "react";
import Modal from "../Modal";
import LoadingState from "../LoadingState";
import SaleStatusBadge from "./SaleStatusBadge";
import { formatCurrency, formatDateTime } from "../../utils/calculateSaleTotals";
import { getSaleReceipt } from "../../api/salesApi";
import { exportReceiptToPdf } from "../../utils/pdfExport";
import useAlert from "../../hooks/useAlert";

function SaleDetailsModal({ isOpen, sale, isLoading, onClose, onReceipt, onAction }) {
  const alert = useAlert();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const permissions = sale?.permissions || {
    can_cancel: sale?.status === "completed",
    can_refund: sale?.status === "completed",
    can_view_costs: true,
  };
  const refunds = sale?.refunds || (sale?.refund ? [sale.refund] : []);
  const items = sale?.items || [];
  const payments = sale?.payments || [];

  const handleDownloadPdf = async () => {
    if (!sale) return;
    try {
      setIsDownloadingPdf(true);
      const receiptData = await getSaleReceipt(sale.id);
      await exportReceiptToPdf(receiptData, sale.invoice_number);
      alert.success("Invoice PDF downloaded successfully.");
    } catch (e) {
      alert.error("Failed to download PDF: " + (e.message || "Unknown error"));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={sale ? `Sale Invoice — ${sale.invoice_number}` : "Sale Details"}
      description="Detailed record of billed items, applied discounts, customer, and payments."
      onClose={onClose}
      size="lg"
    >
      {isLoading ? (
        <div className="py-12">
          <LoadingState label="Loading sale details..." />
        </div>
      ) : (
        sale && (
          <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Header Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SaleStatusBadge status={sale.status || "completed"} />
                <SaleStatusBadge status={sale.payment_status || "paid"} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100/90 px-3.5 py-1.5 text-xs font-black text-slate-800 shadow-2xs hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  <span>{isDownloadingPdf ? "Downloading..." : "📥 Download PDF"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onReceipt(sale)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-black text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>🖨️ Print Receipt</span>
                </button>

                {permissions.can_refund && sale.status === "completed" && (
                  <button
                    type="button"
                    onClick={() => onAction("refund", sale)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  >
                    <span>↩️ Return / Refund</span>
                  </button>
                )}

                {permissions.can_cancel && sale.status === "completed" && (
                  <button
                    type="button"
                    onClick={() => onAction("cancel", sale)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <span>Cancel Sale</span>
                  </button>
                )}
              </div>
            </div>

            {/* Key Sale Details Summary */}
            <dl className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs sm:grid-cols-3">
              <div>
                <dt className="font-bold uppercase text-[10px] text-slate-400">Date &amp; Time</dt>
                <dd className="mt-1 font-semibold text-slate-800">{formatDateTime(sale.created_at)}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[10px] text-slate-400">Cashier</dt>
                <dd className="mt-1 font-semibold text-slate-800">{sale.cashier_name || "Admin"}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[10px] text-slate-400">Customer</dt>
                <dd className="mt-1 font-semibold text-slate-800">{sale.customer_name || "Walk-in Customer"}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[10px] text-slate-400">Customer Phone</dt>
                <dd className="mt-1 font-semibold text-slate-800">{sale.customer_phone || "—"}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[10px] text-slate-400">Payment Method</dt>
                <dd className="mt-1 font-semibold text-slate-800 capitalize">
                  {(sale.payment_method || "cash").replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[10px] text-slate-400">Notes</dt>
                <dd className="mt-1 font-semibold text-slate-800">{sale.notes || "—"}</dd>
              </div>
            </dl>

            {/* Billed Items Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5 text-center">Quantity</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    {permissions.can_view_costs && (
                      <th className="px-4 py-2.5 text-right">Cost Price</th>
                    )}
                    <th className="px-4 py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900">{item.product_name}</span>
                        {item.product_code && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {item.product_code}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(item.unit_price)}
                      </td>
                      {permissions.can_view_costs && (
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {formatCurrency(item.purchase_cost)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Breakdown */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4">
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-600">Payments Recorded:</p>
                {payments.length === 0 ? (
                  <p className="text-slate-400 italic">No payments recorded.</p>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-slate-700">
                      <span className="capitalize font-semibold">
                        {(p.payment_method || "cash").replaceAll("_", " ")}:
                      </span>
                      <span className="font-mono font-bold">{formatCurrency(p.amount)}</span>
                      {p.reference && (
                        <span className="text-[10px] text-slate-400">({p.reference})</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <dl className="w-full sm:w-64 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal:</dt>
                  <dd className="font-mono font-bold">{formatCurrency(sale.subtotal)}</dd>
                </div>
                {Number(sale.discount_amount) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <dt>Discount ({sale.discount_type}):</dt>
                    <dd className="font-mono font-bold">-{formatCurrency(sale.discount_amount)}</dd>
                  </div>
                )}
                {Number(sale.tax_amount) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <dt>Tax:</dt>
                    <dd className="font-mono font-bold">{formatCurrency(sale.tax_amount)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-[#0B1E38]">
                  <dt>Grand Total:</dt>
                  <dd className="font-mono">{formatCurrency(sale.grand_total)}</dd>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <dt>Amount Received:</dt>
                  <dd className="font-mono font-semibold">
                    {formatCurrency(sale.amount_received ?? sale.grand_total)}
                  </dd>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <dt>Change Returned:</dt>
                  <dd className="font-mono font-bold">
                    {formatCurrency(sale.change_returned || 0)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Refunds / Cancellations History */}
            {(sale.cancellation_reason || refunds.length > 0) && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-900 space-y-2">
                <p className="font-black flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Refund &amp; Cancellation History</span>
                </p>
                {sale.cancellation_reason && (
                  <p>
                    <strong>Reason:</strong> {sale.cancellation_reason}
                  </p>
                )}
                {refunds.map((r) => (
                  <div key={r.id} className="text-[11px] text-rose-700">
                    Refunded {formatCurrency(r.refund_amount)} via {r.refund_method} on{" "}
                    {formatDateTime(r.created_at)}. Reason: {r.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </Modal>
  );
}

export default SaleDetailsModal;
