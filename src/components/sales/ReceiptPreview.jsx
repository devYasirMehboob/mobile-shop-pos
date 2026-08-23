import { useEffect, useState } from "react";
import Modal from "../Modal";
import LoadingState from "../LoadingState";
import {
  formatCurrency,
  formatDateTime,
} from "../../utils/calculateSaleTotals";
import useSettings from "../../hooks/useSettings";
import useAlert from "../../hooks/useAlert";
import { exportReceiptToPdf } from "../../utils/pdfExport";

const shopImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return url;
};

function ReceiptPreview({
  isOpen,
  receipt,
  isLoading,
  onClose,
  autoPrint = false,
}) {
  const { settings } = useSettings();
  const alert = useAlert();
  const options = receipt?.options || settings?.receipt || {};
  const shop = receipt?.shop || settings?.shop || {};
  const logo =
    shop.logo ||
    shop.logo_url ||
    settings?.shop?.logo ||
    settings?.shop?.logo_url;
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const sale = receipt?.sale || {};
  const items = Array.isArray(sale.items) ? sale.items : [];
  const totalQty = items.reduce(
    (acc, i) =>
      acc +
      (parseFloat(i.quantity_entered || i.quantity || i.cartQuantity) || 1),
    0,
  );

  const handlePrint = async () => {
    const printingMethod = settings?.printer?.printing_method || "browser";

    if (printingMethod === "qz") {
      const printerName = settings?.printer?.printer_name;
      if (!printerName) {
        alert.error(
          "Receipt printer name is not configured in settings. Please configure it in Settings > Printer.",
        );
        return;
      }

      try {
        setIsPrinting(true);
        const html = document.getElementById("printable-receipt").outerHTML;
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${sale.invoice_number || receipt?.invoice_number || "Sale"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace, sans-serif; background: #fff; color: #000; font-size: 12px; line-height: 1.35; }
    .receipt-container { width: 100%; max-width: 76mm; margin: 0 auto; padding: 6px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .divider-double { border-top: 2px solid #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2px 0; }
    .mono { font-family: "Courier New", Courier, monospace; }
  </style>
</head>
<body>${html}</body>
</html>`;

        const { printHtmlViaQZ } = await import("../../utils/qzService");
        await printHtmlViaQZ(printerName, fullHtml);
      } catch (err) {
        alert.error(
          "Failed to print via QZ Tray: " + (err.message || "Unknown error"),
        );
      } finally {
        setIsPrinting(false);
      }
    } else {
      window.print();
    }
  };

  const handleSavePdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportReceiptToPdf(
        receipt,
        sale.invoice_number ||
          receipt?.invoice_number ||
          `Receipt-${sale.id || "Sale"}`,
      );
      alert.success("Receipt PDF downloaded successfully.");
    } catch (err) {
      alert.error(
        "Failed to generate PDF: " + (err.message || "Unknown error"),
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  useEffect(() => {
    if (isOpen && receipt && autoPrint) {
      const timer = setTimeout(() => handlePrint(), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, receipt, autoPrint]);

  return (
    <Modal
      isOpen={isOpen}
      title="Receipt Preview"
      description={`80mm Thermal Receipt • ${sale.invoice_number || receipt?.invoice_number || ""}`}
      onClose={onClose}
      size="sm"
      headerActions={
        <div className="no-print flex items-center gap-2">
          <button
            type="button"
            onClick={handleSavePdf}
            disabled={isPrinting || isExportingPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100/90 px-3 py-1.5 text-xs font-black text-slate-800 shadow-2xs hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            <span>{isExportingPdf ? "Downloading..." : "📥 Download"}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting || isExportingPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition cursor-pointer disabled:opacity-50"
          >
            <span>🖨️ {isPrinting ? "Printing..." : "Print"}</span>
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12">
          <LoadingState label="Preparing receipt preview..." />
        </div>
      ) : (
        receipt && (
          <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-5 scrollbar-thin">
            {/* Printable Receipt Paper Canvas */}
            <article
              id="printable-receipt"
              dir="ltr"
              className="receipt-content mx-auto w-full max-w-[320px] rounded-xl border border-slate-300/80 bg-white p-5 text-xs text-slate-950 font-sans shadow-sm print:m-0 print:w-full print:max-w-none print:border-none print:p-0 print:shadow-none"
            >
              <style>{`
                @media print {
                  @page { margin: 0; size: ${options.paper_width === "58mm" ? "58mm auto" : "80mm auto"}; }
                  body { margin: 0; padding: 0; background: #fff !important; color: #000 !important; font-family: monospace, sans-serif !important; }
                  .no-print { display: none !important; }
                  .receipt-content { width: 100% !important; max-width: 100% !important; border: none !important; box-shadow: none !important; padding: 4px !important; }
                }
              `}</style>

              {/* 1. SHOP HEADER & LOGO */}
              <header className="text-center space-y-1">
                {(receipt.is_offline ||
                  receipt.offline_watermark ||
                  sale.is_offline) && (
                  <div className="mb-2 rounded border border-dashed border-red-500 bg-red-50 p-1 text-center text-[10px] font-black text-red-700 uppercase tracking-widest">
                    *** Offline Sale — Pending Sync ***
                  </div>
                )}

                {/* Shop Logo */}
                {options.show_logo !== false && logo && (
                  <div className="mx-auto mb-2 flex justify-center">
                    <img
                      src={shopImageUrl(logo)}
                      alt="Logo"
                      className="max-h-14 max-w-[120px] object-contain"
                    />
                  </div>
                )}

                {/* Shop Name */}
                <h2 className="text-base font-black tracking-tight text-black uppercase">
                  {shop.shop_name || "Mobile Shop POS"}
                </h2>

                {/* Shop Contact Details */}
                {shop.address && (
                  <p className="text-[11px] font-medium text-slate-700 leading-tight">
                    {shop.address}
                  </p>
                )}
                {options.show_phone !== false && shop.phone && (
                  <p className="text-[11px] font-semibold text-slate-800 tracking-wide font-mono">
                    Tel: {shop.phone}
                  </p>
                )}
                {shop.registration_number && (
                  <p className="text-[10px] font-medium text-slate-500 uppercase font-mono">
                    Reg / NTN: {shop.registration_number}
                  </p>
                )}
              </header>

              {/* Top Double Line Separator */}
              <div className="my-2.5 border-t-2 border-slate-900 border-dashed" />

              {/* 2. INVOICE META DATA */}
              <div className="space-y-1 text-[11px] font-medium text-slate-800">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-600">INVOICE:</span>
                  <span className="font-mono text-black text-xs font-black">
                    {sale.invoice_number ||
                      receipt.invoice_number ||
                      `INV-${sale.id}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-mono text-slate-900">
                    {formatDateTime(
                      sale.created_at || new Date().toISOString(),
                    )}
                  </span>
                </div>
                {options.show_cashier !== false && sale.cashier_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Cashier:</span>
                    <span className="font-semibold text-slate-900">
                      {sale.cashier_name}
                    </span>
                  </div>
                )}
                {options.show_customer !== false &&
                  (sale.customer_name || sale.customer_phone) && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[170px]">
                        {sale.customer_name || "Walk-in Customer"}
                        {sale.customer_phone ? ` (${sale.customer_phone})` : ""}
                      </span>
                    </div>
                  )}
              </div>

              {/* Status Banner (if not completed) */}
              {sale.status && sale.status !== "completed" && (
                <div className="my-2 rounded border border-black bg-slate-100 py-1 text-center text-xs font-black uppercase tracking-wider">
                  *** {sale.status} ***
                </div>
              )}

              {/* Table Separator */}
              <div className="my-2.5 border-t border-slate-900 border-dashed" />

              {/* 3. ITEMIZED SALE TABLE */}
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 border-dashed text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    <th className="pb-1 text-left">ITEM</th>
                    <th className="pb-1 text-center w-12">QTY</th>
                    <th className="pb-1 text-right w-16">PRICE</th>
                    <th className="pb-1 text-right w-20">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 divide-dashed font-medium">
                  {items.map((item, idx) => {
                    const qty =
                      parseFloat(
                        item.quantity_entered ||
                          item.quantity ||
                          item.cartQuantity,
                      ) || 1;
                    const price =
                      parseFloat(
                        item.unit_price || item.selling_price || item.price,
                      ) || 0;
                    const lineTotal =
                      parseFloat(item.line_total) || qty * price;

                    return (
                      <tr key={item.id || idx} className="align-top">
                        <td className="py-1.5 pr-1">
                          <p className="font-bold text-slate-950 leading-snug">
                            {item.product_name || item.name}
                          </p>
                          {item.product_code && (
                            <span className="block text-[9px] font-mono text-slate-400">
                              #{item.product_code}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 text-center font-mono font-bold text-slate-900">
                          {qty}
                        </td>
                        <td className="py-1.5 text-right font-mono text-slate-700">
                          {formatCurrency(price)}
                        </td>
                        <td className="py-1.5 text-right font-mono font-bold text-slate-950">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Financial Totals Separator */}
              <div className="my-2.5 border-t border-slate-900 border-dashed" />

              {/* 4. TOTALS & PAYMENT SUMMARY */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(sale.subtotal)}
                  </span>
                </div>

                {options.show_discount !== false &&
                  Number(sale.discount_amount) > 0 && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Discount:</span>
                      <span className="font-mono text-rose-600 font-bold">
                        -{formatCurrency(sale.discount_amount)}
                      </span>
                    </div>
                  )}

                {options.show_tax !== false && Number(sale.tax_amount) > 0 && (
                  <div className="flex justify-between items-center text-slate-700">
                    <span>{options.tax_name || "Tax (GST)"}:</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(sale.tax_amount)}
                    </span>
                  </div>
                )}

                {/* Big Grand Total Box */}
                <div className="my-2 border-y-2 border-slate-950 py-1.5 flex justify-between items-center">
                  <span className="text-sm font-black text-black uppercase tracking-wide">
                    TOTAL PAYABLE:
                  </span>
                  <span className="text-base font-black font-mono text-black">
                    {formatCurrency(sale.grand_total)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-800 pt-0.5">
                  <span className="text-slate-600">Amount Received:</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(sale.amount_received ?? sale.grand_total)}
                  </span>
                </div>

                {options.show_change !== false && (
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="text-slate-600">Change Returned:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(sale.change_returned || 0)}
                    </span>
                  </div>
                )}

                {options.show_payment_method !== false && (
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="text-slate-600">Payment Method:</span>
                    <span className="font-bold uppercase tracking-wider">
                      {(sale.payment_method || "cash").replaceAll("_", " ")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                  <span>Total Quantity Sold:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {totalQty} Pcs ({items.length} Products)
                  </span>
                </div>
              </div>

              {/* Bottom Separator */}
              <div className="my-3 border-t-2 border-slate-900 border-dashed" />

              {/* 5. FOOTER MESSAGES & BARCODE */}
              <footer className="text-center space-y-1.5 pt-0.5">
                <p className="text-[11px] font-bold text-slate-900">
                  {shop.receipt_footer ||
                    "Thank you for shopping with us! Please visit again."}
                </p>

                {shop.return_policy && (
                  <p className="text-[10px] font-medium text-slate-500 leading-tight">
                    * {shop.return_policy}
                  </p>
                )}
              </footer>
            </article>
          </div>
        )
      )}
    </Modal>
  );
}

export default ReceiptPreview;
