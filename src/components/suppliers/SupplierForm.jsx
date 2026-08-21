import { useEffect, useState } from "react";
import Modal from "../Modal";
import Icon from "../Icon";

const emptySupplier = {
  name: "",
  supplier_code: "",
  company_name: "",
  contact_person: "",
  phone: "",
  alternate_phone: "",
  email: "",
  city: "",
  country: "",
  address: "",
  opening_balance: "0.00",
  notes: "",
  status: "active",
};

function SupplierForm({
  open,
  supplier,
  busy,
  errors = {},
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptySupplier);

  useEffect(() => {
    if (open) {
      if (supplier) {
        setForm({
          ...emptySupplier,
          ...supplier,
          opening_balance: supplier.opening_balance ?? "0.00",
        });
      } else {
        setForm({
          ...emptySupplier,
          supplier_code: `SU${Math.floor(100 + Math.random() * 900)}`,
        });
      }
    }
  }, [open, supplier]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <Modal
      isOpen={open}
      title={supplier ? "Edit Supplier" : "Add New Supplier"}
      description="Keep vendor contact details, tax numbers, and payable accounts accurate."
      onClose={busy ? () => {} : onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="max-h-[72vh] overflow-y-auto p-6 space-y-5">
          {/* Row 1: Name & Supplier Code */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Supplier Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name || ""}
                onChange={handleChange}
                placeholder="e.g. Apex Computers Ltd."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.name[0] || errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Supplier Code
              </label>
              <input
                type="text"
                name="supplier_code"
                value={form.supplier_code || ""}
                onChange={handleChange}
                placeholder="e.g. SU001"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-700 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </div>

          {/* Row 2: Phone & Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.phone[0] || errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email || ""}
                onChange={handleChange}
                placeholder="vendor@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.email[0] || errors.email}</p>
              )}
            </div>
          </div>

          {/* Row 3: City, Country, Opening Balance */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                name="city"
                value={form.city || ""}
                onChange={handleChange}
                placeholder="e.g. Lahore, Karachi, Tokyo"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={form.country || ""}
                onChange={handleChange}
                placeholder="e.g. Pakistan, China, USA"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Opening Balance
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="opening_balance"
                disabled={Boolean(supplier)}
                value={form.opening_balance ?? "0.00"}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Row 4: Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Shop / Warehouse Address
            </label>
            <textarea
              rows={2}
              name="address"
              value={form.address || ""}
              onChange={handleChange}
              placeholder="e.g. Plaza 4, Hafeez Center, Main Boulevard..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 resize-none"
            />
          </div>

          {/* Row 5: Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Account Status
            </label>
            <select
              name="status"
              value={form.status || "active"}
              onChange={handleChange}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
            >
              <option value="active">Active (Permitted for Invoices &amp; Purchases)</option>
              <option value="inactive">Inactive (Archived / Suspended)</option>
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-5 py-2.5 text-xs font-black text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#F38C2A] active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {busy ? (
              <>
                <Icon name="refresh" className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{supplier ? "Update Supplier" : "Create Supplier"}</span>
            )}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export default SupplierForm;
