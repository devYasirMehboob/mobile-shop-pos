import ReadableStock from "../products/ReadableStock";

const actionOptions = [
  ["add", "Restock / Inward Addition (+)"],
  ["reduce", "Manual Deduction / Outward (-)"],
  ["adjust", "Set Exact Total Count (=)"],
  ["damaged", "Damaged / Broken Stock (-)"],
  ["expired", "Expired Stock (-)"],
  ["wastage", "Wastage / Defect (-)"],
];

const reasonRequired = ["reduce", "adjust", "damaged", "expired", "wastage"];

function StockActionForm({
  product,
  action,
  values,
  errors,
  isSubmitting,
  onActionChange,
  onChange,
  onSubmit,
  onCancel,
}) {
  const isAdjustment = action === "adjust";
  const currQty = Number(product?.quantity || 0);
  const inputQty = parseFloat(values.quantity) || 0;
  const isAdd = action === "add";
  const resultingQty = isAdjustment
    ? inputQty
    : isAdd
    ? currQty + inputQty
    : Math.max(0, currQty - inputQty);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 p-5">
      {/* Product Information Card */}
      <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">Product:</span>
          <span className="text-[#0B1E38] font-black">{product.name}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-bold border-t border-orange-200/40 pt-2">
          <span className="text-slate-500">Current Stock:</span>
          <span className="text-[#0B1E38] font-black text-sm">
            <ReadableStock quantity={product.quantity} unitType={product.unit_type} />
          </span>
        </div>
        <div className="flex items-center justify-between text-xs font-bold border-t border-orange-200/40 pt-2">
          <span className="text-slate-500">Resulting Stock:</span>
          <span
            className={`font-black text-sm ${
              resultingQty <= 0
                ? "text-rose-600"
                : resultingQty <= Number(product.minimum_stock || 5)
                ? "text-amber-600"
                : "text-emerald-600"
            }`}
          >
            {resultingQty} Units
          </span>
        </div>
      </div>

      {/* Movement Type Selector */}
      <div>
        <label
          className="mb-1.5 block text-xs font-bold text-slate-700"
          htmlFor="stock-action"
        >
          Movement Type
        </label>
        <select
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
          id="stock-action"
          value={action}
          onChange={onActionChange}
          disabled={isSubmitting}
        >
          {actionOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity Input */}
      <div>
        <label
          className="mb-1.5 block text-xs font-bold text-slate-700"
          htmlFor="stock-quantity"
        >
          {isAdjustment ? "Set Exact Count" : "Quantity"}{" "}
          <span className="text-rose-500">*</span>
        </label>
        <input
          className={
            "w-full rounded-xl border bg-slate-50/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition focus:bg-white focus:ring-4 " +
            (errors.quantity
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-slate-200 focus:border-[#FF9F43] focus:ring-orange-100")
          }
          id="stock-quantity"
          name="quantity"
          type="number"
          min={isAdjustment ? "0" : "0.001"}
          step="0.001"
          value={values.quantity}
          onChange={onChange}
          disabled={isSubmitting}
          autoFocus
          placeholder="Enter quantity"
        />
        {errors.quantity && (
          <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.quantity}</p>
        )}
      </div>

      {/* Reason / Notes */}
      <div>
        <label
          className="mb-1.5 block text-xs font-bold text-slate-700"
          htmlFor="stock-reason"
        >
          Reason / Audit Note{" "}
          {reasonRequired.includes(action) && (
            <span className="text-rose-500">*</span>
          )}
        </label>
        <textarea
          className={
            "w-full rounded-xl border bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:bg-white focus:ring-4 " +
            (errors.reason
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-slate-200 focus:border-[#FF9F43] focus:ring-orange-100")
          }
          id="stock-reason"
          name="reason"
          rows={2}
          maxLength={500}
          value={values.reason}
          onChange={onChange}
          disabled={isSubmitting}
          placeholder="Add a clear note for this stock movement"
        />
        {errors.reason && (
          <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.reason}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="rounded-xl bg-[#FF9F43] px-5 py-2 text-xs font-black text-white shadow-sm hover:bg-[#F38C2A] transition disabled:opacity-60 cursor-pointer"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Stock Movement"}
        </button>
      </div>
    </form>
  );
}

export default StockActionForm;
