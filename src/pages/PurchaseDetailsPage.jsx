import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  addPurchasePayment,
  cancelPurchase,
  createPurchaseReturn,
  getPurchase,
  getReturnableItems,
} from "../api/purchasesApi";
import Icon from "../components/Icon";
import LoadingState from "../components/feedback/LoadingState";
import PageErrorState from "../components/feedback/PageErrorState";
import PurchasePaymentDialog from "../components/purchases/PurchasePaymentDialog";
import PurchaseReturnDialog from "../components/purchases/PurchaseReturnDialog";
import PurchaseReceiptModal from "../components/purchases/PurchaseReceiptModal";
import PurchaseStatusBadge from "../components/purchases/PurchaseStatusBadge";
import { formatCurrency, formatDate } from "../utils/calculateSaleTotals";
import { exportPurchaseToPdf } from "../utils/pdfExport";
import usePermissions from "../hooks/usePermissions";
import useSettings from "../hooks/useSettings";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";

function PurchaseDetailsPage() {
  const { id } = useParams();
  const { can } = usePermissions();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const alert = useAlert();
  const confirmDialog = useConfirmation();

  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [payment, setPayment] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [returnData, setReturnData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await getPurchase(id);
      setPurchase(res.purchase || res);
    } catch (e) {
      setPageError(normalizeApiError(e));
    } finally {
      setLoading(false);
    }
  }, [id, reload]);

  useEffect(() => {
    document.title = "Purchase Details | Mobile Shop POS";
    load();
  }, [load]);

  async function handleDownloadPdf() {
    if (!purchase) return;
    setDownloadingPdf(true);
    try {
      await exportPurchaseToPdf(purchase, settings?.shop || {});
      alert.success("Purchase order PDF downloaded!");
    } catch (e) {
      alert.error(normalizeApiError(e).message || "Failed to generate PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function pay(values) {
    setBusy(true);
    try {
      const r = await addPurchasePayment(id, values);
      alert.success(r.message || "Payment recorded.");
      setPayment(false);
      await load();
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function prepareReturn() {
    try {
      setReturnData(await getReturnableItems(id));
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    }
  }

  async function submitReturn(values) {
    setBusy(true);
    try {
      const r = await createPurchaseReturn(values);
      alert.success(r.message || "Purchase return recorded.");
      setReturnData(null);
      await load();
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    const confirmed = await confirmDialog({
      title: "Cancel this purchase?",
      description:
        "Posted stock will be reversed. Payment history remains in the audit trail.",
      confirmText: "Cancel purchase",
      tone: "danger",
      destructive: true,
      requiredText: purchase?.purchase_number,
    });

    if (!confirmed) return;

    const reason = window.prompt("Enter the cancellation reason:");
    if (!reason) return;

    setBusy(true);
    try {
      const r = await cancelPurchase(id, reason);
      alert.success(r.message || "Purchase cancelled.");
      setPurchase(r.data.purchase);
    } catch (e) {
      alert.error(normalizeApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  if (pageError) {
    return <PageErrorState error={pageError} onRetry={() => setReload((v) => v + 1)} />;
  }
  if (loading) return <LoadingState message="Loading purchase details..." />;
  if (!purchase) return <PageErrorState error={{ message: "Purchase not found" }} />;

  const items = purchase.items || [];
  const payments = purchase.payments || [];
  const returns = purchase.returns || [];

  const subtotal = Number(purchase.subtotal || purchase.grand_total || 0);
  const discountAmount = Number(purchase.discount_amount || 0);
  const taxAmount = Number(purchase.tax_amount || 0);
  const shippingAmount = Number(purchase.shipping_amount || 0);
  const otherCharges = Number(purchase.other_charges || 0);
  const grandTotal = Number(purchase.grand_total || subtotal - discountAmount + taxAmount + shippingAmount + otherCharges);
  const amountPaid = Number(purchase.amount_paid || 0);
  const balanceDue = Number(purchase.balance_due || Math.max(0, grandTotal - amountPaid));

  const totalQuantity = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  const totalReturnedValue = returns.reduce((s, r) => s + Number(r.subtotal || 0), 0);
  const totalRefundReceived = returns.reduce((s, r) => s + Number(r.refund_amount || 0), 0);
  const returnedUnits = items.reduce((s, it) => s + Number(it.returned_quantity || 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <header className="no-print flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Link
              to="/purchases"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
            >
              <span>←</span>
              <span>Back to Purchases</span>
            </Link>
            <span className="text-slate-300">•</span>
            <PurchaseStatusBadge status={purchase.purchase_status} />
            <PurchaseStatusBadge status={purchase.payment_status} />
            {returns.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 text-[11px] font-black text-rose-700">
                <Icon name="refresh" className="size-3 text-rose-600" />
                <span>Returned ({returns.length})</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            {purchase.purchase_number || `Purchase #${purchase.id}`}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Supplier: <strong className="text-slate-800">{purchase.supplier_name}</strong> · Date:{" "}
            {formatDate(purchase.purchase_date)}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {purchase.purchase_status === "draft" && can("purchases.update") && (
            <button
              type="button"
              onClick={() => navigate(`/purchases/${id}/edit`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Icon name="edit" className="size-3.5 text-slate-500" />
              <span>Edit Draft</span>
            </button>
          )}

          {balanceDue > 0 &&
            !["draft", "cancelled"].includes(purchase.purchase_status) &&
            can("purchases.pay") && (
              <button
                type="button"
                onClick={() => setPayment(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition cursor-pointer"
              >
                <Icon name="check" className="size-3.5" />
                <span>Add Payment</span>
              </button>
            )}

          {["completed", "received", "partially_returned"].includes(purchase.purchase_status) &&
            can("purchases.return") && (
              <button
                type="button"
                onClick={prepareReturn}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                <Icon name="refresh" className="size-3.5 text-slate-500" />
                <span>Return Items</span>
              </button>
            )}

          {["completed", "received"].includes(purchase.purchase_status) &&
            can("purchases.cancel") && (
              <button
                type="button"
                onClick={cancel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-black text-rose-700 shadow-2xs hover:bg-rose-100 transition cursor-pointer"
              >
                <Icon name="trash" className="size-3.5" />
                <span>Cancel Order</span>
              </button>
            )}

          {/* Download Direct PDF */}
          <button
            type="button"
            disabled={downloadingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            title="Direct PDF Download"
          >
            <Icon name="download" className="size-3.5 text-[#FF9F43]" />
            <span>{downloadingPdf ? "Generating..." : "Download PDF"}</span>
          </button>

          {/* Print Thermal Receipt Modal */}
          <button
            type="button"
            onClick={() => setReceiptOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1E38] px-4 py-2 text-xs font-black text-white shadow-md hover:bg-slate-800 transition cursor-pointer"
          >
            <Icon name="print" className="size-3.5 text-orange-400" />
            <span>Print Receipt</span>
          </button>
        </div>
      </header>

      {/* 2. Top Return Notice Banner */}
      {returns.length > 0 && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-rose-600 text-white font-black text-base shadow-xs">
              ↩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-rose-950 text-sm">
                  Stock Return Processed
                </h3>
                <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[10px] font-black text-rose-800 uppercase tracking-wide">
                  {returns.length} {returns.length === 1 ? "Return Voucher" : "Return Vouchers"}
                </span>
              </div>
              <p className="text-rose-700 text-xs font-medium mt-0.5">
                Total Return Value: <strong className="font-bold text-rose-950 font-mono">{formatCurrency(totalReturnedValue)}</strong>
                {returnedUnits > 0 && <span> · {returnedUnits} Units Dispatched Back</span>}
                {totalRefundReceived > 0 && (
                  <span> · Supplier Refund: <strong className="font-bold text-emerald-800 font-mono">{formatCurrency(totalRefundReceived)}</strong></span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("purchase-returns-section")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-black text-rose-700 shadow-2xs border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition cursor-pointer"
          >
            <span>View Return Details</span>
            <span>↓</span>
          </button>
        </div>
      )}

      {/* 3. Top Metric Cards (KPIs) */}
      <section className={`grid gap-4 sm:grid-cols-2 ${returns.length > 0 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {/* Grand Total */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Total Order Value
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43]">
              <Icon name="shopping-bag" className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-[#0B1E38] font-mono">
            {formatCurrency(grandTotal)}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500">
            Invoice Grand Total
          </div>
        </div>

        {/* Amount Paid */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Amount Paid
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon name="check" className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-600 font-mono">
            {formatCurrency(amountPaid)}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500">
            {payments.length} {payments.length === 1 ? "payment" : "payments"} recorded
          </div>
        </div>

        {/* Balance Due */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Balance Due
            </span>
            <div
              className={`grid size-8 place-items-center rounded-xl ${
                balanceDue > 0
                  ? "bg-rose-50 text-rose-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Icon name="tag" className="size-4" />
            </div>
          </div>
          <div
            className={`mt-2 text-xl font-black font-mono ${
              balanceDue > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {formatCurrency(balanceDue)}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500">
            {balanceDue > 0 ? "Outstanding Vendor Due" : "Fully Settled"}
          </div>
        </div>

        {/* Total Items & Qty */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Purchased Stock
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Icon name="box" className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-[#0B1E38] font-mono">
            {totalQuantity} <span className="text-xs font-bold text-slate-400">Units</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500">
            {items.length} {items.length === 1 ? "line item" : "line items"}
          </div>
        </div>

        {/* 5th KPI: Returned Value (If any) */}
        {returns.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-500">
                Returned Stock
              </span>
              <div className="grid size-8 place-items-center rounded-xl bg-rose-100 text-rose-600">
                <Icon name="refresh" className="size-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black text-rose-700 font-mono">
              {formatCurrency(totalReturnedValue)}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-rose-600">
              {returnedUnits} units in {returns.length} {returns.length === 1 ? "return" : "returns"}
            </div>
          </div>
        )}
      </section>

      {/* 4. Supplier & Invoice Information Card */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Icon name="truck" className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[#0B1E38]">
              Supplier &amp; Procurement Details
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Vendor contacts, billing references, and stock entry metadata.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Supplier Name</span>
            <div className="font-extrabold text-slate-900 text-sm truncate">{purchase.supplier_name}</div>
            {purchase.supplier_phone && (
              <div className="text-[11px] text-slate-500 truncate">📞 {purchase.supplier_phone}</div>
            )}
            {purchase.supplier_address && (
              <div className="text-[11px] text-slate-400 truncate">📍 {purchase.supplier_address}</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Supplier Invoice #</span>
            <div className="font-mono font-extrabold text-slate-900 text-sm truncate">
              {purchase.supplier_invoice_number || "Not provided"}
            </div>
            <div className="text-[11px] text-slate-400">Vendor Bill Reference</div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Purchase Date</span>
            <div className="font-mono font-extrabold text-slate-900 text-sm">
              {formatDate(purchase.purchase_date)}
            </div>
            <div className="text-[11px] text-slate-400">Receipt / Inward Date</div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Payment Reference</span>
            <div className="font-mono font-extrabold text-slate-900 text-sm truncate">
              {purchase.payment_reference || payments[0]?.reference_number ? (
                <span className="rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-xs text-blue-700 font-bold">
                  {purchase.payment_reference || payments[0]?.reference_number}
                </span>
              ) : (
                <span className="text-slate-400 text-xs font-sans font-medium">None</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 capitalize">
              Mode: {(purchase.payment_method || payments[0]?.payment_method || "cash").replaceAll("_", " ")}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Entered By</span>
            <div className="font-extrabold text-slate-900 text-sm truncate">
              {purchase.created_by_name || "Admin"}
            </div>
            <div className="text-[11px] text-slate-400">POS User</div>
          </div>
        </div>

        {purchase.notes && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 text-xs text-amber-900">
            <span className="font-black uppercase text-[10px] text-amber-700 block mb-0.5">
              Internal Notes &amp; Terms:
            </span>
            {purchase.notes}
          </div>
        )}
      </section>

      {/* 4. Itemized Purchase Table */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#FF9F43]">
              <Icon name="box" className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0B1E38]">Purchased Line Items</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Procured products, quantities, costs, discounts, and line totals.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] font-bold text-slate-700">
            {items.length} {items.length === 1 ? "Product" : "Products"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Icon name="box" className="size-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              No line items found in this purchase record (#{purchase.id}).
            </p>
            <p className="mt-1 text-[11px] text-slate-400 max-w-md mx-auto">
              This specific record was created prior to the product_name fix. Create a new purchase to see full live itemized records.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/purchases/new")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-[#F38C2A] transition cursor-pointer"
              >
                <Icon name="plus" className="size-3.5" />
                <span>+ Create New Purchase</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/purchases")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <span>All Purchases</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-50/90 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Line Discount</th>
                  <th className="px-4 py-3 text-right">Returned</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((i, idx) => (
                  <tr key={i.id || idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {i.product_name || `Product #${i.product_id}`}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 font-semibold">
                        {i.product_code || `PRD-${i.product_id}`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {Number(i.quantity)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      {formatCurrency(i.unit_cost)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">
                      {Number(i.line_discount) > 0
                        ? `-${formatCurrency(i.line_discount)}`
                        : "Rs. 0.00"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      {Number(i.returned_quantity || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                      {formatCurrency(i.line_total || Number(i.quantity) * Number(i.unit_cost) - Number(i.line_discount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Payments History & Financial Summary Split */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left: Payment History & Returns */}
        <div className="space-y-5 lg:col-span-7">
          {/* Payments Section */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon name="check" className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0B1E38]">Payment Transactions</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Settlements paid to vendor for this purchase order.
                  </p>
                </div>
              </div>

              {balanceDue > 0 &&
                !["draft", "cancelled"].includes(purchase.purchase_status) &&
                can("purchases.pay") && (
                  <button
                    type="button"
                    onClick={() => setPayment(true)}
                    className="text-xs font-extrabold text-emerald-600 hover:underline cursor-pointer"
                  >
                    + Add Payment
                  </button>
                )}
            </div>

            {payments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No payments have been recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs transition hover:bg-slate-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 capitalize">
                          {(p.payment_method || "cash").replaceAll("_", " ")}
                        </span>
                        {p.reference_number && (
                          <span className="rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 font-mono text-[10px] font-black text-blue-700">
                            Ref: {p.reference_number}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {formatDate(p.payment_date)}
                        {p.notes && ` · ${p.notes}`}
                      </div>
                    </div>
                    <div className="text-right font-mono font-black text-emerald-700 text-sm">
                      {formatCurrency(p.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Returns Section (if any) */}
          {returns.length > 0 && (
            <section id="purchase-returns-section" className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="grid size-8 place-items-center rounded-xl bg-rose-50 text-rose-600">
                  <Icon name="refresh" className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0B1E38]">Purchase Returns</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Stock returns dispatched back to supplier.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {returns.map((r, idx) => (
                  <div
                    key={r.id || idx}
                    className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-rose-900">{r.return_number}</div>
                      <div className="text-[11px] text-rose-500 font-mono">
                        {formatDate(r.return_date)}
                      </div>
                    </div>
                    <div className="text-right font-mono font-black text-rose-700 text-sm">
                      {formatCurrency(r.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: Financial Breakdown Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-[#0B1E38] p-5 sm:p-6 text-white shadow-md lg:col-span-5 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h3 className="text-sm font-black tracking-wide text-white">Financial Summary</h3>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-300">
                PKR
              </span>
            </div>

            <dl className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <dt>Gross Items Subtotal</dt>
                <dd className="font-mono font-bold text-white">{formatCurrency(subtotal)}</dd>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <dt>Invoice Discount</dt>
                  <dd className="font-mono font-bold">-{formatCurrency(discountAmount)}</dd>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-300">
                  <dt>Tax (GST)</dt>
                  <dd className="font-mono font-bold text-white">+{formatCurrency(taxAmount)}</dd>
                </div>
              )}

              {shippingAmount > 0 && (
                <div className="flex justify-between text-slate-300">
                  <dt>Shipping &amp; Freight</dt>
                  <dd className="font-mono font-bold text-white">+{formatCurrency(shippingAmount)}</dd>
                </div>
              )}

              {otherCharges > 0 && (
                <div className="flex justify-between text-slate-300">
                  <dt>Other Expenses</dt>
                  <dd className="font-mono font-bold text-white">+{formatCurrency(otherCharges)}</dd>
                </div>
              )}

              <div className="my-2 border-t border-slate-700/70" />

              <div className="flex items-baseline justify-between pt-1">
                <dt className="text-sm font-black text-white">Total Net Payable</dt>
                <dd className="text-lg font-black text-[#FF9F43] font-mono">
                  {formatCurrency(grandTotal)}
                </dd>
              </div>

              <div className="flex justify-between text-emerald-400 pt-1">
                <dt>Amount Paid</dt>
                <dd className="font-mono font-bold">{formatCurrency(amountPaid)}</dd>
              </div>
            </dl>
          </div>

          {/* Balance Due Status Banner */}
          <div
            className={`rounded-xl p-3.5 text-xs flex items-center justify-between border ${
              balanceDue > 0
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{balanceDue > 0 ? "⚠️" : "✅"}</span>
              <span className="font-bold">
                {balanceDue > 0 ? "Outstanding Balance Due:" : "Fully Paid Settlement"}
              </span>
            </div>
            <span className="font-mono font-extrabold text-sm">
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <PurchasePaymentDialog
        purchase={payment ? purchase : null}
        busy={busy}
        onClose={() => setPayment(false)}
        onSubmit={pay}
      />
      <PurchaseReturnDialog
        data={returnData}
        busy={busy}
        onClose={() => setReturnData(null)}
        onSubmit={submitReturn}
      />
      <PurchaseReceiptModal
        isOpen={receiptOpen}
        purchase={purchase}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
}

export default PurchaseDetailsPage;
