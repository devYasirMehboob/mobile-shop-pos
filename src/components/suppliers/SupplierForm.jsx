import { useEffect, useState } from "react";
import Modal from "../Modal";
import Icon from "../Icon";

const emptySupplier = {
  name: "",
  contact_person: "",
  phone: "",
  alternate_phone: "",
  email: "",
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
          name: supplier.name || "",
          contact_person: supplier.contact_person || "",
          phone: supplier.phone || "",
          alternate_phone: supplier.alternate_phone || "",
          email: supplier.email || "",
          address: supplier.address || "",
          opening_balance: supplier.opening_balance ?? "0.00",
          notes: supplier.notes || "",
          status: supplier.status || "active",
        });
      } else {
        setForm({
          ...emptySupplier,
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
      title={supplier ? `Edit Supplier — ${supplier.name}` : "Add New Supplier"}
      description="Manage vendor contact information, phone numbers, addresses, and balance."
      onClose={busy ? () => {} : onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="max-h-[72vh] overflow-y-auto p-6 space-y-5">
          {/* Row 1: Supplier Name & Contact Person */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Supplier / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Apex Mobiles Wholesale, Nadeem Vijhi..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">
                  {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Contact Person / Representative
              </label>
              <input
                type="text"
                name="contact_person"
                value={form.contact_person}
                onChange={handleChange}
                placeholder="e.g. Muhammad Ali, Nadeem..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              {errors.contact_person && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">
                  {Array.isArray(errors.contact_person)
                    ? errors.contact_person[0]
                    : errors.contact_person}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Primary Phone & WhatsApp / Alternate Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Primary Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 03143328315"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">
                  {Array.isArray(errors.phone) ? errors.phone[0] : errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                WhatsApp / Alternate Phone
              </label>
              <input
                type="tel"
                name="alternate_phone"
                value={form.alternate_phone}
                onChange={handleChange}
                placeholder="e.g. 03001234567"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </div>

          {/* Row 3: Email & Opening Balance */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="vendor@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Opening Balance (Rs)
              </label>
              <input
                type="number"
                step="0.01"
                name="opening_balance"
                value={form.opening_balance}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              <span className="mt-1 block text-[10px] text-slate-400 font-medium">
                Initial payable amount on vendor registration.
              </span>
            </div>
          </div>

          {/* Row 4: Shop / Warehouse Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Shop / Warehouse Address
            </label>
            <textarea
              rows={2}
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Shop #12, Hafeez Center, Vehari Goal Chowk..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 resize-none"
            />
          </div>

          {/* Row 5: Notes & Account Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Notes &amp; Payment Terms
              </label>
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="e.g. 15-day credit, City: Lahore, Bank: Meezan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Account Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100 cursor-pointer"
              >
                <option value="active">Active (Permitted for Invoices &amp; Purchases)</option>
                <option value="inactive">Inactive (Archived / Suspended)</option>
              </select>
            </div>
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
