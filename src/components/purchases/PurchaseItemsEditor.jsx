import React from "react";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";
import PurchaseProductCombobox from "./PurchaseProductCombobox";

function PurchaseItemsEditor({
  products,
  units,
  items,
  supplierId,
  onChange,
  onAddProduct,
  onRemove,
  onQuickAdd,
  onConfigureUnit,
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-black text-[#0B1E38] uppercase tracking-wide">
              Product Procurement &amp; Stock Items
            </span>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-800">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
          </div>
          <PurchaseProductCombobox
            supplierId={supplierId}
            onSelectProduct={onAddProduct}
            onQuickAdd={onQuickAdd}
          />
        </div>

        {onQuickAdd && (
          <button
            type="button"
            onClick={() => onQuickAdd("")}
            className="self-start md:self-end inline-flex items-center gap-2 rounded-xl bg-[#0B1E38] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-slate-800 transition cursor-pointer"
          >
            <Icon name="plus" className="size-4 text-orange-400" />
            <span>+ Quick Add Product</span>
          </button>
        )}
      </div>

      {/* Items Table */}
      {items.length === 0 ? (
        <div className="my-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-orange-50 text-[#FF9F43]">
            <Icon name="shopping-bag" className="size-6" />
          </div>
          <p className="text-xs font-bold text-slate-700">No items added to this purchase order yet.</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Search products above or click "+ Quick Add Product" to add stock items.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="bg-slate-50/90 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">Product &amp; Unit</th>
                <th className="px-4 py-3 text-right">Pack Qty</th>
                <th className="px-4 py-3 text-right">Cost Per Unit</th>
                <th className="px-4 py-3 text-right">Base Conversion</th>
                <th className="px-4 py-3 text-right">Line Discount</th>
                <th className="px-4 py-3 text-right">Line Total</th>
                <th className="px-3 py-3 text-center w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {items.map((item, idx) => {
                const total = Math.max(
                  0,
                  Number(item.quantity || 0) * Number(item.unit_cost || 0) -
                    Number(item.line_discount || 0)
                );

                const product =
                  products.find((p) => Number(p.id) === Number(item.product_id)) || item.product;

                const purchaseUnits = item.purchase_units || product?.purchase_units || [];

                const selectedFromProductUnits = purchaseUnits.find(
                  (u) => String(u.unit_id) === String(item.unit_id)
                );
                const selectedFromGlobalUnits = units.find(
                  (u) => String(u.id) === String(item.unit_id)
                );
                const selectedUnitObj = selectedFromProductUnits || selectedFromGlobalUnits;

                const conversion = selectedFromProductUnits
                  ? parseFloat(selectedFromProductUnits.conversion_to_base || "1")
                  : 1;

                const baseQty = Number(item.quantity || 0) * conversion;

                const baseUnitRow = purchaseUnits.find((u) => Number(u.is_base_unit) === 1);
                const baseUnitSymbol =
                  baseUnitRow?.unit_symbol || product?.base_unit_symbol || "unit";

                const unitSymbol =
                  selectedFromProductUnits?.unit_symbol ||
                  selectedFromProductUnits?.symbol ||
                  selectedFromGlobalUnits?.symbol ||
                  "unit";
                const unitName =
                  selectedFromProductUnits?.unit_name ||
                  selectedFromProductUnits?.name ||
                  selectedFromGlobalUnits?.name ||
                  unitSymbol;

                const isBaseUnit =
                  conversion === 1 &&
                  (!selectedFromProductUnits || Number(selectedFromProductUnits.is_base_unit) === 1);

                const trackBatches = product && Number(product.track_batches) === 1;
                const trackExpiry = product && Number(product.track_expiry) === 1;
                const requiresBatchRow = trackBatches || trackExpiry;

                return (
                  <React.Fragment key={item.product_id || idx}>
                    <tr className="hover:bg-slate-50/50 transition">
                      {/* Product Name & Packaging Unit Selector */}
                      <td className="px-4 py-3 align-top">
                        <span className="font-extrabold text-slate-900 text-xs">
                          {item.name}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            {item.product_code}
                          </span>

                          <select
                            value={item.unit_id || ""}
                            onChange={(e) =>
                              onChange(item.product_id, "unit_id", e.target.value)
                            }
                            className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-800 outline-none transition focus:border-[#FF9F43]"
                          >
                            <option value="">Select unit...</option>
                            {purchaseUnits.length > 0
                              ? purchaseUnits.map((u) => (
                                  <option key={u.unit_id} value={u.unit_id}>
                                    {u.unit_name} ({u.unit_symbol})
                                  </option>
                                ))
                              : units.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name} ({u.symbol})
                                  </option>
                                ))}
                          </select>

                          {onConfigureUnit && (
                            <button
                              type="button"
                              title="Configure Packaging Unit"
                              onClick={() => onConfigureUnit(product || item, item)}
                              className="text-[10px] font-bold text-orange-600 hover:underline shrink-0"
                            >
                              + Unit
                            </button>
                          )}
                        </div>

                        {/* Last purchase cost alert */}
                        {(() => {
                          const lastCost = item.last_purchase_cost
                            ? parseFloat(item.last_purchase_cost)
                            : null;
                          const currentCost = parseFloat(item.unit_cost || 0);
                          const costDiff =
                            lastCost && currentCost > 0 && Math.abs(currentCost - lastCost) > 0.01
                              ? (((currentCost - lastCost) / lastCost) * 100).toFixed(1)
                              : null;
                          return (
                            lastCost && (
                              <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600 font-mono">
                                  Last: {formatCurrency(lastCost)} / {unitSymbol}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange(item.product_id, "unit_cost", String(lastCost))
                                  }
                                  className="font-bold text-orange-600 hover:underline"
                                >
                                  Use Last
                                </button>
                                {costDiff && (
                                  <span
                                    className={`rounded px-1 py-0.2 font-extrabold ${
                                      Number(costDiff) > 0
                                        ? "bg-rose-50 text-rose-700"
                                        : "bg-emerald-50 text-emerald-700"
                                    }`}
                                  >
                                    {Number(costDiff) > 0 ? "▲ +" : "▼ "}
                                    {costDiff}%
                                  </span>
                                )}
                              </div>
                            )
                          );
                        })()}
                      </td>

                      {/* Quantity Input */}
                      <td className="px-4 py-3 align-top text-right">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          {isBaseUnit ? `Qty (${unitSymbol})` : `Packs (${unitName})`}
                        </label>
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            onChange(item.product_id, "quantity", e.target.value)
                          }
                          className="ml-auto block h-9 w-24 rounded-xl border border-slate-200 bg-white px-2.5 text-right font-mono font-bold text-slate-900 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                        />
                      </td>

                      {/* Cost Per Unit */}
                      <td className="px-4 py-3 align-top text-right">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Cost / {unitSymbol}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_cost}
                          onChange={(e) =>
                            onChange(item.product_id, "unit_cost", e.target.value)
                          }
                          className="ml-auto block h-9 w-28 rounded-xl border border-slate-200 bg-white px-2.5 text-right font-mono font-bold text-slate-900 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
                        />
                      </td>

                      {/* Base Conversion */}
                      <td className="px-4 py-3 align-top text-right shrink-0">
                        {isBaseUnit ? (
                          <div className="text-xs font-bold text-slate-700 font-mono">
                            + {Number(item.quantity || 0).toLocaleString()} {baseUnitSymbol}
                          </div>
                        ) : (
                          <>
                            <div className="text-xs font-black text-emerald-700 font-mono">
                              + {baseQty.toLocaleString()} {baseUnitSymbol}
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 mt-0.5 font-mono">
                              1 {unitSymbol} = {conversion} {baseUnitSymbol}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Line Discount */}
                      <td className="px-4 py-3 align-top text-right">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Discount (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.line_discount}
                          onChange={(e) =>
                            onChange(item.product_id, "line_discount", e.target.value)
                          }
                          className="ml-auto block h-9 w-24 rounded-xl border border-slate-200 bg-white px-2.5 text-right font-mono text-rose-600 font-bold outline-none transition focus:border-[#FF9F43]"
                        />
                      </td>

                      {/* Line Total */}
                      <td className="px-4 py-3 align-top text-right font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(total)}
                      </td>

                      {/* Remove Line */}
                      <td className="px-3 py-3 align-top text-center">
                        <button
                          type="button"
                          onClick={() => onRemove(item.product_id)}
                          className="grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          title="Remove item"
                        >
                          <Icon name="trash" className="size-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Optional Batch and Expiry Row */}
                    {requiresBatchRow && (
                      <tr className="bg-slate-50/70 border-b border-slate-200/60">
                        <td colSpan="7" className="px-4 pb-3 pt-1">
                          <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                            {trackBatches && (
                              <label className="flex-1 min-w-[140px]">
                                <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">
                                  Batch #
                                </span>
                                <input
                                  type="text"
                                  value={item.batch_number || ""}
                                  onChange={(e) =>
                                    onChange(item.product_id, "batch_number", e.target.value)
                                  }
                                  placeholder="e.g. BATCH-001"
                                  className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-[#FF9F43]"
                                />
                              </label>
                            )}
                            {(trackBatches || trackExpiry) && (
                              <label className="flex-1 min-w-[140px]">
                                <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">
                                  Mfg Date
                                </span>
                                <input
                                  type="date"
                                  value={item.manufacturing_date || ""}
                                  onChange={(e) =>
                                    onChange(
                                      item.product_id,
                                      "manufacturing_date",
                                      e.target.value
                                    )
                                  }
                                  className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-[#FF9F43]"
                                />
                              </label>
                            )}
                            {trackExpiry && (
                              <label className="flex-1 min-w-[140px]">
                                <span className="mb-1 block text-[10px] font-black uppercase text-rose-600">
                                  Expiry Date *
                                </span>
                                <input
                                  type="date"
                                  value={item.expiry_date || ""}
                                  onChange={(e) =>
                                    onChange(item.product_id, "expiry_date", e.target.value)
                                  }
                                  className="h-8 w-full rounded-lg border border-rose-200 bg-rose-50/30 px-2.5 text-xs outline-none focus:border-rose-500 font-bold"
                                />
                              </label>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default PurchaseItemsEditor;
