import Modal from "../Modal";
import Icon from "../Icon";
import { formatCurrency, formatDate } from "../../utils/calculateSaleTotals";

function SupplierDetailsModal({ details, onClose }) {
  const supplier = details?.supplier || details;
  const purchases = details?.purchases || [];
  const payments = details?.payments || [];

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const totalPurchaseValue = purchases.reduce(
    (acc, p) => acc + Number(p.grand_total || p.total_amount || p.subtotal || 0),
    0
  );

  return (
    <Modal
      isOpen={Boolean(details)}
      title={`Supplier Ledger — ${supplier?.name || "Profile"}`}
      description="Vendor contact info, ledger balances, purchases and payment records."
      onClose={onClose}
      size="lg"
    >
      {supplier && (
        <div className="max-h-[74vh] overflow-y-auto p-6 space-y-6">
          {/* 1. TOP PROFILE BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-orange-50/40 via-white to-slate-50/60 p-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="grid size-12 place-items-center rounded-2xl bg-orange-500 text-white font-black text-lg shadow-sm shadow-orange-500/20">
                {supplier.name?.charAt(0) || "S"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#0B1E38]">
                    {supplier.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      supplier.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "bg-slate-100 text-slate-600 border border-slate-200/60"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        supplier.status === "active"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    />
                    {supplier.status || "active"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-2">
                  <span>
                    Vendor Code:{" "}
                    <strong className="font-mono text-slate-700">
                      {supplier.supplier_code || `SU${supplier.id}`}
                    </strong>
                  </span>
                  {supplier.created_at && (
                    <>
                      <span>•</span>
                      <span>Registered: {formatDate(supplier.created_at)}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 2. FOUR FINANCIAL & LEDGER METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-orange-200/80 bg-orange-50/40 p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Current Payable
              </span>
              <strong className="mt-1 block text-base font-black text-[#FF9F43]">
                {formatCurrency(supplier.current_balance ?? supplier.opening_balance ?? 0)}
              </strong>
              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                Outstanding Balance
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Opening Balance
              </span>
              <strong className="mt-1 block text-base font-black text-slate-700">
                {formatCurrency(supplier.opening_balance || 0)}
              </strong>
              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                Initial Account Balance
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Invoiced
              </span>
              <strong className="mt-1 block text-base font-black text-[#0B1E38]">
                {formatCurrency(totalPurchaseValue)}
              </strong>
              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                {purchases.length} Purchase Invoices
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Paid
              </span>
              <strong className="mt-1 block text-base font-black text-emerald-600">
                {formatCurrency(totalPaid)}
              </strong>
              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                {payments.length} Payments Dispatched
              </span>
            </div>
          </div>

          {/* 3. VENDOR CONTACT & ADDRESS DETAILS GRID */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0B1E38] mb-3 flex items-center gap-1.5">
              <Icon name="users" className="size-3.5 text-[#FF9F43]" />
              <span>Contact &amp; Location Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              {/* Contact Person */}
              <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Contact Person / Rep
                </span>
                <strong className="text-slate-800 font-bold mt-0.5 block">
                  {supplier.contact_person || "Direct Owner"}
                </strong>
              </div>

              {/* Primary Phone */}
              <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Primary Phone
                </span>
                <strong className="text-slate-800 font-bold mt-0.5 block">
                  {supplier.phone || "—"}
                </strong>
              </div>

              {/* WhatsApp / Alt Phone */}
              <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  WhatsApp / Alt Contact
                </span>
                <strong className="text-slate-800 font-bold mt-0.5 block">
                  {supplier.alternate_phone || "—"}
                </strong>
              </div>

              {/* Email Address */}
              <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Email Address
                </span>
                <strong className="text-slate-800 font-bold mt-0.5 block truncate">
                  {supplier.email || "—"}
                </strong>
              </div>

              {/* Shop / Warehouse Address */}
              <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Shop / Warehouse Address
                </span>
                <strong className="text-slate-800 font-bold mt-0.5 block">
                  {supplier.address || "—"}
                </strong>
              </div>

              {/* Notes & Payment Terms */}
              {supplier.notes && (
                <div className="rounded-xl bg-orange-50/40 border border-orange-100/80 p-3 sm:col-span-3">
                  <span className="text-[10px] font-bold uppercase text-orange-600/80 block">
                    Notes &amp; Payment Terms
                  </span>
                  <p className="text-slate-700 font-semibold mt-0.5">
                    {supplier.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. RECENT PURCHASES & INVOICES */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Recent Purchases &amp; Invoices ({purchases.length})
              </h4>
            </div>

            {purchases.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Purchase Date</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium bg-white">
                    {purchases.slice(0, 5).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3 font-mono font-bold text-slate-700">
                          {p.purchase_number || p.invoice_number || `PO-${p.id}`}
                        </td>
                        <td className="p-3 text-slate-500">
                          {formatDate(p.purchase_date || p.created_at)}
                        </td>
                        <td className="p-3 text-right font-black text-[#0B1E38]">
                          {formatCurrency(p.grand_total || p.total_amount || p.subtotal || 0)}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 capitalize">
                            {p.status || "Received"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                <p className="text-xs font-medium text-slate-400">
                  No purchase invoices found for this supplier yet.
                </p>
              </div>
            )}
          </div>

          {/* 5. PAYMENT OUTFLOW HISTORY */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Payment Outflow History ({payments.length})
              </h4>
            </div>

            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-xs shadow-2xs hover:bg-slate-50 transition"
                  >
                    <div>
                      <strong className="block font-bold text-slate-800">
                        {p.payment_reference || `PAY-${p.id}`}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {formatDate(p.payment_date || p.created_at)} · Mode:{" "}
                        <span className="capitalize text-slate-600 font-bold">
                          {p.payment_method || "Cash"}
                        </span>
                      </span>
                    </div>
                    <strong className="text-xs font-black text-emerald-600">
                      {formatCurrency(p.amount || 0)}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                <p className="text-xs font-medium text-slate-400">
                  No outgoing payments recorded for this supplier yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
        >
          <span>📄 Print Statement</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-[#FF9F43] px-5 py-2 text-xs font-black text-white shadow-sm hover:bg-[#F38C2A] transition cursor-pointer"
        >
          Close
        </button>
      </footer>
    </Modal>
  );
}

export default SupplierDetailsModal;
