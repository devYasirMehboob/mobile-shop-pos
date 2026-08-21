import Modal from "../Modal";
import Icon from "../Icon";
import { formatCurrency, formatDate } from "../../utils/calculateSaleTotals";

function SupplierDetailsModal({ details, onClose }) {
  const supplier = details?.supplier || details;
  const purchases = details?.purchases || [];
  const payments = details?.payments || [];

  return (
    <Modal
      isOpen={Boolean(details)}
      title={supplier?.name || "Supplier Profile"}
      description="Vendor contact info, ledger balances, purchases and payment records."
      onClose={onClose}
      size="lg"
    >
      {supplier && (
        <div className="max-h-[72vh] overflow-y-auto p-6 space-y-6">
          {/* Top Profile Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-orange-50 text-[#FF9F43] font-black text-base border border-orange-200/50 shadow-2xs">
                {supplier.name?.charAt(0) || "S"}
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B1E38]">
                  {supplier.name}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Code: <span className="font-mono text-slate-600 font-bold">{supplier.supplier_code || `SU${supplier.id}`}</span>
                  {supplier.city && ` · ${supplier.city}, ${supplier.country || ""}`}
                </p>
              </div>
            </div>

            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase ${
              supplier.status === "active"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                : "bg-slate-100 text-slate-600 border border-slate-200/60"
            }`}>
              <span className={`size-1.5 rounded-full ${
                supplier.status === "active" ? "bg-emerald-500" : "bg-slate-400"
              }`} />
              {supplier.status || "active"}
            </span>
          </div>

          {/* 4 Quick Ledger Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Current Payable
              </span>
              <strong className="mt-1 block text-sm font-black text-[#FF9F43]">
                {formatCurrency(supplier.current_balance || 0)}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Opening Balance
              </span>
              <strong className="mt-1 block text-sm font-black text-slate-700">
                {formatCurrency(supplier.opening_balance || 0)}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Phone
              </span>
              <strong className="mt-1 block text-xs font-bold text-slate-700 truncate">
                {supplier.phone || "Not set"}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Email
              </span>
              <strong className="mt-1 block text-xs font-bold text-slate-700 truncate">
                {supplier.email || "Not set"}
              </strong>
            </div>
          </div>

          {/* Recent Invoices / Purchases */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
              Recent Purchases &amp; Invoices ({purchases.length})
            </h4>
            {purchases.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5 text-right">Total</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {purchases.slice(0, 5).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-bold text-slate-700">{p.purchase_number || `PO-${p.id}`}</td>
                        <td className="p-2.5 text-slate-500">{formatDate(p.created_at || p.purchase_date)}</td>
                        <td className="p-2.5 text-right font-black text-[#0B1E38]">{formatCurrency(p.grand_total || p.total_amount || 0)}</td>
                        <td className="p-2.5">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 capitalize">
                            {p.status || "Received"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400 italic p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No purchase invoices found for this supplier yet.
              </p>
            )}
          </div>

          {/* Payment History */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
              Payment Outflow History ({payments.length})
            </h4>
            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs"
                  >
                    <div>
                      <strong className="block font-bold text-slate-700">
                        {p.payment_reference || `PAY-${p.id}`}
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(p.payment_date || p.created_at)} · {p.payment_method || "Cash"}
                      </span>
                    </div>
                    <strong className="text-xs font-black text-emerald-600">
                      {formatCurrency(p.amount || 0)}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400 italic p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No outgoing payments recorded for this supplier yet.
              </p>
            )}
          </div>
        </div>
      )}

      <footer className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
        >
          Close
        </button>
      </footer>
    </Modal>
  );
}

export default SupplierDetailsModal;
