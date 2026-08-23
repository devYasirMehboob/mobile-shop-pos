import { useState } from "react";
import Modal from "../Modal";
import Icon from "../Icon";
import { formatCurrency, formatDateTime } from "../../utils/calculateSaleTotals";
import useSettings from "../../hooks/useSettings";
import useAlert from "../../hooks/useAlert";
import { exportPurchaseToPdf } from "../../utils/pdfExport";

function PurchaseReceiptModal({ isOpen, purchase, onClose, autoPrint = false }) {
  const { settings } = useSettings();
  const alert = useAlert();
  const shop = settings?.shop || {};
  const logo =
    shop.logo ||
    shop.logo_url ||
    settings?.shop?.logo ||
    settings?.shop?.logo_url;
  const [paperFormat, setPaperFormat] = useState("80mm"); // "80mm" or "a4"
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!purchase) return null;

  const items = purchase.items || [];
  const payments = purchase.payments || [];
  const totalQty = items.reduce((acc, i) => acc + (parseFloat(i.quantity) || 1), 0);

  const subtotal = Number(purchase.subtotal || purchase.grand_total || 0);
  const discount = Number(purchase.discount_amount || 0);
  const tax = Number(purchase.tax_amount || 0);
  const shipping = Number(purchase.shipping_amount || 0);
  const other = Number(purchase.other_charges || 0);
  const grandTotal = Number(purchase.grand_total || subtotal - discount + tax + shipping + other);
  const amountPaid = Number(purchase.amount_paid || 0);
  const balanceDue = Number(purchase.balance_due || Math.max(0, grandTotal - amountPaid));

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportPurchaseToPdf(purchase, shop);
      alert.success("Purchase order PDF downloaded!");
    } catch (e) {
      alert.error(e.message || "Failed to export PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Purchase Order Voucher"
      description={`PO: ${purchase.purchase_number || `PUR-${purchase.id}`} · ${purchase.supplier_name || ""}`}
      size={paperFormat === "80mm" ? "md" : "lg"}
      headerActions={
        <div className="no-print flex flex-wrap items-center gap-2">
          {/* Format selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setPaperFormat("80mm")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                paperFormat === "80mm"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              80mm Thermal
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat("a4")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                paperFormat === "a4"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              A4 Invoice
            </button>
          </div>

          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Icon name="download" className="size-3.5 text-[#FF9F43]" />
            <span>{isExportingPdf ? "Saving..." : "PDF"}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 rounded-xl bg-[#0B1E38] px-3 py-1 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition cursor-pointer"
          >
            <Icon name="print" className="size-3.5 text-orange-400" />
            <span>Print Now</span>
          </button>
        </div>
      }
    >
      {/* Printable Thermal Receipt Container */}
      <div className="max-h-[72vh] overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-100/90 p-4 scrollbar-thin">
        <div
          id="printable-purchase"
          className={`mx-auto bg-white p-5 text-slate-900 shadow-xs font-mono text-xs ${
            paperFormat === "80mm"
              ? "max-w-[320px] rounded-lg"
              : "max-w-[560px] rounded-xl font-sans"
          }`}
        >
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              {/* Shop Logo */}
              {logo && (
                <div className="mx-auto mb-2 flex justify-center">
                  <img
                    src={logo}
                    alt={shop.shop_name || "Logo"}
                    className="max-h-16 max-w-[140px] object-contain"
                  />
                </div>
              )}
              <h2 className="text-base font-black uppercase tracking-wider text-black">
                {shop.shop_name || "MOBILE SHOP POS"}
              </h2>
              {shop.address && <p className="text-[11px] text-slate-600">{shop.address}</p>}
              {shop.phone && <p className="text-[11px] text-slate-700 font-bold">Tel: {shop.phone}</p>}
              <div className="pt-1 text-[11px] font-black uppercase text-slate-900">
                *** Purchase Order Voucher ***
              </div>
            </div>

            {/* Meta Info */}
            <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">PO Number:</span>
                <span className="font-bold">{purchase.purchase_number || `PUR-${purchase.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{formatDateTime(purchase.purchase_date || new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier:</span>
                <span className="font-bold text-right">{purchase.supplier_name}</span>
              </div>
              {purchase.supplier_invoice_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor Bill #:</span>
                  <span className="font-bold">{purchase.supplier_invoice_number}</span>
                </div>
              )}
              {purchase.payment_reference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Ref:</span>
                  <span className="font-bold text-blue-700">{purchase.payment_reference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold uppercase">{purchase.purchase_status || "Received"}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="grid grid-cols-12 text-[10px] font-black uppercase text-slate-500 pb-1 border-b border-slate-200">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-2 text-right">Cost</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              <div className="divide-y divide-slate-100 py-1">
                {items.length === 0 ? (
                  <div className="py-3 text-center text-[11px] text-slate-400">No items</div>
                ) : (
                  items.map((i, idx) => (
                    <div key={idx} className="grid grid-cols-12 py-1.5 text-[11px]">
                      <div className="col-span-6 pr-1">
                        <div className="font-bold leading-tight truncate">
                          {i.product_name || `Product #${i.product_id}`}
                        </div>
                        {i.product_code && (
                          <div className="text-[9px] text-slate-400 font-normal">{i.product_code}</div>
                        )}
                        {Number(i.line_discount) > 0 && (
                          <div className="text-[9px] text-rose-600 font-normal">
                            disc: -{formatCurrency(i.line_discount)}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 text-right">{Number(i.quantity)}</div>
                      <div className="col-span-2 text-right">{formatCurrency(i.unit_cost)}</div>
                      <div className="col-span-2 text-right font-bold">
                        {formatCurrency(
                          i.line_total ||
                            Number(i.quantity) * Number(i.unit_cost) -
                              Number(i.line_discount || 0)
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Financial Calculations */}
            <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Items / Qty:</span>
                <span>{items.length} lines ({totalQty} units)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax (GST):</span>
                  <span>+{formatCurrency(tax)}</span>
                </div>
              )}
              {shipping > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping:</span>
                  <span>+{formatCurrency(shipping)}</span>
                </div>
              )}
              {other > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Other Charges:</span>
                  <span>+{formatCurrency(other)}</span>
                </div>
              )}

              <div className="border-t border-slate-300 pt-1 flex justify-between text-sm font-black">
                <span>TOTAL PAYABLE:</span>
                <span className="text-black">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span>{formatCurrency(amountPaid)}</span>
              </div>
              <div
                className={`flex justify-between font-bold ${
                  balanceDue > 0 ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                <span>Balance Due:</span>
                <span>{formatCurrency(balanceDue)}</span>
              </div>
            </div>

            {/* Payments List (if any) */}
            {payments.length > 0 && (
              <div className="py-2 space-y-1 border-b border-dashed border-slate-300 text-[10px]">
                <div className="font-bold uppercase text-slate-500 text-[9px]">Payment Records:</div>
                {payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>
                      {(p.payment_method || "cash").toUpperCase()}{" "}
                      {p.reference_number ? `(${p.reference_number})` : ""}
                    </span>
                    <span className="font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-500 space-y-0.5">
              <p>Generated via Mobile Shop POS</p>
              <p className="text-[9px] text-slate-400">Inventory Procurement Record</p>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

export default PurchaseReceiptModal;
