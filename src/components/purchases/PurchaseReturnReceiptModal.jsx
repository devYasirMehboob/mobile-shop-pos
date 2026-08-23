import { useState } from "react";
import Modal from "../Modal";
import Icon from "../Icon";
import { formatCurrency, formatDate } from "../../utils/calculateSaleTotals";
import { exportPurchaseReturnToPdf } from "../../utils/pdfExport";
import useSettings from "../../hooks/useSettings";
import useAlert from "../../hooks/useAlert";

function PurchaseReturnReceiptModal({ isOpen, purchaseReturn, onClose }) {
  const [paperFormat, setPaperFormat] = useState("80mm");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { settings } = useSettings();
  const alert = useAlert();

  if (!isOpen || !purchaseReturn) return null;

  const shop = settings?.shop || {};
  const returnNumber = purchaseReturn.return_number || `PRET-${purchaseReturn.id}`;
  const purchaseNumber = purchaseReturn.purchase_number || (purchaseReturn.purchase_id ? `PUR-${purchaseReturn.purchase_id}` : "N/A");
  const supplierName = purchaseReturn.supplier_name || purchaseReturn.suppliers?.name || "General Supplier";
  const returnDate = purchaseReturn.return_date || purchaseReturn.created_at;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportPurchaseReturnToPdf(purchaseReturn, shop);
      alert.success("Return voucher PDF downloaded!");
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
      title="Purchase Return Voucher"
      description={`Voucher: ${returnNumber} · ${supplierName}`}
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
              A4 Voucher
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
      {/* Printable Thermal Container */}
      <div className="max-h-[72vh] overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-100/90 p-4 scrollbar-thin">
        <div
          id="printable-return"
          className={`mx-auto bg-white p-5 text-slate-900 shadow-xs font-mono text-xs ${
            paperFormat === "80mm"
              ? "max-w-[320px] rounded-lg"
              : "max-w-[560px] rounded-xl font-sans"
          }`}
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            {/* Shop Logo */}
            {(shop.logo || shop.logo_url) && (
              <div className="flex justify-center pb-1">
                <img
                  src={shop.logo || shop.logo_url}
                  alt={shop.shop_name || "Shop Logo"}
                  className="max-h-12 max-w-[120px] object-contain"
                />
              </div>
            )}
            <h2 className="text-sm font-black uppercase text-slate-900 font-sans tracking-wide">
              {shop.shop_name || "MOBILE SHOP POS"}
            </h2>
            {shop.address && (
              <p className="text-[10px] text-slate-600 font-sans">{shop.address}</p>
            )}
            {shop.phone && (
              <p className="text-[10px] text-slate-600 font-mono">Tel: {shop.phone}</p>
            )}
            <div className="pt-1 text-[11px] font-black uppercase text-rose-700">
              *** PURCHASE RETURN VOUCHER ***
            </div>
          </div>

          {/* Meta Info */}
          <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Return #:</span>
              <span className="font-bold text-rose-700">{returnNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Original PO:</span>
              <span className="font-bold text-slate-900">{purchaseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="font-medium text-slate-800">{formatDate(returnDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Supplier:</span>
              <span className="font-bold text-slate-900">{supplierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold uppercase text-emerald-700">
                {purchaseReturn.status || "COMPLETED"}
              </span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="py-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-800 font-bold">
              <span>Total Return Value:</span>
              <span className="text-rose-600 font-black">
                {formatCurrency(purchaseReturn.subtotal)}
              </span>
            </div>
            {Number(purchaseReturn.refund_amount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Refund Received:</span>
                <span>+{formatCurrency(purchaseReturn.refund_amount)}</span>
              </div>
            )}
            {Number(purchaseReturn.balance_adjustment) > 0 && (
              <div className="flex justify-between text-blue-700 font-bold">
                <span>Due Balance Adjusted:</span>
                <span>+{formatCurrency(purchaseReturn.balance_adjustment)}</span>
              </div>
            )}
          </div>

          {/* Reason Section */}
          {purchaseReturn.reason && (
            <div className="py-2 border-t border-dashed border-slate-300 text-[10px]">
              <span className="font-bold uppercase text-slate-500">Reason:</span>
              <p className="mt-0.5 text-slate-700 italic">{purchaseReturn.reason}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 space-y-0.5">
            <p className="font-bold">*** Stock Dispatched to Supplier ***</p>
            <p className="text-[9px] text-slate-400">Inventory Return Record</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default PurchaseReturnReceiptModal;
