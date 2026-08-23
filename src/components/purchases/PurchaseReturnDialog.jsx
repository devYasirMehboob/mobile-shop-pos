import { useEffect, useState } from "react";
import Modal from "../Modal";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

const REASON_PRESETS = [
  "Damaged Goods",
  "Quality / Defect Issue",
  "Incorrect Item Sent",
  "Expired / Short Expiry",
  "Excess Order Return",
];

function PurchaseReturnDialog({ data, busy, onClose, onSubmit }) {
  const [quantities, setQuantities] = useState({});
  const [refund, setRefund] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (data) {
      setQuantities({});
      setRefund("");
      setReason("");
    }
  }, [data]);

  const items = data?.items || [];
  const purchase = data?.purchase || {};

  // Selected return items
  const selected = items
    .map((item) => {
      const returnQty = Number(quantities[item.id] || 0);
      const unitCost = Number(
        item.unit_cost || item.line_total / (item.quantity || 1) || 0,
      );
      const lineSubtotal = returnQty * unitCost;
      const availableToReturn = Math.max(
        0,
        Number(item.quantity || 0) - Number(item.returned_quantity || 0),
      );
      return {
        ...item,
        returnQty,
        unitCost,
        lineSubtotal,
        availableToReturn,
      };
    })
    .filter((i) => i.returnQty > 0);

  const estimatedReturnValue = selected.reduce((s, i) => s + i.lineSubtotal, 0);
  const totalReturnUnits = selected.reduce((s, i) => s + i.returnQty, 0);

  function handleReturnAll(item) {
    const avail = Math.max(
      0,
      Number(item.quantity || 0) - Number(item.returned_quantity || 0),
    );
    setQuantities((q) => ({ ...q, [item.id]: String(avail) }));
  }

  function handleClear(item) {
    setQuantities((q) => {
      const next = { ...q };
      delete next[item.id];
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (selected.length === 0) return;

    onSubmit({
      purchase_id: purchase.id,
      supplier_id: purchase.supplier_id,
      return_date: new Date().toISOString().slice(0, 10),
      subtotal: estimatedReturnValue,
      refund_amount: Number(refund) || 0,
      reason: reason.trim() || "Stock return to supplier",
      items: selected.map((i) => ({
        purchase_item_id: i.id,
        product_id: i.product_id,
        quantity: i.returnQty,
        unit_cost: i.unitCost,
      })),
    });
  }

  return (
    <Modal
      isOpen={Boolean(data)}
      title="Create Purchase Return"
      description={`PO: ${purchase.purchase_number || `PUR-${purchase.id}`} · Supplier: ${purchase.supplier_name || "Vendor"}`}
      onClose={onClose}
      size="lg"
    >
      <form
        onSubmit={handleSubmit}
        className="m-5 flex max-h-[calc(88vh-70px)] flex-col"
      >
        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {/* 1. Item Selection Table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Select Line Items To Return
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {items.length}{" "}
                {items.length === 1 ? "Product Line" : "Product Lines"}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white">
              <table className="w-full min-w-[580px] text-left text-xs">
                <thead className="bg-slate-50/90 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left">Product</th>
                    <th className="px-2.5 py-2.5 text-center">Purchased</th>
                    <th className="px-2.5 py-2.5 text-center">Returned</th>
                    <th className="px-2.5 py-2.5 text-center">Available</th>
                    <th className="px-3.5 py-2.5 text-right">Return Qty</th>
                    <th className="px-3.5 py-2.5 text-right">
                      Return Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {items.map((i) => {
                    const avail = Math.max(
                      0,
                      Number(i.quantity || 0) -
                        Number(i.returned_quantity || 0),
                    );
                    const currentQty = quantities[i.id] || "";
                    const unitCost = Number(i.unit_cost || 0);
                    const rowSubtotal = (Number(currentQty) || 0) * unitCost;

                    return (
                      <tr
                        key={i.id}
                        className={`transition ${
                          Number(currentQty) > 0
                            ? "bg-amber-50/50"
                            : "hover:bg-slate-50/50"
                        }`}
                      >
                        <td className="px-3.5 py-2.5">
                          <div className="font-extrabold text-slate-900 text-xs truncate max-w-[200px]">
                            {i.product_name || `Product #${i.product_id}`}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">
                            {formatCurrency(unitCost)} each
                          </div>
                        </td>
                        <td className="px-2.5 py-2.5 text-center font-mono font-bold text-slate-700">
                          {Number(i.quantity)}
                        </td>
                        <td className="px-2.5 py-2.5 text-center font-mono text-slate-500">
                          {Number(i.returned_quantity || 0)}
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                              avail > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {avail}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          {avail === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">
                              Fully Returned
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max={avail}
                                step="0.001"
                                placeholder="0"
                                value={currentQty}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (Number(val) > avail) return;
                                  setQuantities((q) => ({ ...q, [i.id]: val }));
                                }}
                                className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-right font-mono text-xs font-bold text-slate-900 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none"
                              />
                              {Number(currentQty) === avail ? (
                                <button
                                  type="button"
                                  onClick={() => handleClear(i)}
                                  className="rounded-md p-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                  title="Clear"
                                >
                                  ✕
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReturnAll(i)}
                                  className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                                  title="Return All Available"
                                >
                                  All
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900">
                          {formatCurrency(rowSubtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Financial Summary & Refund Input Grid */}
          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* Supplier Refund Received Input */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="refund-amount"
                  className="text-[11px] font-black uppercase tracking-wider text-slate-700"
                >
                  Supplier Refund Amount
                </label>
                {estimatedReturnValue > 0 && (
                  <button
                    type="button"
                    onClick={() => setRefund(String(estimatedReturnValue))}
                    className="text-[10px] font-bold text-[#FF9F43] hover:underline cursor-pointer"
                  >
                    Set Full ({formatCurrency(estimatedReturnValue)})
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                  PKR
                </span>
                <input
                  id="refund-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={refund}
                  onChange={(e) => setRefund(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 font-mono text-xs font-bold text-slate-900 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Cash or ledger adjustment received from supplier.
              </p>
            </div>

            {/* Estimated Return Value Navy Box */}
            <div className="rounded-xl border border-slate-200/90 bg-[#0B1E38] p-3.5 text-white shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                <span className="text-[11px] font-black tracking-wide text-white">
                  Estimated Return Value
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-orange-300">
                  {totalReturnUnits} Units
                </span>
              </div>
              <div className="pt-1.5">
                <div className="text-xl font-black text-[#FF9F43] font-mono">
                  {formatCurrency(estimatedReturnValue)}
                </div>
                <div className="text-[10px] text-slate-300 font-medium mt-0.5">
                  {selected.length} product{" "}
                  {selected.length === 1 ? "line" : "lines"} selected
                </div>
              </div>
            </div>
          </div>

          {/* 3. Reason Note & Presets */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <label
                htmlFor="return-reason"
                className="text-[11px] font-black uppercase tracking-wider text-slate-700"
              >
                Return Reason / Notes <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Required for Audit
              </span>
            </div>

            {/* Quick Preset Chips */}
            <div className="flex flex-wrap gap-1.5">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
                    reason === preset
                      ? "bg-[#FF9F43] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              id="return-reason"
              required
              rows={2}
              placeholder="Explain why items are being returned to the vendor..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 shadow-2xs focus:border-[#FF9F43] focus:ring-2 focus:ring-[#FF9F43]/20 focus:outline-none"
            />
          </div>
        </div>

        {/* 4. Pinned Sticky Footer Actions */}
        <footer className="sticky bottom-0 z-10 flex items-center justify-between border-t border-slate-200/90 bg-white/95 backdrop-blur-xs px-5 py-3 shadow-xs">
          <div className="text-xs font-bold text-slate-500 font-mono">
            {selected.length > 0 ? (
              <span>
                Total Return:{" "}
                <strong className="text-slate-900">
                  {formatCurrency(estimatedReturnValue)}
                </strong>
              </span>
            ) : (
              <span className="text-slate-400 font-sans text-[11px]">
                Select items to calculate return
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || selected.length === 0 || !reason.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1E38] px-5 py-2 text-xs font-black text-white shadow-md hover:bg-slate-800 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="refresh" className="size-3.5 text-orange-400" />
              <span>
                {busy
                  ? "Processing..."
                  : `Complete Return (${selected.length})`}
              </span>
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}

export default PurchaseReturnDialog;
