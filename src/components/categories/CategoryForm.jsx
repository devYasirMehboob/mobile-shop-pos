function CategoryForm({
  values,
  errors,
  isSubmitting,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="space-y-4 px-6 py-5">
        {/* Category Name */}
        <div>
          <label
            className="mb-1.5 block text-xs font-extrabold text-[#0B1E38]"
            htmlFor="category-name"
          >
            Category Name <span className="text-rose-500">*</span>
          </label>
          <input
            className={[
              "min-h-11 w-full rounded-xl border bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-4",
              errors.name
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                : "border-slate-200 focus:border-[#FF9F43] focus:ring-orange-100",
            ].join(" ")}
            id="category-name"
            name="name"
            type="text"
            maxLength="100"
            placeholder="e.g. Smartphones, Accessories, Smart Watches..."
            value={values.name}
            onChange={onChange}
            disabled={isSubmitting}
            autoFocus
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-bold text-rose-600">
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              className="block text-xs font-extrabold text-[#0B1E38]"
              htmlFor="category-description"
            >
              Description
            </label>
            <span className="text-[11px] font-semibold text-slate-400">
              {values.description?.length || 0}/1000
            </span>
          </div>
          <textarea
            className={[
              "min-h-28 w-full resize-none rounded-xl border bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-4",
              errors.description
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                : "border-slate-200 focus:border-[#FF9F43] focus:ring-orange-100",
            ].join(" ")}
            id="category-description"
            name="description"
            maxLength="1000"
            rows="4"
            placeholder="Enter brief description for this category (optional)..."
            value={values.description}
            onChange={onChange}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs font-bold text-rose-600">
              {errors.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <footer className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-4 rounded-b-2xl">
        <button
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 cursor-pointer"
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="min-h-10 rounded-xl bg-[#FF9F43] px-5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#F38C2A] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </footer>
    </form>
  );
}

export default CategoryForm;
