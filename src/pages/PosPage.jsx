import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPosCategories, getPosProducts } from "../api/posApi";
import { completeSale, getSaleReceipt } from "../api/salesApi";

import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import CartItem from "../components/pos/CartItem";
import HeldSalesDialog from "../components/pos/HeldSalesDialog";
import PaymentPanel from "../components/pos/PaymentPanel";
import ProductCard from "../components/pos/ProductCard";
import SaleSuccessModal from "../components/pos/SaleSuccessModal";
import TotalsPanel from "../components/pos/TotalsPanel";
import ReceiptPreview from "../components/sales/ReceiptPreview";
import AmountWeightModal from "../components/pos/AmountWeightModal";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";
import useCart from "../hooks/useCart";
import useGlobalBarcodeScanner from "../hooks/useGlobalBarcodeScanner";
import useHeldSales from "../hooks/useHeldSales";
import useScanQueue from "../hooks/useScanQueue";
import useSettings from "../hooks/useSettings";
import usePermissions from "../hooks/usePermissions";
import { calculateSaleTotals } from "../utils/calculateSaleTotals";

const DRAFT_KEY = "dreams-pos-draft-v3";
const PAGE_SIZE = 60;
const blankPayment = () => ({
  payment_method: "cash",
  payment_reference: "",
  amount_received: "",
  customer_name: "",
  customer_phone: "",
  note: "",
});
const newToken = () => crypto.randomUUID();

function readDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    return {
      discountType: ["none", "fixed", "percentage"].includes(draft.discountType)
        ? draft.discountType
        : "none",
      discountValue: String(draft.discountValue ?? "0"),
      payment: { ...blankPayment(), ...(draft.payment || {}) },
      requestToken:
        typeof draft.requestToken === "string" ? draft.requestToken : newToken(),
      activeHeldSaleId:
        draft.activeHeldSaleId != null &&
        Number.isInteger(Number(draft.activeHeldSaleId)) &&
        Number(draft.activeHeldSaleId) > 0
          ? Number(draft.activeHeldSaleId)
          : null,
      activeHeldReference:
        typeof draft.activeHeldReference === "string"
          ? draft.activeHeldReference
          : "",
    };
  } catch {
    return {
      discountType: "none",
      discountValue: "0",
      payment: blankPayment(),
      requestToken: newToken(),
      activeHeldSaleId: null,
      activeHeldReference: "",
    };
  }
}

function PosPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const held = useHeldSales();
  const { settings } = useSettings();
  const taxSettings = settings?.tax || {};
  const discountSettings = settings?.discounts || {};
  const barcodeSettings = settings?.barcode || {};
  const receiptSettings = settings?.receipt || {};
  const initialDraft = useRef(readDraft()).current;
  const barcodeRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [barcode, setBarcode] = useState("");
  const alert = useAlert();
  const confirmDialog = useConfirmation();
  const { can } = usePermissions();
  const notify = useCallback(
    (message, type = "info") =>
      alert[type === "error" ? "error" : "success"](message),
    [alert]
  );

  const onBarcodeNotFound = useCallback(
    async (scannedBarcode) => {
      if (!can("products.create")) {
        notify(`No product found for barcode "${scannedBarcode}".`, "error");
        return;
      }
      const confirmed = await confirmDialog({
        title: "Product not found",
        description: `Barcode "${scannedBarcode}" is not registered. Would you like to add it as a new product?`,
        confirmText: "Add product",
        tone: "info",
      });
      if (confirmed) {
        navigate("/products?action=new", {
          state: { newBarcode: scannedBarcode },
        });
      }
    },
    [can, confirmDialog, navigate, notify]
  );

  const scanQueue = useScanQueue(cart, notify, onBarcodeNotFound);

  useGlobalBarcodeScanner((scannedBarcode) => {
    scanQueue.enqueue(scannedBarcode);
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [discountType, setDiscountType] = useState(initialDraft.discountType);
  const [discountValue, setDiscountValue] = useState(
    initialDraft.discountValue
  );
  const [payment, setPayment] = useState(initialDraft.payment);
  const [requestToken, setRequestToken] = useState(initialDraft.requestToken);
  const [activeHeldSaleId, setActiveHeldSaleId] = useState(
    initialDraft.activeHeldSaleId
  );
  const [activeHeldReference, setActiveHeldReference] = useState(
    initialDraft.activeHeldReference
  );
  const [heldOpen, setHeldOpen] = useState(false);
  const [savedSale, setSavedSale] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockRefresh, setStockRefresh] = useState(0);

  const [amountWeightProduct, setAmountWeightProduct] = useState(null);

  useEffect(() => {
    document.title = "Point of Sale | Dreams POS";
  }, []);

  useEffect(() => {
    getPosCategories()
      .then((items) =>
        setCategories((items || []).filter((c) => c.status === "active"))
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    getPosProducts({ search, category_id: category, page, limit: PAGE_SIZE })
      .then((data) => {
        setProducts(data.products || []);
        setPagination(
          data.pagination || {
            page: 1,
            total_pages: 1,
            total: (data.products || []).length,
          }
        );
      })
      .catch((f) => setError(normalizeApiError(f).message))
      .finally(() => setLoading(false));
  }, [search, category, page, retryKey, stockRefresh]);

  const totals = useMemo(
    () =>
      calculateSaleTotals(
        cart.items,
        discountType,
        discountValue,
        taxSettings.enabled ? taxSettings.percentage : 0
      ),
    [cart.items, discountType, discountValue, taxSettings]
  );

  function resetDraft() {
    cart.clear();
    setDiscountType("none");
    setDiscountValue("0");
    setPayment(blankPayment());
    setRequestToken(newToken());
    setActiveHeldSaleId(null);
    setActiveHeldReference("");
    localStorage.removeItem(DRAFT_KEY);
  }

  function add(product, isCustom = false) {
    if (isCustom) {
      setAmountWeightProduct(product);
      return;
    }
    cart.add(product, 1);
  }

  function addWithQuantity(product, customQty) {
    cart.add(product, customQty);
    setAmountWeightProduct(null);
  }

  function quantity(item, nextQty) {
    cart.setQuantity(item.id, nextQty);
  }

  function remove(item) {
    cart.remove(item.id);
  }

  function scan(e) {
    e.preventDefault();
    if (!barcode.trim()) return;
    scanQueue.enqueue(barcode.trim());
    setBarcode("");
  }

  async function confirmClearCart() {
    const confirmed = await confirmDialog({
      title: "Clear current cart?",
      description: "All selected products will be removed from this order.",
      confirmText: "Clear Cart",
      tone: "danger",
    });
    if (!confirmed) return;

    resetDraft();
    notify("Cart cleared.");
  }

  async function holdSale() {
    if (!cart.items.length) return notify("Add products to hold.", "error");
    try {
      await held.hold({
        id: activeHeldSaleId,
        items: cart.items,
        discount_type: discountType,
        discount_value: discountValue,
        payment,
      });
      notify("Sale placed on hold.", "success");
      resetDraft();
    } catch (e) {
      notify(normalizeApiError(e).message, "error");
    }
  }

  function resume(sale) {
    resetDraft();
    (sale.items || []).forEach((item) => {
      cart.add(item, item.quantity || 1);
    });
    setDiscountType(sale.discount_type || "none");
    setDiscountValue(String(sale.discount_value || "0"));
    setActiveHeldSaleId(sale.id);
    setActiveHeldReference(sale.reference_number || `Hold #${sale.id}`);
    setHeldOpen(false);
    notify(`Hold sale ${sale.reference_number || ""} resumed.`);
  }

  async function complete() {
    if (!cart.items.length)
      return notify("Add at least one product.", "error");

    if (
      payment.payment_method === "cash" &&
      Number(payment.amount_received || 0) < totals.grandTotal
    ) {
      return notify("Cash received must cover the grand total.", "error");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.items.map((i) => ({
          product_id: i.id,
          quantity: i.cartQuantity,
          selling_price: i.selling_price,
          unit_cost: i.purchase_cost || 0,
        })),
        subtotal: totals.subtotal,
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        tax_amount: totals.tax,
        total_amount: totals.grandTotal,
        payment_method: payment.payment_method,
        amount_received: Number(payment.amount_received || totals.grandTotal),
        customer_name: payment.customer_name || "Walk-in Customer",
        customer_phone: payment.customer_phone || "",
        note: payment.note || "",
        held_sale_id: activeHeldSaleId,
      };

      const response = await completeSale(payload);
      setSavedSale(response.data?.sale || response.data);

      if (receiptSettings.auto_print && response.data?.sale?.id) {
        const savedReceipt = await getSaleReceipt(response.data.sale.id);
        setReceipt(savedReceipt);
        setReceiptOpen(true);
      }

      resetDraft();
      await held.load().catch(() => undefined);
      setStockRefresh((v) => v + 1);
      notify(response.message || "Sale completed successfully!", "success");
    } catch (failure) {
      notify(normalizeApiError(failure).message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function openReceipt() {
    if (!savedSale) return;
    setReceiptLoading(true);
    try {
      const data = await getSaleReceipt(savedSale.id);
      setReceipt(data);
      setSavedSale(null);
      setReceiptOpen(true);
    } catch (failure) {
      notify(normalizeApiError(failure).message, "error");
    } finally {
      setReceiptLoading(false);
    }
  }

  function newSale() {
    setSavedSale(null);
    window.setTimeout(() => barcodeRef.current?.focus(), 0);
  }

  return (
    <div className="space-y-4 pb-8">
      {/* 1. TOP BAR: Title, Search, Scan & Held Sales */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Point of Sale
          </h1>
          <nav className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="hover:text-slate-700 transition"
            >
              Dashboard
            </button>
            <span>›</span>
            <span className="text-slate-600 font-bold">POS Terminal</span>
          </nav>
        </div>

        {/* Right Action: Held Sales pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHeldOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-[#FF9F43]">⏳</span>
            <span>Held Orders</span>
            <span className="grid size-5 place-items-center rounded-full bg-orange-100 text-[10px] font-black text-[#FF9F43]">
              {held.heldSales.length}
            </span>
          </button>
        </div>
      </section>

      {/* Held Resumed Banner */}
      {activeHeldSaleId && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800">
          <span>Resumed Order: {activeHeldReference}</span>
          <span className="text-[11px] font-medium">
            Completing or holding will update this order.
          </span>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN POS BILLING LAYOUT */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(380px,0.8fr)]">
        {/* ================= LEFT COLUMN: PRODUCTS & SEARCH ================= */}
        <div className="space-y-4">
          {/* Search & Barcode Scan Bar */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
              {/* Keyword Search */}
              <div className="relative">
                <Icon
                  name="search"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or category (⌘ K)..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Barcode Scan */}
              <form onSubmit={scan} className="flex gap-2">
                <input
                  ref={barcodeRef}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan Barcode + Enter"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
                <button
                  type="submit"
                  disabled={scanQueue.isProcessing}
                  className="rounded-xl bg-[#FF9F43] px-4 text-xs font-extrabold text-white shadow-2xs hover:bg-[#F38C2A] transition active:scale-95 disabled:opacity-60 cursor-pointer shrink-0"
                >
                  {scanQueue.isProcessing ? "Scanning..." : "Scan"}
                </button>
              </form>
            </div>

            {/* Categories Carousel Pills */}
            <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pt-1">
              <button
                type="button"
                onClick={() => {
                  setCategory("");
                  setPage(1);
                }}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                  !category
                    ? "bg-[#FF9F43] text-white shadow-sm shadow-orange-500/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Categories
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategory(String(c.id));
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                    category === String(c.id)
                      ? "bg-[#FF9F43] text-white shadow-sm shadow-orange-500/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid or Skeletons / Empty State */}
          {error && (
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
              <span>{error}</span>
              <button
                type="button"
                className="underline"
                onClick={() => setRetryKey((v) => v + 1)}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-12">
              <LoadingState label="Loading product catalogue..." />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon="products"
              title="No products found"
              description="Try another keyword or category filter."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={add} />
              ))}
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: CART & CHECKOUT ================= */}
        <aside className="sticky top-20 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43] font-bold text-xs">
                🛒
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1E38]">
                  Order Cart
                </h3>
                <p className="text-[10px] font-semibold text-slate-400">
                  {cart.items.length} item(s) selected
                </p>
              </div>
            </div>

            {cart.items.length > 0 && (
              <button
                type="button"
                onClick={confirmClearCart}
                className="rounded-lg px-2 py-1 text-[11px] font-extrabold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Scrollable Items */}
          <div className="max-h-[35vh] space-y-2.5 overflow-y-auto p-4 bg-slate-50/30">
            {cart.items.length ? (
              cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantity={quantity}
                  onRemove={remove}
                />
              ))
            ) : (
              <div className="grid min-h-36 place-items-center text-center p-4">
                <div>
                  <span className="text-2xl">🛍️</span>
                  <p className="mt-2 text-xs font-bold text-slate-600">
                    Cart is empty
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Click any product to add to cart.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Totals & Discounts Panel */}
          <TotalsPanel
            totals={totals}
            discountType={discountType}
            discountValue={discountValue}
            discountsEnabled={discountSettings.enabled !== false}
            taxLabel={
              taxSettings.enabled
                ? `${taxSettings.name || "Tax"} (${taxSettings.percentage || 0}%)`
                : "Tax Inclusive"
            }
            onDiscountType={(v) => {
              setDiscountType(v);
              setDiscountValue("0");
            }}
            onDiscountValue={(v) => setDiscountValue(v)}
          />

          {/* Payment Method Panel */}
          <PaymentPanel
            values={payment}
            total={totals.grandTotal}
            onChange={(e) =>
              setPayment((old) => ({ ...old, [e.target.name]: e.target.value }))
            }
          />

          {/* Bottom Action Checkout Buttons */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/80 p-4">
            <button
              type="button"
              disabled={!cart.items.length || isSubmitting}
              onClick={holdSale}
              className="rounded-xl border border-slate-200 bg-white py-3 text-xs font-black text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              {activeHeldSaleId ? "Update Hold" : "Hold Order"}
            </button>

            <button
              type="button"
              disabled={!cart.items.length || isSubmitting}
              onClick={complete}
              className="rounded-xl bg-[#FF9F43] py-3 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </aside>
      </div>

      {/* HELD SALES DIALOG */}
      <HeldSalesDialog
        isOpen={heldOpen}
        sales={held.heldSales}
        isLoading={held.loading}
        error={held.error}
        onRetry={() => held.load().catch(() => undefined)}
        onClose={() => setHeldOpen(false)}
        onResume={resume}
        onRemove={async (s) => {
          setHeldOpen(false);
          await held.remove(s.id);
        }}
      />

      {/* SALE SUCCESS RECEIPT MODAL */}
      <SaleSuccessModal
        sale={savedSale}
        isLoadingReceipt={receiptLoading}
        onPrint={openReceipt}
        onViewSale={() => navigate("/sales")}
        onNewSale={newSale}
      />

      {/* RECEIPT PREVIEW MODAL */}
      <ReceiptPreview
        isOpen={receiptOpen}
        receipt={receipt}
        isLoading={false}
        autoPrint={receiptSettings.auto_print}
        onClose={() => setReceiptOpen(false)}
      />

      {/* WEIGHT / CUSTOM AMOUNT MODAL */}
      <AmountWeightModal
        product={amountWeightProduct}
        open={Boolean(amountWeightProduct)}
        onClose={() => setAmountWeightProduct(null)}
        onAdd={addWithQuantity}
      />
    </div>
  );
}

export default PosPage;
