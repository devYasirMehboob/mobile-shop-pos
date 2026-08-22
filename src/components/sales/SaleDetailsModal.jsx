import Modal from "../Modal";
import LoadingState from "../LoadingState";
import SaleStatusBadge from "./SaleStatusBadge";
import { formatCurrency, formatDateTime } from "../../utils/calculateSaleTotals";

function SaleDetailsModal({ isOpen, sale, isLoading, onClose, onReceipt, onAction }) {
  const permissions = sale?.permissions || {
    can_cancel: sale?.status === "completed",
    can_refund: sale?.status === "completed",
    can_view_costs: true,
  };
  const refunds = sale?.refunds || (sale?.refund ? [sale.refund] : []);
  const items = sale?.items || [];
  const payments = sale?.payments || [];

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
      ) : sale && (
        <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Header Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SaleStatusBadge status={sale.status || "completed"} />
              <SaleStatusBadge status={sale.payment_status || "paid"} />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onReceipt(sale)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                <span>🖨️ Print Receipt</span>
              </button>

              {permissions.can_refund && sale.status === "completed" && (
                <button
                  type="button"
                  onClick={() => onAction("refund", sale)}
                  className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                >
                  <span>↩️ Return / Refund</span>
                </button>
              )}

              {permissions.can_cancel && sale.status === "completed" && (
                <button
                  type="button"
                  onClick={() => onAction("cancel", sale)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-center">Quantity</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <strong className="block text-slate-800">{item.product_name}</strong>
                      <small className="font-mono text-slate-400 font-bold">{item.product_code}</small>
                    </td>
                    <td className="px-4 py-3 text-center font-black text-slate-800">
                      {Number(item.quantity || 1)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-600">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {formatCurrency(item.discount_amount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[#0B1E38]">
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Payments Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                Payment Records
              </h3>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No separate payment record.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl bg-white border border-slate-200/60 p-2.5 text-xs"
                    >
                      <span className="font-bold text-slate-700 capitalize">
                        {(p.payment_method || "cash").replaceAll("_", " ")} · {p.status}
                      </span>
                      <strong className="font-black text-emerald-600">
                        {formatCurrency(p.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                Sale Summary
              </h3>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(sale.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <dt>Discount</dt>
                  <dd>-{formatCurrency(sale.discount_amount)}</dd>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <dt>Tax</dt>
                  <dd>{formatCurrency(sale.tax_amount)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-[#0B1E38]">
                  <dt>Grand Total</dt>
                  <dd className="text-[#FF9F43]">{formatCurrency(sale.grand_total)}</dd>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <dt>Received Amount</dt>
                  <dd>{formatCurrency(sale.amount_received)}</dd>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <dt>Change Returned</dt>
                  <dd>{formatCurrency(sale.change_returned)}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Refund / Cancellation Audit Notice */}
          {(sale.cancellation_reason || refunds.length > 0) && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
              <h3 className="font-extrabold uppercase tracking-wider text-amber-800">Status Audit History</h3>
              {sale.cancellation_reason && (
                <p className="mt-1">
                  Cancelled: <strong>{sale.cancellation_reason}</strong> · {sale.cancelled_at}
                </p>
              )}
              {refunds.map((r) => (
                <p key={r.id || 1} className="mt-1">
                  Refunded <strong>{formatCurrency(r.refund_amount || sale.grand_total)}</strong> via{" "}
                  <strong className="capitalize">{r.refund_method || "cash"}</strong>: {r.reason || "Customer refund"} ·{" "}
                  {formatDateTime(r.created_at || sale.refunded_at)}
                </p>
              ))}
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

export default SaleDetailsModal;
