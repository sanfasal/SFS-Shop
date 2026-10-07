import { fetchCustomerById, type Customer } from "@/lib/customers";
import { currency, formatDate } from "@/lib/format";
import { fetchOrderById, orderLabel, type Order } from "@/lib/orders";

const SHOP_NAME = "sfs-shop";

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Noto+Sans+Khmer:wght@400;500;600;700&family=Great+Vibes&display=swap";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function invoiceFileName(order: Order) {
  return `Invoice-${orderLabel(order).replace(/[^\w-]+/g, "")}`;
}

// Self-contained, print-ready invoice document (its own styles and fonts).
export function buildInvoiceHtml(order: Order, customer: Customer | null) {
  const items = order.items ?? [];
  const subTotal =
    order.subTotal ??
    items.reduce((sum, item) => sum + (item.lineTotal ?? (item.unitPrice ?? 0) * item.quantity), 0);
  const total = order.totalAmount ?? Math.max(0, subTotal - order.discountAmount);
  const customerName = customer?.fullName || order.customerName || `#${order.customerId}`;

  const rows = items.length
    ? items
        .map((item, index) => {
          const lineTotal =
            item.lineTotal ?? (item.unitPrice != null ? item.unitPrice * item.quantity : null);
          return `<tr>
            <td class="muted">${index + 1}</td>
            <td>${escapeHtml(item.productName || `Product #${item.productId}`)}</td>
            <td class="num">${item.unitPrice == null ? "—" : currency.format(item.unitPrice)}</td>
            <td class="num">${item.quantity}</td>
            <td class="num strong">${lineTotal == null ? "—" : currency.format(lineTotal)}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="5" class="empty">No items on this order.</td></tr>`;

  const customerLines = [customer?.phone, customer?.address]
    .filter(Boolean)
    .map((line) => `<div class="muted">${escapeHtml(line!)}</div>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(invoiceFileName(order))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${FONTS_URL}" />
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; color: #111827; }
  body {
    font: 13px/1.5 "Geist", "Noto Sans Khmer", system-ui, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .muted { color: #6b7280; }
  .strong { font-weight: 600; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
    padding-bottom: 20px; border-bottom: 3px solid #036c5b; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .mark { width: 44px; height: 44px; border-radius: 12px; color: #fff; font: 34px/44px "Great Vibes", cursive;
    text-align: center; background: linear-gradient(90deg, #06584c 0%, #036c5b 50%, #06a98c 100%); }
  .shop { font-size: 20px; font-weight: 700; }
  h1 { margin: 0; font-size: 28px; letter-spacing: 0.08em; color: #036c5b; text-align: right; }
  .meta { margin-top: 4px; text-align: right; }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin: 24px 0; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 4px; }
  .status { display: inline-block; padding: 1px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
    background: #f3f4f6; color: #374151; }
  .status.paid { background: #dcfce7; color: #166534; }
  .status.pending { background: #fef3c7; color: #92400e; }
  .status.cancelled { background: #fee2e2; color: #991b1b; }
  table { width: 100%; border-collapse: collapse; }
  thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
    color: #fff; background: #036c5b; padding: 8px 10px; }
  thead th.num { text-align: right; }
  tbody td { padding: 9px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tbody tr { break-inside: avoid; }
  .empty { text-align: center; color: #6b7280; padding: 20px; }
  .totals { margin: 16px 0 0 auto; width: 260px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { margin-top: 4px; padding-top: 8px; border-top: 2px solid #111827; font-size: 16px; font-weight: 700; }
  .note { margin-top: 28px; white-space: pre-wrap; }
  footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
</style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="mark">S</div>
      <div class="shop">${SHOP_NAME}</div>
    </div>
    <div>
      <h1>INVOICE</h1>
      <div class="meta"><span class="muted">No.</span> <strong>${escapeHtml(orderLabel(order))}</strong></div>
      <div class="meta"><span class="muted">Date</span> ${formatDate(order.orderDate ?? order.createdDate)}</div>
    </div>
  </header>

  <section class="parties">
    <div>
      <div class="label">Bill to</div>
      <div class="strong">${escapeHtml(customerName)}</div>
      ${customerLines}
    </div>
    <div style="text-align:right">
      <div class="label">Status</div>
      <span class="status ${escapeHtml(order.status.toLowerCase())}">${escapeHtml(order.status)}</span>
    </div>
  </section>

  <table>
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th>Product</th>
        <th class="num">Price</th>
        <th class="num">Qty</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="muted"><span>Subtotal</span><span class="num">${currency.format(subTotal)}</span></div>
    <div class="muted"><span>Discount</span><span class="num">−${currency.format(order.discountAmount)}</span></div>
    <div class="grand"><span>Total</span><span class="num">${currency.format(total)}</span></div>
  </div>

  ${
    order.note
      ? `<div class="note"><div class="label">Note</div>${escapeHtml(order.note)}</div>`
      : ""
  }

  <footer>Thank you for your purchase!</footer>
</body>
</html>`;
}

// Prints the invoice from a hidden iframe so the dashboard UI stays out of the page.
export function printInvoiceHtml(html: string, fileName: string) {
  return new Promise<void>((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
      visibility: "hidden",
    });

    // Most browsers name the saved PDF after the top-level document's title.
    const previousTitle = document.title;
    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = previousTitle;
      iframe.remove();
      resolve();
    };

    iframe.onload = async () => {
      const win = iframe.contentWindow;
      if (!win) return cleanup();
      try {
        await win.document.fonts?.ready;
      } catch {
        // Fall back to whatever fonts are available.
      }
      win.addEventListener("afterprint", () => setTimeout(cleanup, 0));
      document.title = fileName;
      win.focus();
      win.print();
      // Safety net for browsers that don't fire afterprint.
      setTimeout(cleanup, 60_000);
    };

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}

// A4 at 96dpi; the capture padding stands in for the @page margin (16mm).
const A4_WIDTH_PX = 794;
const CAPTURE_PADDING_PX = 60;

// Renders the invoice in an off-screen iframe, snapshots it and saves it as a PDF.
// The browser draws the text before it becomes an image, so Khmer stays correct.
export async function downloadInvoicePdf(html: string, fileName: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${A4_WIDTH_PX}px`,
    height: "1123px",
    border: "0",
  });

  try {
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
      document.body.appendChild(iframe);
    });
    const doc = iframe.contentDocument!;
    try {
      await doc.fonts?.ready;
    } catch {
      // Fall back to whatever fonts are available.
    }
    doc.body.style.padding = `${CAPTURE_PADDING_PX}px`;

    const canvas = await html2canvas(doc.body, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: A4_WIDTH_PX,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Canvas pixels that fit on one page at full page width.
    const sliceHeight = Math.floor((canvas.width * pageHeight) / pageWidth);

    for (let y = 0, page = 0; y < canvas.height; y += sliceHeight, page++) {
      const height = Math.min(sliceHeight, canvas.height - y);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = height;
      slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, height, 0, 0, canvas.width, height);
      if (page > 0) pdf.addPage();
      pdf.addImage(
        slice.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        0,
        pageWidth,
        (height * pageWidth) / canvas.width
      );
    }

    pdf.save(`${fileName}.pdf`);
  } finally {
    iframe.remove();
  }
}

// Loads the full order (the list endpoint may omit items) plus customer details.
async function loadInvoice(orderOrId: Order | number) {
  const order =
    typeof orderOrId === "number" || !orderOrId.items
      ? await fetchOrderById(typeof orderOrId === "number" ? orderOrId : orderOrId.id)
      : orderOrId;
  const customer = await fetchCustomerById(order.customerId).catch(() => null);
  return { html: buildInvoiceHtml(order, customer), fileName: invoiceFileName(order) };
}

export async function printOrderInvoice(orderOrId: Order | number) {
  const { html, fileName } = await loadInvoice(orderOrId);
  await printInvoiceHtml(html, fileName);
}

export async function downloadOrderInvoice(orderOrId: Order | number) {
  const { html, fileName } = await loadInvoice(orderOrId);
  await downloadInvoicePdf(html, fileName);
}
