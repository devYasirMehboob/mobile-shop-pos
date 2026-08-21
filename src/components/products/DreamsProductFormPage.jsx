import { useState, useEffect } from "react";
import Icon from "../Icon";

function FieldError({ message }) {
  return message ? <p className="mt-1 text-xs font-semibold text-rose-500">{message}</p> : null;
}

export default function DreamsProductFormPage({
  values,
  errors = {},
  isEdit = false,
  categories = [],
  units = [],
  imagePreview = null,
  isSubmitting = false,
  onChange,
  onImageChange,
  onRemoveImage,
  onSubmit,
  onCancel,
  onGenerateBarcode,
}) {
  const safeCategories = Array.isArray(categories) ? categories : (categories?.categories || []);
  const safeUnits = Array.isArray(units) ? units : (units?.units || []);

  const [openSections, setOpenSections] = useState({
    info: true,
    pricing: true,
    images: true,
    custom: true,
  });

  const [enableWarranty, setEnableWarranty] = useState(true);
  const [enableManufacturer, setEnableManufacturer] = useState(true);
  const [enableExpiry, setEnableExpiry] = useState(true);

  function handleFormatText(prefix, suffix = prefix) {
    const current = values.description || "";
    onChange({
      target: {
        name: "description",
        value: current ? `${current} ${prefix}text${suffix}` : `${prefix}text${suffix}`,
      },
    });
  }

  // Auto generate SKU if empty
  function handleGenerateSku() {
    const randomSku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    onChange({ target: { name: "product_code", value: randomSku } });
  }

  // Auto generate Item Code / Barcode if empty
  function handleGenerateItemCode() {
    if (onGenerateBarcode) {
      onGenerateBarcode();
    } else {
      const code = `890${Date.now().toString().slice(-9)}`;
      onChange({ target: { name: "barcode", value: code } });
    }
  }

  function toggleSection(sectionKey) {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            {isEdit ? "Edit Product" : "Create Product"}
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <button
              type="button"
              onClick={onCancel}
              className="hover:text-slate-700 transition"
            >
              Dashboard
            </button>
            <span>›</span>
            <button
              type="button"
              onClick={onCancel}
              className="hover:text-slate-700 transition"
            >
              Products
            </button>
            <span>›</span>
            <span className="text-slate-600 font-bold">
              {isEdit ? "Edit Product" : "Create Product"}
            </span>
          </nav>
        </div>

        {/* Right Actions: Refresh, Toggle, Back to Products */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition"
            title="Refresh"
            aria-label="Refresh"
          >
            <Icon name="refresh" className="size-4 text-slate-600" />
          </button>

          <button
            type="button"
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition"
            title="Collapse / Expand"
            aria-label="Collapse / Expand"
          >
            <Icon name="chevron-down" className="size-4 text-slate-600" />
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0E2040] px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#19325C] transition active:scale-95"
          >
            <Icon name="chevron-left" className="size-3.5" />
            <span>Back to Products</span>
          </button>
        </div>
      </div>

      {/* FORM BODY */}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {/* SECTION 1: PRODUCT INFORMATION */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {/* Header */}
          <div
            onClick={() => toggleSection("info")}
            className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 cursor-pointer bg-slate-50/40 hover:bg-slate-50/70 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-bold">
                ℹ️
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Product Information
              </strong>
            </div>
            <button type="button" className="text-slate-400">
              <Icon
                name={openSections.info ? "chevron-down" : "chevron-right"}
                className="size-4"
              />
            </button>
          </div>

          {openSections.info && (
            <div className="p-5 sm:p-6 space-y-4">
              {/* Row 1: Product Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={values.name || ""}
                    onChange={onChange}
                    placeholder="e.g. Apple iPhone 15 Pro Max"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:bg-white focus:ring-4 ${
                      errors.name
                        ? "border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 bg-slate-50/40 focus:border-[#FF9F43] focus:ring-orange-100"
                    }`}
                  />
                  <FieldError message={errors.name} />
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-[#FF9F43] hover:underline cursor-pointer">
                      + Add New
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      name="category_id"
                      value={values.category_id || ""}
                      onChange={onChange}
                      className={`w-full appearance-none rounded-xl border px-3.5 pr-8 py-2.5 text-xs font-semibold outline-none transition focus:bg-white focus:ring-4 cursor-pointer ${
                        errors.category_id
                          ? "border-rose-300 bg-rose-50/30 text-rose-800 focus:border-rose-400 focus:ring-rose-100"
                          : "border-slate-200 bg-slate-50/40 text-slate-800 focus:border-[#FF9F43] focus:ring-orange-100"
                      }`}
                    >
                      <option value="">Select Category</option>
                      {safeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="chevron-down"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3 text-slate-400"
                    />
                  </div>
                  <FieldError message={errors.category_id} />
                </div>
              </div>

              {/* Row 2: SKU & Item Code (Barcode) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    SKU <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="product_code"
                      value={values.product_code || ""}
                      onChange={onChange}
                      placeholder="e.g. SKU-849302"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="rounded-xl bg-[#FF9F43] px-3.5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#F38C2A] transition active:scale-95 shrink-0"
                    >
                      Generate
                    </button>
                  </div>
                  <FieldError message={errors.product_code} />
                </div>

                {/* Item Code / Barcode */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Item Code / Barcode
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">
                      (Auto-generated if empty)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="barcode"
                      value={values.barcode || ""}
                      onChange={onChange}
                      placeholder="Leave empty for auto-generated code"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateItemCode}
                      className="rounded-xl bg-[#FF9F43] px-3.5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#F38C2A] transition active:scale-95 shrink-0 cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Brand & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={values.brand || ""}
                    onChange={onChange}
                    placeholder="e.g. Apple, Samsung, Lenovo, Nike..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Unit <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="base_unit_id"
                      value={values.base_unit_id || ""}
                      onChange={onChange}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 pr-8 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
                    >
                      <option value="">Select Unit (e.g. Piece, Box, Pack)</option>
                      {safeUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.symbol})
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="chevron-down"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3 text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Description (Rich Text Area style with toolbar) */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Description
                </label>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs focus-within:border-[#FF9F43] focus-within:ring-4 focus-within:ring-orange-100 transition">
                  {/* Text Editor Toolbar */}
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-1.5 text-slate-500 text-xs font-bold">
                    <button type="button" onClick={() => handleFormatText("**")} className="px-1.5 py-0.5 rounded hover:bg-slate-200/60 font-black cursor-pointer" title="Bold">B</button>
                    <button type="button" onClick={() => handleFormatText("*")} className="px-1.5 py-0.5 rounded hover:bg-slate-200/60 italic font-serif cursor-pointer" title="Italic">I</button>
                    <button type="button" onClick={() => handleFormatText("__")} className="px-1.5 py-0.5 rounded hover:bg-slate-200/60 underline cursor-pointer" title="Underline">U</button>
                    <span className="h-3.5 w-px bg-slate-200 mx-1" />
                    <button type="button" onClick={() => handleFormatText("[Link](", ")")} className="px-1.5 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer" title="Link">🔗</button>
                    <button type="button" onClick={() => handleFormatText("• ")} className="px-1.5 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer" title="Bullet List">☰</button>
                    <button type="button" onClick={() => handleFormatText('"', '"')} className="px-1.5 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer" title="Quote">❝</button>
                    <button type="button" onClick={() => handleFormatText("`", "`")} className="px-1.5 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer" title="Code">&lt;/&gt;</button>
                  </div>
                  {/* Textarea */}
                  <textarea
                    rows={3}
                    name="description"
                    value={values.description || ""}
                    onChange={onChange}
                    placeholder="Enter product description, specifications, and details..."
                    className="w-full bg-transparent p-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none resize-none"
                  />
                  <div className="flex justify-between items-center px-3 py-1.5 border-t border-slate-50 bg-slate-50/30 text-[10px] text-slate-400 font-semibold">
                    <span>Maximum 60 Words</span>
                    <span>{(values.description || "").length} characters</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: PRICING & STOCKS */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {/* Header */}
          <div
            onClick={() => toggleSection("pricing")}
            className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 cursor-pointer bg-slate-50/40 hover:bg-slate-50/70 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-bold">
                🪙
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Pricing &amp; Stocks
              </strong>
            </div>
            <button type="button" className="text-slate-400">
              <Icon
                name={openSections.pricing ? "chevron-down" : "chevron-right"}
                className="size-4"
              />
            </button>
          </div>

          {openSections.pricing && (
            <div className="p-5 sm:p-6 space-y-4">
              {/* Product Type Radio */}
              <div className="flex items-center gap-6 text-xs font-bold text-slate-700">
                <span className="text-slate-500">Product Type:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="product_type_select"
                    checked={true}
                    readOnly
                    className="size-4 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43]"
                  />
                  <span>Single Product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer opacity-60">
                  <input
                    type="radio"
                    name="product_type_select"
                    checked={false}
                    readOnly
                    className="size-4 text-slate-300"
                  />
                  <span>Variable Product</span>
                </label>
              </div>

              {/* Row 1: Quantity, Purchase Price, Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Quantity */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="quantity"
                    value={values.quantity ?? "0"}
                    onChange={onChange}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Purchase Price ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="purchase_cost"
                    value={values.purchase_cost ?? "0.00"}
                    onChange={onChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Selling Price ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="selling_price"
                    value={values.selling_price || ""}
                    onChange={onChange}
                    placeholder="0.00"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:bg-white focus:ring-4 ${
                      errors.selling_price
                        ? "border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 bg-slate-50/40 focus:border-[#FF9F43] focus:ring-orange-100"
                    }`}
                  />
                  <FieldError message={errors.selling_price} />
                </div>
              </div>

              {/* Row 2: Tax, Discount Type, Discount Value, Minimum Items (Quantity Alert) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Tax */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="tax"
                    value={values.tax ?? "0"}
                    onChange={onChange}
                    placeholder="0%"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Discount Type
                  </label>
                  <div className="relative">
                    <select
                      name="discount_type"
                      value={values.discount_type || "fixed"}
                      onChange={onChange}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 pr-8 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
                    >
                      <option value="fixed">Fixed ($)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                    <Icon
                      name="chevron-down"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3 text-slate-400"
                    />
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="discount_value"
                    value={values.discount_value ?? "0"}
                    onChange={onChange}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* Minimum Items (Quantity Alert) */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Minimum Items (Alert)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="minimum_stock"
                    value={values.minimum_stock ?? "5"}
                    onChange={onChange}
                    placeholder="5"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: IMAGES */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {/* Header */}
          <div
            onClick={() => toggleSection("images")}
            className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 cursor-pointer bg-slate-50/40 hover:bg-slate-50/70 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-bold">
                🖼️
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Images
              </strong>
            </div>
            <button type="button" className="text-slate-400">
              <Icon
                name={openSections.images ? "chevron-down" : "chevron-right"}
                className="size-4"
              />
            </button>
          </div>

          {openSections.images && (
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Upload Box Tile */}
                <label className="group relative flex size-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-center transition hover:border-[#FF9F43] hover:bg-orange-50/30">
                  <div className="grid size-10 place-items-center rounded-full bg-white text-[#FF9F43] shadow-xs group-hover:scale-110 transition">
                    <Icon name="plus" className="size-5" />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-600 group-hover:text-[#FF9F43]">
                    Add Image
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onImageChange}
                    className="hidden"
                  />
                </label>

                {/* Preview Tile */}
                {imagePreview && (
                  <div className="relative size-32 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs group">
                    <img
                      src={imagePreview}
                      alt="Product Preview"
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={onRemoveImage}
                      className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-rose-500 text-white text-xs font-bold shadow-md hover:bg-rose-600 transition"
                      title="Remove Image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <FieldError message={errors.image} />
            </div>
          )}
        </div>

        {/* SECTION 4: CUSTOM FIELDS (WARRANTIES, MANUFACTURER, EXPIRY) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {/* Header */}
          <div
            onClick={() => toggleSection("custom")}
            className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 cursor-pointer bg-slate-50/40 hover:bg-slate-50/70 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-orange-50 text-[#FF9F43] text-xs font-bold">
                📋
              </span>
              <strong className="text-sm font-black text-[#0B1E38]">
                Custom Fields
              </strong>
            </div>
            <button type="button" className="text-slate-400">
              <Icon
                name={openSections.custom ? "chevron-down" : "chevron-right"}
                className="size-4"
              />
            </button>
          </div>

          {openSections.custom && (
            <div className="p-5 sm:p-6 space-y-5">
              {/* Toggles Checkboxes Row */}
              <div className="flex flex-wrap items-center gap-6 rounded-xl bg-slate-50/70 p-3 text-xs font-bold text-slate-700 border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableWarranty}
                    onChange={(e) => setEnableWarranty(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                  />
                  <span>Warranties</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableManufacturer}
                    onChange={(e) => setEnableManufacturer(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                  />
                  <span>Manufacturer</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableExpiry}
                    onChange={(e) => setEnableExpiry(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                  />
                  <span>Expiry</span>
                </label>
              </div>

              {/* Row 1: Warranty & Manufacturer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Warranty */}
                {enableWarranty && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Warranty
                    </label>
                    <div className="relative">
                      <select
                        name="warranty"
                        value={values.warranty || ""}
                        onChange={onChange}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 pr-8 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
                      >
                        <option value="">Select Warranty</option>
                        <option value="No Warranty">No Warranty</option>
                        <option value="1 Month">1 Month Official</option>
                        <option value="3 Months">3 Months Official</option>
                        <option value="6 Months">6 Months Official</option>
                        <option value="1 Year">1 Year Official</option>
                        <option value="2 Years">2 Years Official</option>
                        <option value="Lifetime">Lifetime Warranty</option>
                      </select>
                      <Icon
                        name="chevron-down"
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3 text-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* Manufacturer */}
                {enableManufacturer && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={values.manufacturer || ""}
                      onChange={onChange}
                      placeholder="e.g. Apple Inc., Samsung Electronics..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                )}
              </div>

              {/* Row 2: Manufactured Date & Expiry Date */}
              {enableExpiry && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Manufactured Date */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Manufactured Date
                    </label>
                    <input
                      type="date"
                      name="manufactured_date"
                      value={values.manufactured_date || ""}
                      onChange={onChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      name="expiry_date"
                      value={values.expiry_date || ""}
                      onChange={onChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl bg-[#0E2040] px-6 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-[#19325C] transition active:scale-95 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#FF9F43] px-7 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
