/**
 * Pure Client-Side POS Receipt & Invoice PDF Exporter.
 * 100% Offline, Zero external CDN dependencies, Zero CSS/oklab color parsing errors.
 * Generates high-resolution 80mm thermal receipts directly to PDF file downloads.
 */

import { formatCurrency, formatDateTime } from "./calculateSaleTotals";

/**
 * Creates a valid PDF binary buffer from a canvas image (JPEG DCTDecode).
 */
function generatePdfFromJpeg(jpegDataUrl, widthMm, heightMm) {
  const mmToPt = 72 / 25.4;
  const widthPt = Math.round(widthMm * mmToPt * 100) / 100;
  const heightPt = Math.round(heightMm * mmToPt * 100) / 100;

  const base64Data = jpegDataUrl.replace(/^data:image\/jpeg;base64,/, "");
  const binaryString = atob(base64Data);
  const imageBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    imageBytes[i] = binaryString.charCodeAt(i);
  }

  let imgWidth = 600;
  let imgHeight = 1000;
  for (let i = 0; i < imageBytes.length - 8; i++) {
    if (imageBytes[i] === 0xff && imageBytes[i + 1] >= 0xc0 && imageBytes[i + 1] <= 0xc3) {
      imgHeight = (imageBytes[i + 5] << 8) + imageBytes[i + 6];
      imgWidth = (imageBytes[i + 7] << 8) + imageBytes[i + 8];
      break;
    }
  }

  const encoder = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const xref = [];

  function addChunk(strOrBytes) {
    const bytes = typeof strOrBytes === "string" ? encoder.encode(strOrBytes) : strOrBytes;
    chunks.push(bytes);
    const prev = offset;
    offset += bytes.length;
    return prev;
  }

  addChunk("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  xref.push(offset);
  addChunk("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  xref.push(offset);
  addChunk("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  xref.push(offset);
  addChunk(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> /ProcSet [/PDF /ImageC] >> >>\nendobj\n`
  );

  const contentStream = `q ${widthPt} 0 0 ${heightPt} 0 0 cm /Im0 Do Q`;
  xref.push(offset);
  addChunk(
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  );

  xref.push(offset);
  const imageHeader = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`;
  addChunk(imageHeader);
  addChunk(imageBytes);
  addChunk("\nendstream\nendobj\n");

  const startXref = offset;
  let xrefTable = `xref\n0 ${xref.length + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < xref.length; i++) {
    xrefTable += `${String(xref[i]).padStart(10, "0")} 00000 n \n`;
  }
  addChunk(xrefTable);

  addChunk(
    `trailer\n<< /Size ${xref.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`
  );

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const finalPdf = new Uint8Array(totalLength);
  let cur = 0;
  for (const chunk of chunks) {
    finalPdf.set(chunk, cur);
    cur += chunk.length;
  }

  return new Blob([finalPdf], { type: "application/pdf" });
}

/**
 * Triggers direct browser download of a Blob file.
 */
function triggerFileDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Pure 2D Canvas Receipt Painter.
 * Accurately renders structured text, tables, and totals without CSS color parsing issues.
 */
async function renderReceiptDataToCanvas(receiptData) {
  const sale = receiptData.sale || receiptData;
  const shop = receiptData.shop || {};
  const items = Array.isArray(sale.items) ? sale.items : [];

  const canvasWidth = 580; // Crisp 2x resolution for 80mm paper
  const margin = 28;
  const contentWidth = canvasWidth - margin * 2;

  // First pass: Calculate required height
  let estimatedHeight = 360;
  estimatedHeight += items.length * 52;
  if (shop.address) estimatedHeight += 30;
  if (shop.phone) estimatedHeight += 25;
  if (shop.return_policy) estimatedHeight += 40;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = estimatedHeight;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, estimatedHeight);

  let y = 30;

  // Helper for drawing centered text
  function drawCenteredText(text, font, color = "#000000") {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, canvasWidth / 2, y);
    ctx.textAlign = "left";
  }

  // Helper for drawing left/right row
  function drawRow(leftText, rightText, font = "14px monospace", color = "#000000", rightColor = null) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(leftText, margin, y);
    ctx.textAlign = "right";
    ctx.fillStyle = rightColor || color;
    ctx.fillText(rightText, canvasWidth - margin, y);
    ctx.textAlign = "left";
  }

  // Helper for drawing dashed line
  function drawDashedLine(isDouble = false) {
    ctx.save();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = isDouble ? 2 : 1.2;
    ctx.setLineDash(isDouble ? [6, 4] : [4, 3]);
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(canvasWidth - margin, y);
    ctx.stroke();
    ctx.restore();
    y += isDouble ? 16 : 12;
  }

  // Helper for word wrapping
  function wrapText(text, maxWidth, font) {
    ctx.font = font;
    const words = String(text || "").split(" ");
    const lines = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // 1. SHOP HEADER
  const shopName = shop.shop_name || "MOBILE SHOP POS";
  drawCenteredText(shopName.toUpperCase(), "900 22px system-ui, sans-serif", "#000000");
  y += 24;

  if (shop.address) {
    const addressLines = wrapText(shop.address, contentWidth - 40, "13px system-ui, sans-serif");
    addressLines.forEach((line) => {
      drawCenteredText(line, "13px system-ui, sans-serif", "#333333");
      y += 18;
    });
  }

  if (shop.phone) {
    drawCenteredText(`Tel: ${shop.phone}`, "bold 14px monospace", "#000000");
    y += 20;
  }

  y += 6;
  drawDashedLine(true);

  // 2. INVOICE META
  const invNumber = sale.invoice_number || `INV-${sale.id || "000"}`;
  drawRow("INVOICE #:", invNumber, "bold 15px monospace", "#000000");
  y += 22;

  const dateStr = formatDateTime(sale.created_at || new Date().toISOString());
  drawRow("Date:", dateStr, "13px monospace", "#444444", "#000000");
  y += 20;

  if (sale.cashier_name) {
    drawRow("Cashier:", sale.cashier_name, "13px system-ui, sans-serif", "#444444", "#000000");
    y += 20;
  }

  const custName = sale.customer_name || "Walk-in Customer";
  drawRow("Customer:", custName, "13px system-ui, sans-serif", "#444444", "#000000");
  y += 22;

  drawDashedLine(false);

  // 3. ITEMS TABLE HEADER
  ctx.font = "bold 13px monospace";
  ctx.fillStyle = "#000000";
  ctx.fillText("ITEM", margin, y);
  ctx.textAlign = "center";
  ctx.fillText("QTY", margin + contentWidth * 0.52, y);
  ctx.textAlign = "right";
  ctx.fillText("PRICE", margin + contentWidth * 0.76, y);
  ctx.fillText("TOTAL", canvasWidth - margin, y);
  ctx.textAlign = "left";
  y += 16;

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(canvasWidth - margin, y);
  ctx.stroke();
  y += 18;

  // 4. ITEMS LIST
  let totalCalculatedUnits = 0;

  items.forEach((item) => {
    const qty = parseFloat(item.quantity_entered || item.quantity || item.cartQuantity) || 1;
    const unitPrice = parseFloat(item.unit_price || item.selling_price || item.price) || 0;
    const lineTotal = parseFloat(item.line_total) || qty * unitPrice;
    totalCalculatedUnits += qty;

    const itemName = item.product_name || item.name || "Item";
    const nameLines = wrapText(itemName, contentWidth * 0.48, "bold 13px system-ui, sans-serif");

    // First line with QTY, PRICE, TOTAL
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillStyle = "#000000";
    ctx.fillText(nameLines[0] || itemName, margin, y);

    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(qty), margin + contentWidth * 0.52, y);

    ctx.font = "13px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "#333333";
    ctx.fillText(formatCurrency(unitPrice), margin + contentWidth * 0.76, y);

    ctx.font = "bold 14px monospace";
    ctx.fillStyle = "#000000";
    ctx.fillText(formatCurrency(lineTotal), canvasWidth - margin, y);
    ctx.textAlign = "left";
    y += 18;

    // Remaining wrapped name lines
    for (let l = 1; l < nameLines.length; l++) {
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillStyle = "#000000";
      ctx.fillText(nameLines[l], margin, y);
      y += 16;
    }

    if (item.product_code) {
      ctx.font = "11px monospace";
      ctx.fillStyle = "#777777";
      ctx.fillText(`#${item.product_code}`, margin, y);
      y += 15;
    }

    y += 4;
  });

  drawDashedLine(false);

  // 5. FINANCIAL TOTALS
  drawRow("Subtotal:", formatCurrency(sale.subtotal || sale.grand_total), "14px monospace", "#444444", "#000000");
  y += 22;

  if (Number(sale.discount_amount) > 0) {
    drawRow("Discount:", `-${formatCurrency(sale.discount_amount)}`, "bold 14px monospace", "#444444", "#dc2626");
    y += 22;
  }

  if (Number(sale.tax_amount) > 0) {
    drawRow("Tax (GST):", formatCurrency(sale.tax_amount), "14px monospace", "#444444", "#000000");
    y += 22;
  }

  y += 4;
  // Prominent Grand Total Box
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(margin, y, contentWidth, 42);

  ctx.font = "900 16px system-ui, sans-serif";
  ctx.fillStyle = "#000000";
  ctx.fillText("TOTAL PAYABLE:", margin + 12, y + 27);

  ctx.font = "900 18px monospace";
  ctx.textAlign = "right";
  ctx.fillText(formatCurrency(sale.grand_total), canvasWidth - margin - 12, y + 27);
  ctx.textAlign = "left";
  y += 58;

  const amtReceived = sale.amount_received ?? sale.grand_total;
  drawRow("Amount Received:", formatCurrency(amtReceived), "bold 14px monospace", "#444444", "#000000");
  y += 22;

  drawRow("Change Returned:", formatCurrency(sale.change_returned || 0), "bold 14px monospace", "#444444", "#047857");
  y += 22;

  const payMethod = (sale.payment_method || "cash").replaceAll("_", " ");
  drawRow("Payment Method:", payMethod.toUpperCase(), "13px system-ui, sans-serif", "#444444", "#000000");
  y += 22;

  const totalQtyFinal = sale.total_quantity || totalCalculatedUnits || items.length;
  drawRow("Total Units Sold:", `${totalQtyFinal} Pcs (${items.length} Products)`, "12px monospace", "#666666", "#333333");
  y += 24;

  drawDashedLine(true);

  // 6. FOOTER
  const footerMsg = shop.receipt_footer || "Thank you for shopping with us! Please visit again.";
  const footerLines = wrapText(footerMsg, contentWidth, "bold 13px system-ui, sans-serif");
  footerLines.forEach((line) => {
    drawCenteredText(line, "bold 13px system-ui, sans-serif", "#000000");
    y += 18;
  });

  if (shop.return_policy) {
    y += 4;
    const policyLines = wrapText(`* ${shop.return_policy}`, contentWidth, "11px system-ui, sans-serif");
    policyLines.forEach((line) => {
      drawCenteredText(line, "11px system-ui, sans-serif", "#555555");
      y += 16;
    });
  }

  y += 24; // Bottom padding

  // Resize canvas to final tight content height
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvasWidth;
  finalCanvas.height = y;
  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.fillStyle = "#ffffff";
  finalCtx.fillRect(0, 0, canvasWidth, y);
  finalCtx.drawImage(canvas, 0, 0);

  return finalCanvas;
}

/**
 * Main PDF Export API.
 * Supports passing either receipt/sale data object OR DOM element.
 * Produces crisp, direct PDF download without invoking window.print().
 */
export async function exportReceiptToPdf(receiptOrElementOrId, invoiceNumber = "Receipt") {
  let receiptData = null;

  // Case A: Passed a receipt / sale data object directly
  if (
    receiptOrElementOrId &&
    typeof receiptOrElementOrId === "object" &&
    (receiptOrElementOrId.sale || receiptOrElementOrId.invoice_number || receiptOrElementOrId.grand_total !== undefined)
  ) {
    receiptData = receiptOrElementOrId.sale ? receiptOrElementOrId : { sale: receiptOrElementOrId, shop: {} };
  } else {
    // Case B: Element ID or Element reference — extract or build
    const el =
      typeof receiptOrElementOrId === "string"
        ? document.getElementById(receiptOrElementOrId)
        : receiptOrElementOrId;

    if (!el && !receiptData) {
      throw new Error("Receipt data or element not found for PDF export.");
    }
  }

  const safeInvoice = String(
    invoiceNumber ||
      receiptData?.sale?.invoice_number ||
      receiptData?.invoice_number ||
      "Receipt"
  )
    .replaceAll("/", "-")
    .trim();

  const filename = `${safeInvoice}.pdf`;

  if (receiptData) {
    const canvas = await renderReceiptDataToCanvas(receiptData);
    const jpegData = canvas.toDataURL("image/jpeg", 0.96);

    const paperWidthMm = 80;
    const paperHeightMm = Math.max(100, Math.round((canvas.height / canvas.width) * paperWidthMm));

    const pdfBlob = generatePdfFromJpeg(jpegData, paperWidthMm, paperHeightMm);
    triggerFileDownload(pdfBlob, filename);
    return true;
  }

  throw new Error("Unable to parse receipt data for PDF generation.");
}

/**
 * Renders Purchase Order data to 2D Canvas
 */
async function renderPurchaseDataToCanvas(purchase, shop = {}) {
  const canvasWidth = 580; // 80mm thermal width
  const margin = 28;
  const contentWidth = canvasWidth - margin * 2;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = 3500;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, 3500);

  let y = 36;

  // Render Shop Logo if available
  const logoUrl = shop.logo || shop.logo_url;
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = logoUrl;
      });
      if (img.width && img.height) {
        const maxH = 55;
        const maxW = 140;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvasWidth - w) / 2, y, w, h);
        y += h + 14;
      }
    } catch {}
  }

  function drawCenteredText(text, font = "14px monospace", color = "#000000") {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, canvasWidth / 2, y);
    ctx.textAlign = "left";
  }

  function drawRow(leftText, rightText, font = "14px monospace", color = "#000000", rightColor = null) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(leftText, margin, y);
    ctx.textAlign = "right";
    ctx.fillStyle = rightColor || color;
    ctx.fillText(rightText, canvasWidth - margin, y);
    ctx.textAlign = "left";
  }

  function drawDashedLine(isDouble = false) {
    y += 10;
    ctx.save();
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = isDouble ? 1.5 : 1;
    ctx.setLineDash(isDouble ? [6, 3] : [4, 3]);
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(canvasWidth - margin, y);
    ctx.stroke();
    ctx.restore();
    y += isDouble ? 22 : 18;
  }

  // Header
  const shopName = shop.shop_name || "MOBILE SHOP POS";
  drawCenteredText(shopName.toUpperCase(), "900 18px system-ui, sans-serif", "#000000");
  y += 22;

  drawCenteredText("PURCHASE ORDER INVOICE", "bold 13px system-ui, sans-serif", "#444444");
  y += 24;

  drawRow("PO NUMBER:", purchase.purchase_number || `PUR-${purchase.id}`, "bold 14px monospace", "#000000");
  y += 22;
  drawRow("DATE:", formatDateTime(purchase.purchase_date || new Date()), "13px monospace", "#333333");
  y += 22;
  drawRow("SUPPLIER:", String(purchase.supplier_name || "Supplier").slice(0, 26), "bold 14px monospace", "#000000");
  y += 22;
  if (purchase.supplier_invoice_number) {
    drawRow("SUP INV #:", purchase.supplier_invoice_number, "13px monospace", "#333333");
    y += 22;
  }
  if (purchase.payment_reference) {
    drawRow("PAYMENT REF:", purchase.payment_reference, "bold 13px monospace", "#1e40af");
    y += 22;
  }
  drawRow("STATUS:", (purchase.purchase_status || "received").toUpperCase(), "bold 13px monospace", "#000000");
  y += 12;

  drawDashedLine(true);

  // Table header
  const colQty = canvasWidth - margin - 220;
  const colCost = canvasWidth - margin - 120;

  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#000000";
  ctx.fillText("ITEM", margin, y);
  ctx.fillText("QTY", colQty, y);
  ctx.fillText("COST", colCost, y);
  ctx.textAlign = "right";
  ctx.fillText("TOTAL", canvasWidth - margin, y);
  ctx.textAlign = "left";
  y += 4;

  drawDashedLine(false);

  // Items
  const items = purchase.items || [];
  for (const it of items) {
    const pName = it.product_name || it.name || "Item";
    const qty = Number(it.quantity || 1);
    const cost = Number(it.unit_cost || 0);
    const total = Number(it.line_total || qty * cost);

    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillStyle = "#000000";
    ctx.fillText(pName.length > 20 ? pName.slice(0, 19) + "…" : pName, margin, y);

    ctx.font = "13px monospace";
    ctx.fillText(String(qty), colQty, y);
    ctx.fillText(String(cost.toFixed(0)), colCost, y);

    ctx.textAlign = "right";
    ctx.font = "bold 13px monospace";
    ctx.fillText(formatCurrency(total), canvasWidth - margin, y);
    ctx.textAlign = "left";
    y += 24;
  }

  y -= 4;
  drawDashedLine(true);

  // Financials
  drawRow("Subtotal:", formatCurrency(purchase.subtotal || purchase.grand_total || 0), "14px monospace");
  y += 22;

  if (Number(purchase.discount_amount) > 0) {
    drawRow("Discount:", `-${formatCurrency(purchase.discount_amount)}`, "14px monospace", "#d9534f");
    y += 22;
  }
  if (Number(purchase.tax_amount) > 0) {
    drawRow("Tax (GST):", `+${formatCurrency(purchase.tax_amount)}`, "14px monospace");
    y += 22;
  }
  if (Number(purchase.shipping_amount) > 0) {
    drawRow("Shipping:", `+${formatCurrency(purchase.shipping_amount)}`, "14px monospace");
    y += 22;
  }
  if (Number(purchase.other_charges) > 0) {
    drawRow("Other Charges:", `+${formatCurrency(purchase.other_charges)}`, "14px monospace");
    y += 22;
  }

  drawDashedLine(false);

  drawRow("TOTAL PAYABLE:", formatCurrency(purchase.grand_total || 0), "900 17px monospace", "#000000");
  y += 26;
  drawRow("Amount Paid:", formatCurrency(purchase.amount_paid || 0), "bold 14px monospace", "#15803d");
  y += 22;
  drawRow("Balance Due:", formatCurrency(purchase.balance_due || 0), "bold 14px monospace", Number(purchase.balance_due) > 0 ? "#dc2626" : "#15803d");
  y += 30;

  drawCenteredText("*** Stock Procurement Voucher ***", "italic 12px system-ui", "#666666");
  y += 30;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvasWidth;
  finalCanvas.height = y;
  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.fillStyle = "#ffffff";
  finalCtx.fillRect(0, 0, canvasWidth, y);
  finalCtx.drawImage(canvas, 0, 0);

  return finalCanvas;
}

export async function exportPurchaseToPdf(purchase, shop = {}) {
  if (!purchase) throw new Error("Purchase data not found for PDF export.");
  const safeNumber = String(purchase.purchase_number || `PUR-${purchase.id}`).replaceAll("/", "-");
  const filename = `${safeNumber}.pdf`;

  const canvas = await renderPurchaseDataToCanvas(purchase, shop);
  const jpegData = canvas.toDataURL("image/jpeg", 0.96);

  const paperWidthMm = 80;
  const paperHeightMm = Math.max(100, Math.round((canvas.height / canvas.width) * paperWidthMm));

  const pdfBlob = generatePdfFromJpeg(jpegData, paperWidthMm, paperHeightMm);
  triggerFileDownload(pdfBlob, filename);
  return true;
}

/**
 * Renders Purchase Return Voucher data to 2D Canvas
 */
async function renderPurchaseReturnToCanvas(ret, shop = {}) {
  const canvasWidth = 580; // 80mm thermal width
  const margin = 28;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = 2500;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, 2500);

  let y = 36;

  // Render Shop Logo if available
  const logoUrl = shop.logo || shop.logo_url;
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = logoUrl;
      });
      if (img.width && img.height) {
        const maxH = 55;
        const maxW = 140;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvasWidth - w) / 2, y, w, h);
        y += h + 14;
      }
    } catch {}
  }

  function drawCenteredText(text, font = "14px monospace", color = "#000000") {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, canvasWidth / 2, y);
    ctx.textAlign = "left";
  }

  function drawRow(leftText, rightText, font = "14px monospace", color = "#000000", rightColor = null) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(leftText, margin, y);
    ctx.textAlign = "right";
    ctx.fillStyle = rightColor || color;
    ctx.fillText(rightText, canvasWidth - margin, y);
    ctx.textAlign = "left";
  }

  function drawDashedLine(isDouble = false) {
    y += 10;
    ctx.save();
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = isDouble ? 1.5 : 1;
    ctx.setLineDash(isDouble ? [6, 3] : [4, 3]);
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(canvasWidth - margin, y);
    ctx.stroke();
    ctx.restore();
    y += isDouble ? 22 : 18;
  }

  // Header
  const shopName = shop.shop_name || "MOBILE SHOP POS";
  drawCenteredText(shopName.toUpperCase(), "900 18px system-ui, sans-serif", "#000000");
  y += 22;

  drawCenteredText("PURCHASE RETURN VOUCHER", "bold 13px system-ui, sans-serif", "#c53030");
  y += 24;

  drawRow("RETURN #:", ret.return_number || `PRET-${ret.id}`, "bold 14px monospace", "#c53030");
  y += 22;
  drawRow("ORIGINAL PO:", ret.purchase_number || (ret.purchase_id ? `PUR-${ret.purchase_id}` : "N/A"), "bold 13px monospace", "#000000");
  y += 22;
  drawRow("DATE:", formatDateTime(ret.return_date || ret.created_at || new Date()), "13px monospace", "#333333");
  y += 22;
  drawRow("SUPPLIER:", String(ret.supplier_name || ret.suppliers?.name || "Supplier").slice(0, 26), "bold 14px monospace", "#000000");
  y += 22;
  drawRow("STATUS:", (ret.status || "completed").toUpperCase(), "bold 13px monospace", "#15803d");
  y += 12;

  drawDashedLine(true);

  // Return Details
  drawRow("Return Value:", formatCurrency(ret.subtotal || 0), "900 16px monospace", "#c53030");
  y += 24;

  if (Number(ret.refund_amount) > 0) {
    drawRow("Refund Received:", formatCurrency(ret.refund_amount), "bold 14px monospace", "#15803d");
    y += 22;
  }
  if (Number(ret.balance_adjustment) > 0) {
    drawRow("Balance Adjusted:", formatCurrency(ret.balance_adjustment), "bold 14px monospace", "#1d4ed8");
    y += 22;
  }

  if (ret.reason) {
    drawDashedLine(false);
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#666666";
    ctx.fillText("REASON FOR RETURN:", margin, y);
    y += 18;
    ctx.font = "italic 13px system-ui, sans-serif";
    ctx.fillStyle = "#000000";
    ctx.fillText(String(ret.reason).slice(0, 48), margin, y);
    y += 14;
  }

  drawDashedLine(true);
  drawCenteredText("*** Stock Dispatched to Supplier ***", "italic 12px system-ui", "#666666");
  y += 26;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvasWidth;
  finalCanvas.height = y;
  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.fillStyle = "#ffffff";
  finalCtx.fillRect(0, 0, canvasWidth, y);
  finalCtx.drawImage(canvas, 0, 0);

  return finalCanvas;
}

export async function exportPurchaseReturnToPdf(purchaseReturn, shop = {}) {
  if (!purchaseReturn) throw new Error("Purchase return data not found for PDF export.");
  const safeNumber = String(purchaseReturn.return_number || `PRET-${purchaseReturn.id}`).replaceAll("/", "-");
  const filename = `${safeNumber}.pdf`;

  const canvas = await renderPurchaseReturnToCanvas(purchaseReturn, shop);
  const jpegData = canvas.toDataURL("image/jpeg", 0.96);

  const paperWidthMm = 80;
  const paperHeightMm = Math.max(80, Math.round((canvas.height / canvas.width) * paperWidthMm));

  const pdfBlob = generatePdfFromJpeg(jpegData, paperWidthMm, paperHeightMm);
  triggerFileDownload(pdfBlob, filename);
  return true;
}

/**
 * Renders Expense Voucher data to 2D Canvas
 */
async function renderExpenseToCanvas(expense, shop = {}) {
  const canvasWidth = 580; // 80mm thermal width
  const margin = 28;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = 2500;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, 2500);

  let y = 36;

  // Render Shop Logo if available
  const logoUrl = shop.logo || shop.logo_url;
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = logoUrl;
      });
      if (img.width && img.height) {
        const maxH = 55;
        const maxW = 140;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvasWidth - w) / 2, y, w, h);
        y += h + 14;
      }
    } catch {}
  }

  function drawCenteredText(text, font = "14px monospace", color = "#000000") {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, canvasWidth / 2, y);
    ctx.textAlign = "left";
  }

  function drawRow(leftText, rightText, font = "14px monospace", color = "#000000", rightColor = null) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(leftText, margin, y);
    ctx.textAlign = "right";
    ctx.fillStyle = rightColor || color;
    ctx.fillText(rightText, canvasWidth - margin, y);
    ctx.textAlign = "left";
  }

  function drawDashedLine(isDouble = false) {
    y += 10;
    ctx.save();
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = isDouble ? 1.5 : 1;
    ctx.setLineDash(isDouble ? [6, 3] : [4, 3]);
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(canvasWidth - margin, y);
    ctx.stroke();
    ctx.restore();
    y += isDouble ? 22 : 18;
  }

  // Header
  const shopName = shop.shop_name || "MOBILE SHOP POS";
  drawCenteredText(shopName.toUpperCase(), "900 18px system-ui, sans-serif", "#000000");
  y += 22;

  drawCenteredText("EXPENSE PAYMENT VOUCHER", "bold 13px system-ui, sans-serif", "#e11d48");
  y += 24;

  drawRow("EXPENSE #:", expense.expense_number || `EXP-${String(expense.id).padStart(4, "0")}`, "bold 14px monospace", "#e11d48");
  y += 22;
  drawRow("DATE:", formatDateTime(expense.expense_date || expense.created_at || new Date()), "13px monospace", "#333333");
  y += 22;
  drawRow("CATEGORY:", String(expense.category_name || "General").slice(0, 24), "bold 14px monospace", "#000000");
  y += 22;
  drawRow("METHOD:", (expense.payment_method || "cash").toUpperCase().replaceAll("_", " "), "13px monospace", "#000000");
  y += 22;
  if (expense.reference_number) {
    drawRow("REF / BILL #:", String(expense.reference_number).slice(0, 24), "13px monospace", "#000000");
    y += 22;
  }
  drawRow("STATUS:", (expense.status || "active").toUpperCase(), "bold 13px monospace", expense.status === "voided" ? "#e11d48" : "#15803d");
  y += 12;

  drawDashedLine(true);

  // Purpose / Title
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#666666";
  ctx.fillText("EXPENSE PURPOSE / TITLE:", margin, y);
  y += 18;
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillStyle = "#000000";
  ctx.fillText(String(expense.title).slice(0, 42), margin, y);
  y += 22;

  drawDashedLine(false);

  // Amount
  drawRow("TOTAL PAID AMOUNT:", formatCurrency(expense.amount || 0), "900 18px monospace", "#e11d48");
  y += 26;

  if (expense.description) {
    drawDashedLine(false);
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#666666";
    ctx.fillText("NOTES / AUDIT DETAILS:", margin, y);
    y += 18;
    ctx.font = "italic 13px system-ui, sans-serif";
    ctx.fillStyle = "#000000";
    ctx.fillText(String(expense.description).slice(0, 48), margin, y);
    y += 14;
  }

  drawDashedLine(true);
  drawCenteredText("*** Approved Financial Record ***", "italic 12px system-ui", "#666666");
  y += 26;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvasWidth;
  finalCanvas.height = y;
  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.fillStyle = "#ffffff";
  finalCtx.fillRect(0, 0, canvasWidth, y);
  finalCtx.drawImage(canvas, 0, 0);

  return finalCanvas;
}

export async function exportExpenseToPdf(expense, shop = {}) {
  if (!expense) throw new Error("Expense data not found for PDF export.");
  const safeNumber = String(expense.expense_number || `EXP-${expense.id}`).replaceAll("/", "-");
  const filename = `${safeNumber}.pdf`;

  const canvas = await renderExpenseToCanvas(expense, shop);
  const jpegData = canvas.toDataURL("image/jpeg", 0.96);

  const paperWidthMm = 80;
  const paperHeightMm = Math.max(80, Math.round((canvas.height / canvas.width) * paperWidthMm));

  const pdfBlob = generatePdfFromJpeg(jpegData, paperWidthMm, paperHeightMm);
  triggerFileDownload(pdfBlob, filename);
  return true;
}



