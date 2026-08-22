import Modal from "../Modal";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

function SaleSuccessModal({ sale, onNewSale, onPrint, onViewSale, isLoadingReceipt }) {
  if (!sale) return null;

  const items = Array.isArray(sale.items) ? sale.items : [];
  const calculatedQty = items.reduce(
    (acc, i) => acc + (parseFloat(i.quantity ?? i.cartQuantity ?? 1) || 1),
    0
  );
  const totalQty = sale.total_quantity ? Number(sale.total_quantity) : calculatedQty || 1;
  const totalItemCount = items.length || Number(sale.total_items) || 1;

  return (
    <Modal
      isOpen={Boolean(sale)}
      title="Payment Successful"
      description="The sale and stock movements were recorded in the database."
      onClose={onNewSale}
    >
      <div className="p-6">
        {/* Success Icon */}
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-500/20">
          <Icon name="check" className="size-7" strokeWidth={2.5} />
        </div>

        {/* Invoice & Total */}
        <div className="mt-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {sale.invoice_number || `INV-${sale.id}`}
          </p>
          <p className="mt-1 text-3xl font-black tracking-tight text-[#0B1E38]">
            {formatCurrency(sale.grand_total)}
          </p>
          {sale.customer_name && sale.customer_name !== "Walk-in Customer" && (
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Customer: <span className="text-slate-800 font-bold">{sale.customer_name}</span>
            </p>
          )}
        </div>

        {/* Payment Summary Grid */}
        <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs">
          <div>
            <dt className="text-slate-400 font-bold uppercase text-[10px]">Received</dt>
            <dd className="mt-1 font-bold text-slate-800">
              {formatCurrency(sale.amount_received ?? sale.grand_total)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 font-bold uppercase text-[10px]">Change</dt>
            <dd className="mt-1 font-bold text-emerald-600">
              {formatCurrency(sale.change_returned || 0)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 font-bold uppercase text-[10px]">Payment</dt>
            <dd className="mt-1 font-bold capitalize text-slate-800">
              {(sale.payment_method || "cash").replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 font-bold uppercase text-[10px]">Total Quantity</dt>
            <dd className="mt-1 font-bold text-slate-800">
              {totalQty} {totalQty > 1 ? "Pcs" : "Pc"} ({totalItemCount} {totalItemCount > 1 ? "Products" : "Product"})
            </dd>
          </div>
        </dl>

        {/* Sold Items Detail Breakdown List */}
        {items.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <span>Item &amp; Qty</span>
              <span>Total</span>
            </div>

            <div className="mt-2 divide-y divide-slate-100 max-h-44 overflow-y-auto pr-1 text-xs">
              {items.map((item, idx) => {
                const qty = parseFloat(item.quantity ?? item.cartQuantity ?? 1) || 1;
                const unitPrice = parseFloat(item.unit_price ?? item.selling_price ?? item.price ?? 0) || 0;
                const lineTotal = parseFloat(item.line_total) || Math.round(qty * unitPrice * 100) / 100;

                return (
                  <div key={item.id || idx} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold text-[#0B1E38]">
                        {item.name || item.product_name || "Product"}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400">
                        {qty} × {formatCurrency(unitPrice)}
                      </p>
                    </div>
                    <strong className="text-xs font-black text-slate-800 shrink-0">
                      {formatCurrency(lineTotal)}
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={isLoadingReceipt}
            onClick={onPrint}
            className="min-h-11 rounded-xl bg-[#FF9F43] px-4 text-xs font-black text-white shadow-sm shadow-orange-500/20 hover:bg-[#F38C2A] transition disabled:opacity-60 cursor-pointer"
          >
            {isLoadingReceipt ? "Loading..." : "🖨️ Print Receipt"}
          </button>
          <button
            type="button"
            onClick={onViewSale}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            View Sales
          </button>
          <button
            type="button"
            onClick={onNewSale}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            New Sale
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default SaleSuccessModal;
