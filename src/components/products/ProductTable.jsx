import { useState } from "react";
import Icon from "../Icon";
import { formatCurrency } from "../../utils/calculateSaleTotals";

function formatProductDate(dateStr) {
  if (!dateStr) return "Today";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Today";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Today";
  }
}

function ProductTable({
  products = [],
  actionId,
  canUpdate,
  canDelete,
  onView,
  onEdit,
  onDelete,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  function toggleSelectAll() {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left text-xs">
        {/* Table Head */}
        <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="w-10 px-4 py-3.5">
              <input
                type="checkbox"
                className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                checked={products.length > 0 && selectedIds.size === products.length}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="px-4 py-3.5">SKU ⇅</th>
            <th className="px-4 py-3.5">Product Name</th>
            <th className="px-4 py-3.5">Category</th>
            <th className="px-4 py-3.5">Brand</th>
            <th className="px-4 py-3.5">Price</th>
            <th className="px-4 py-3.5">Unit</th>
            <th className="px-4 py-3.5">Qty</th>
            <th className="px-4 py-3.5">Date</th>
            <th className="px-4 py-3.5 text-right">Action</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 font-medium">
          {products.map((product) => {
            const isSelected = selectedIds.has(product.id);
            const dateDisplay = formatProductDate(product.created_at);

            return (
              <tr
                key={product.id}
                className={`transition hover:bg-slate-50/80 ${
                  isSelected ? "bg-orange-50/40" : ""
                }`}
              >
                {/* Checkbox */}
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                    checked={isSelected}
                    onChange={() => toggleSelectOne(product.id)}
                  />
                </td>

                {/* SKU */}
                <td className="px-4 py-3.5 font-bold text-slate-600">
                  {product.product_code || `PT00${product.id}`}
                </td>

                {/* Product Name & Image */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs overflow-hidden border border-slate-200/60 shadow-2xs">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <Icon name="products" className="size-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <strong
                        className="block text-xs font-extrabold text-[#0B1E38] hover:text-[#FF9F43] cursor-pointer transition"
                        onClick={() => onView(product)}
                      >
                        {product.name}
                      </strong>
                      <span className="block text-[10px] text-slate-400 font-medium">
                        {product.barcode || "No Barcode"}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-3.5 text-slate-600 font-semibold">
                  {product.category_name || "General"}
                </td>

                {/* Brand */}
                <td className="px-4 py-3.5 text-slate-600 font-semibold">
                  {product.brand || product.name.split(" ")[0] || "Universal"}
                </td>

                {/* Price */}
                <td className="px-4 py-3.5 font-extrabold text-[#0B1E38]">
                  {formatCurrency(Number(product.selling_price || 0))}
                </td>

                {/* Unit */}
                <td className="px-4 py-3.5 text-slate-500 capitalize">
                  {product.unit_type || "Pc"}
                </td>

                {/* Qty */}
                <td className="px-4 py-3.5">
                  <span
                    className={`font-black ${
                      Number(product.quantity) <= Number(product.minimum_stock || 5)
                        ? "text-rose-500"
                        : "text-slate-800"
                    }`}
                  >
                    {Math.round(Number(product.quantity || 0))}
                  </span>
                </td>

                {/* Clean Date Column */}
                <td className="px-4 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                  {dateDisplay}
                </td>

                {/* Actions (Square outline buttons) */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View */}
                    <button
                      type="button"
                      onClick={() => onView(product)}
                      className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 transition"
                      title="View Details"
                      aria-label="View Details"
                    >
                      <Icon name="eye" className="size-3.5" />
                    </button>

                    {/* Edit */}
                    {canUpdate && (
                      <button
                        type="button"
                        disabled={actionId === product.id}
                        onClick={() => onEdit(product)}
                        className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition disabled:opacity-50"
                        title="Edit Product"
                        aria-label="Edit Product"
                      >
                        <Icon name="edit" className="size-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    {canDelete && (
                      <button
                        type="button"
                        disabled={actionId === product.id}
                        onClick={() => onDelete(product)}
                        className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                        title="Delete Product"
                        aria-label="Delete Product"
                      >
                        <Icon name="trash" className="size-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;
