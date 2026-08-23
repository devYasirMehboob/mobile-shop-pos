import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { getCategories } from "../api/categoriesApi";
import { getProducts } from "../api/productsApi";
import {
  completeDraftPurchase,
  createPurchase,
  getProductUnits,
  getPurchase,
  updateDraftPurchase,
} from "../api/purchasesApi";
import { getSupplierOptions } from "../api/suppliersApi";
import { getUnits } from "../api/unitsApi";
import Icon from "../components/Icon";
import LoadingState from "../components/feedback/LoadingState";
import PurchaseItemsEditor from "../components/purchases/PurchaseItemsEditor";
import PurchaseTotalsPanel from "../components/purchases/PurchaseTotalsPanel";
import SupplierProductSuggestions from "../components/purchases/SupplierProductSuggestions";
import QuickAddProductDialog from "../components/purchases/QuickAddProductDialog";
import QuickAddPackagingUnitDialog from "../components/purchases/QuickAddPackagingUnitDialog";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";
import { formatCurrency } from "../utils/calculateSaleTotals";

const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({
  supplier_id: "",
  supplier_invoice_number: "",
  purchase_date: today(),
  overall_discount: "0",
  tax: "0",
  shipping_amount: "0",
  other_charges: "0",
  amount_paid: "0",
  payment_method: "cash",
  payment_reference: "",
  notes: "",
  request_token: crypto.randomUUID(),
});

function PurchaseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const alert = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [form, setForm] = useState(empty);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  // URL-synchronized Dialog states (persists on reload)
  const isQuickAddInUrl = searchParams.get("modal") === "quick-add";
  const urlInitialName = searchParams.get("name") || "";
  const [quickAddOpen, setQuickAddOpen] = useState(isQuickAddInUrl);
  const [quickAddInitialName, setQuickAddInitialName] = useState(urlInitialName);

  const [configUnitOpen, setConfigUnitOpen] = useState(false);
  const [selectedProductForConfig, setSelectedProductForConfig] = useState(null);
  const [selectedItemForConfig, setSelectedItemForConfig] = useState(null);

  // Sync state if URL changes externally
  useEffect(() => {
    const isModalOpen = searchParams.get("modal") === "quick-add";
    setQuickAddOpen(isModalOpen);
    if (isModalOpen) {
      setQuickAddInitialName(searchParams.get("name") || "");
    }
  }, [searchParams]);

  useEffect(() => {
    document.title = `${id ? "Edit" : "New"} Purchase Order | Mobile Shop POS`;
    Promise.all([
      getSupplierOptions(),
      getProducts({ status: "active", limit: 300 }),
      getUnits(),
      getCategories(),
      id ? getPurchase(id) : null,
    ])
      .then(([s, p, u, c, purchase]) => {
        setSuppliers(s || []);
        setProducts(p.products || []);
        setUnits(u.units || u || []);
        setCategories(c.categories || c || []);

        if (purchase) {
          const pData = purchase.purchase || purchase;
          setForm({
            supplier_id: String(pData.supplier_id || ""),
            supplier_invoice_number: pData.supplier_invoice_number || "",
            purchase_date: pData.purchase_date || today(),
            overall_discount: String(pData.discount_amount || "0"),
            tax: String(pData.tax_amount || "0"),
            shipping_amount: String(pData.shipping_amount || "0"),
            other_charges: String(pData.other_charges || "0"),
            amount_paid: String(pData.amount_paid || "0"),
            payment_method: pData.payment_method || "cash",
            payment_reference: pData.payment_reference || "",
            notes: pData.notes || "",
            request_token: pData.request_token || crypto.randomUUID(),
          });
          setItems(
            (pData.items || []).map((i) => ({
              product_id: Number(i.product_id),
              name: i.product_name,
              product_code: i.product_code,
              unit_id: i.unit_id || i.default_purchase_unit_id || "",
              quantity: String(Number(i.quantity_entered || i.quantity || 1)),
              unit_cost: String(i.unit_cost || 0),
              line_discount: String(i.line_discount || 0),
              last_purchase_cost: i.last_purchase_cost || null,
              purchase_units: i.purchase_units || [],
            }))
          );
        }
      })
      .catch((e) => {
        alert.error(normalizeApiError(e).message);
      })
      .finally(() => setLoading(false));
  }, [id, alert]);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (s, i) =>
        s +
        Math.max(
          0,
          Number(i.quantity || 0) * Number(i.unit_cost || 0) -
            Number(i.line_discount || 0)
        ),
      0
    );
    const discount = Number(form.overall_discount || 0);
    const tax = Number(form.tax || 0);
    const charges =
      Number(form.shipping_amount || 0) + Number(form.other_charges || 0);
    return {
      subtotal,
      discount,
      tax,
      charges,
      grand: Math.max(0, subtotal - discount + tax + charges),
    };
  }, [items, form]);

  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function addProductToItems(product) {
    const pid = Number(product.id);
    const existing = items.find((i) => Number(i.product_id) === pid);

    if (existing) {
      alert.info(`${product.name} is already in the purchase. Incremented pack quantity.`);
      setItems((list) =>
        list.map((i) =>
          Number(i.product_id) === pid
            ? { ...i, quantity: String(Number(i.quantity || 1) + 1) }
            : i
        )
      );
      return;
    }

    const defaultUnitId =
      product.default_purchase_unit_id ||
      product.purchase_units?.[0]?.unit_id ||
      product.base_unit_id ||
      "";

    const defaultCost =
      product.last_purchase_cost != null
        ? String(product.last_purchase_cost)
        : String(product.purchase_cost || "0");

    setItems((list) => [
      ...list,
      {
        product_id: pid,
        name: product.name,
        product_code: product.product_code,
        unit_id: defaultUnitId,
        quantity: "1",
        unit_cost: defaultCost,
        line_discount: "0",
        last_purchase_cost: product.last_purchase_cost || null,
        purchase_units: product.purchase_units || [],
        product,
      },
    ]);

    alert.success(`${product.name} added to purchase.`);
  }

  function handleLineChange(pid, key, value) {
    setItems((list) =>
      list.map((i) => (Number(i.product_id) === Number(pid) ? { ...i, [key]: value } : i))
    );
  }

  function handleOpenQuickAdd(query = "") {
    setQuickAddInitialName(query);
    setQuickAddOpen(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("modal", "quick-add");
        if (query?.trim()) next.set("name", query.trim());
        else next.delete("name");
        return next;
      },
      { replace: true }
    );
  }

  function handleCloseQuickAdd() {
    setQuickAddOpen(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("modal");
        next.delete("name");
        return next;
      },
      { replace: true }
    );
  }

  function handleQuickAddCreated(createdProduct) {
    setProducts((prev) => [createdProduct, ...prev]);
    addProductToItems(createdProduct);
    handleCloseQuickAdd();
  }

  function handleOpenConfigureUnit(product, item) {
    setSelectedProductForConfig(product);
    setSelectedItemForConfig(item || null);
    setConfigUnitOpen(true);
  }

  async function handleUnitConfigured(productId) {
    try {
      const [unitsRes, productsRes] = await Promise.all([
        getProductUnits(productId),
        getProducts({ status: "active", limit: 300 }),
      ]);

      const freshUnits = Array.isArray(unitsRes) ? unitsRes : unitsRes?.units || [];
      const freshProducts = productsRes.products || [];

      setProducts(freshProducts);

      setItems((list) =>
        list.map((i) =>
          Number(i.product_id) === Number(productId)
            ? { ...i, purchase_units: freshUnits }
            : i
        )
      );

      alert.success("Packaging unit saved! Select it from the unit dropdown.");
    } catch {
      alert.error("Unit was saved but failed to refresh. Please reload.");
    }
  }

  function payload() {
    return {
      ...form,
      supplier_id: Number(form.supplier_id),
      items: items.map(
        ({
          product_id,
          unit_id,
          quantity,
          unit_cost,
          line_discount,
          batch_number,
          manufacturing_date,
          expiry_date,
        }) => ({
          product_id: Number(product_id),
          unit_id: unit_id ? Number(unit_id) : null,
          quantity: quantity,
          unit_cost: unit_cost,
          line_discount: line_discount,
          batch_number,
          manufacturing_date,
          expiry_date,
        })
      ),
    };
  }

  async function save(draft) {
    if (!form.supplier_id) {
      alert.error("Please select a supplier.");
      return;
    }
    if (!items.length) {
      alert.error("Add at least one product to the purchase.");
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const r = id
        ? draft
          ? await updateDraftPurchase(id, payload())
          : await completeDraftPurchase(id, payload())
        : await createPurchase(payload(), draft);

      alert.success(r.message || "Purchase saved successfully.");
      const targetId = r.data?.purchase?.id || r.data?.id || r.purchase?.id || r.id;
      navigate(draft || !targetId ? "/purchases" : `/purchases/${targetId}`, {
        replace: true,
      });
    } catch (e) {
      const normalized = normalizeApiError(e);
      setErrors(normalized.fieldErrors || {});
      alert.error(normalized.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20">
        <LoadingState label="Preparing purchase form & product catalogs..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      {/* 1. Header Toolbar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/purchases"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
            >
              <span>←</span>
              <span>Back to Purchases</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
              <span>📦</span>
              <span>Stock Inward</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            {id ? "Edit Draft Purchase" : "New Purchase Order"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Supplier procurement entry, multi-pack conversions, batch management, and payable calculation.
          </p>
        </div>

        {/* Quick Summary Preview in Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-2xs">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Payable</div>
            <div className="text-base font-black text-[#0B1E38] font-mono">
              {formatCurrency(totals.grand)}
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>Please review the highlighted fields in the form and try again.</span>
        </div>
      )}

      {/* 2. Supplier & Invoice Card */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Icon name="truck" className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[#0B1E38]">
              Supplier &amp; Invoice Information
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Select the vendor and specify the supplier invoice reference.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-xs font-bold text-slate-700">
            Supplier *
            <select
              value={form.supplier_id}
              onChange={(e) => change("supplier_id", e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-900 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Choose supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.phone ? `(${s.phone})` : ""}
                </option>
              ))}
            </select>
            {errors.supplier_id?.[0] && (
              <span className="mt-1 block text-[11px] font-semibold text-rose-600">
                {errors.supplier_id[0]}
              </span>
            )}
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Supplier Invoice # (Bill No)
            <input
              value={form.supplier_invoice_number}
              onChange={(e) => change("supplier_invoice_number", e.target.value)}
              placeholder="e.g. INV-2026-0982"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
            />
            {errors.supplier_invoice_number?.[0] && (
              <span className="mt-1 block text-[11px] font-semibold text-rose-600">
                {errors.supplier_invoice_number[0]}
              </span>
            )}
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Purchase Date
            <input
              type="date"
              max={today()}
              value={form.purchase_date}
              onChange={(e) => change("purchase_date", e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>
      </section>

      {/* 3. Frequent Supplier Products Suggestion Pills */}
      {form.supplier_id && (
        <SupplierProductSuggestions
          supplierId={Number(form.supplier_id)}
          onSelectProduct={addProductToItems}
        />
      )}

      {/* 4. Product Items Table & Barcode Search */}
      <PurchaseItemsEditor
        products={products}
        units={units}
        items={items}
        supplierId={form.supplier_id}
        onAddProduct={addProductToItems}
        onChange={handleLineChange}
        onRemove={(pid) =>
          setItems((list) => list.filter((i) => Number(i.product_id) !== Number(pid)))
        }
        onQuickAdd={handleOpenQuickAdd}
        onConfigureUnit={handleOpenConfigureUnit}
      />

      {/* 5. Additional Costs & Split Totals Panel */}
      <PurchaseTotalsPanel values={form} totals={totals} onChange={change} />

      {/* 6. Sticky Floating Bottom Action Bar */}
      <footer className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-7xl rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Total Order Value
            </span>
            <div className="text-xl font-black text-[#0B1E38] font-mono leading-none">
              {formatCurrency(totals.grand)}
            </div>
          </div>
          <span className="hidden sm:inline text-slate-200">|</span>
          <div className="hidden sm:block text-xs font-semibold text-slate-500">
            {items.length} {items.length === 1 ? "line item" : "line items"} ready to receive into stock.
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => save(true)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            {busy ? "Saving..." : "💾 Save as Draft"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => save(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF9F43] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition cursor-pointer disabled:opacity-50"
          >
            <Icon name="check" className="size-4" />
            <span>{busy ? "Posting & Receiving..." : "Complete & Receive Stock"}</span>
          </button>
        </div>
      </footer>

      {/* Quick Add Dialogs */}
      <QuickAddProductDialog
        isOpen={quickAddOpen}
        onClose={handleCloseQuickAdd}
        onCreated={handleQuickAddCreated}
        supplierId={form.supplier_id}
        initialName={quickAddInitialName}
        categories={categories}
        units={units}
      />

      <QuickAddPackagingUnitDialog
        isOpen={configUnitOpen}
        onClose={() => setConfigUnitOpen(false)}
        product={selectedProductForConfig}
        currentItem={selectedItemForConfig}
        units={units}
        onConfigured={handleUnitConfigured}
      />
    </div>
  );
}

export default PurchaseFormPage;
