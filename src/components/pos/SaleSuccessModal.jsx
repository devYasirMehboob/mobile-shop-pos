import Modal from "../Modal";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

function SaleSuccessModal({ sale, onNewSale, onPrint, onViewSale, isLoadingReceipt }) {
  return (
    <Modal
      isOpen={Boolean(sale)}
      title="Payment Successful"
      description="The sale and stock movements were recorded in the database."
      onClose={onNewSale}
    >
      {sale && (
        <div className="p-6">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Icon name="check" className="size-7" strokeWidth={2.5} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              {sale.invoice_number || `INV-${sale.id}`}
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#0B1E38]">
              {formatCurrency(sale.grand_total)}
            </p>
          </div>
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
              <dt className="text-slate-400 font-bold uppercase text-[10px]">Items</dt>
              <dd className="mt-1 font-bold text-slate-800">
                {sale.items?.length || sale.total_items || 1}
              </dd>
            </div>
          </dl>
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
      )}
    </Modal>
  );
}

export default SaleSuccessModal;
