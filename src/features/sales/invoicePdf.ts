import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, BusinessSettings } from '../../types';

/**
 * Formats a numeric value with standard Indian comma grouping and 2 decimals.
 */
function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatInvoiceAmount(val: number | undefined | null): string {
  return Number(val ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Builds standalone, pristine HTML for the invoice suitable for printing and PDF generation.
 */
export function buildInvoiceHtml(invoice: Invoice, settings: BusinessSettings): string {
  const currencySymbol =
    invoice.currency_symbol ||
    invoice.currency ||
    invoice.currency_code ||
    settings.currency_symbol ||
    '₹';

  const subtotal = invoice.subtotal ?? 0;
  const totalDiscount = invoice.total_discount ?? invoice.discount_total ?? 0;
  const taxAmount = invoice.tax_amount ?? invoice.tax_total ?? 0;
  const totalAmount = invoice.total_amount ?? 0;

  const brandName = settings.brand_name || 'REYRA Inventory';

  const itemsRows = (invoice.items || [])
    .map(
      (it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 12px; color: #64748b; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">
          ${escapeHtml(it.product_name)}
          ${it.variant_name ? `<div style="font-size: 11px; color: #2563eb; font-weight: normal; margin-top: 2px;">Variant: ${escapeHtml(it.variant_name)}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; font-family: monospace; font-size: 11px; color: #475569;">${escapeHtml(it.sku || '—')}</td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #0f172a;">${it.quantity}</td>
        <td style="padding: 10px 12px; text-align: right; color: #0f172a;">${formatInvoiceAmount(it.unit_price)}</td>
        <td style="padding: 10px 12px; text-align: right; color: #64748b;">${it.discount ? `${it.discount}%` : '—'}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">${formatInvoiceAmount(it.line_total)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; padding: 32px; box-sizing: border-box; width: 100%; max-width: 800px; margin: 0 auto; font-size: 12px; line-height: 1.5;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 24px; margin-bottom: 24px;">
        <div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: #072e22; display: flex; align-items: center; justify-content: center; color: #e5b94e; font-weight: 900; font-size: 22px; font-family: serif; border: 1px solid #c89626;">
              R
            </div>
            <div>
              <h1 style="font-size: 24px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -0.5px; line-height: 1.1;">
                ${escapeHtml(brandName)}
              </h1>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                ${escapeHtml(settings.business_email || 'contact@reyra.com')} • ${escapeHtml(settings.business_phone || '+91 98765 43210')}
              </div>
            </div>
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 12px; max-width: 320px; line-height: 1.4;">
            ${escapeHtml(settings.business_address || 'Enterprise Business Park, Tech Zone')}
            ${settings.tax_identifier ? `<div style="font-weight: 600; color: #0f172a; margin-top: 4px;">GSTIN / Tax ID: ${escapeHtml(settings.tax_identifier)}</div>` : ''}
          </div>
        </div>

        <div style="text-align: right;">
          <div style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 4px; letter-spacing: 1.5px; text-transform: uppercase;">
            TAX INVOICE
          </div>
          <div style="font-size: 14px; font-weight: 700; font-family: monospace; margin-top: 12px; color: #0f172a;">
            Invoice No: <span style="color: #2563eb;">#${escapeHtml(invoice.invoice_number)}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            Invoice Date: <strong style="color: #0f172a;">${escapeHtml(invoice.invoice_date)}</strong>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            Ref Order: <strong style="color: #0f172a; font-family: monospace;">#${escapeHtml(invoice.order_number)}</strong>
          </div>
        </div>
      </div>

      <!-- Bill To & Meta Details -->
      <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="flex: 1;">
          <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
            Billed To (Customer)
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${escapeHtml(invoice.customer_name)}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px; font-family: monospace;">
            Phone: ${escapeHtml(invoice.customer_phone)}
          </div>
          ${invoice.customer_email ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Email: ${escapeHtml(invoice.customer_email)}</div>` : ''}
          ${invoice.customer_address ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">${escapeHtml(invoice.customer_address)}</div>` : ''}
        </div>

        <div style="text-align: right; flex: 1;">
          <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
            Payment & Status
          </div>
          <div style="font-size: 12px; color: #0f172a; font-weight: 600;">
            Currency: <span style="font-weight: 800;">${currencySymbol} (${invoice.currency_code || settings.currency_code || 'INR'})</span>
          </div>
          <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #059669; margin-top: 6px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 9999px;">
            ✓ Paid in Full
          </div>
        </div>
      </div>

      <!-- Line Items Table -->
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px 12px; width: 40px; text-align: center;">#</th>
              <th style="padding: 10px 12px;">Item Description</th>
              <th style="padding: 10px 12px;">SKU</th>
              <th style="padding: 10px 12px; text-align: center; width: 60px;">Qty</th>
              <th style="padding: 10px 12px; text-align: right;">Unit Price</th>
              <th style="padding: 10px 12px; text-align: right;">Disc</th>
              <th style="padding: 10px 12px; text-align: right;">Amount (${currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      <!-- Totals Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
        <div style="width: 280px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569; font-size: 12px;">
            <span>Items Subtotal:</span>
            <span style="font-weight: 600; color: #0f172a;">${currencySymbol} ${formatInvoiceAmount(subtotal)}</span>
          </div>

          ${
            totalDiscount > 0
              ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #059669; font-size: 12px;">
            <span>Discount Applied:</span>
            <span style="font-weight: 600;">-${currencySymbol} ${formatInvoiceAmount(totalDiscount)}</span>
          </div>
          `
              : ''
          }

          ${
            taxAmount > 0
              ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569; font-size: 12px;">
            <span>Taxes:</span>
            <span style="font-weight: 600; color: #0f172a;">+${currencySymbol} ${formatInvoiceAmount(taxAmount)}</span>
          </div>
          `
              : ''
          }

          <div style="border-top: 2px solid #0f172a; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; align-items: baseline; color: #0f172a;">
            <span style="font-size: 14px; font-weight: 800;">Total Amount:</span>
            <span style="font-size: 18px; font-weight: 900;">${currencySymbol} ${formatInvoiceAmount(totalAmount)}</span>
          </div>
        </div>
      </div>

      <!-- Footer Terms & Signatory -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b;">
        <div style="max-width: 420px; line-height: 1.5;">
          <div style="font-weight: 700; color: #334155; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">
            Terms & Conditions
          </div>
          <div>1. Goods once sold can be returned within 14 days subject to store return policy.</div>
          <div>2. This is a computer generated tax invoice and requires no physical stamp.</div>
        </div>
        <div style="text-align: right;">
          <div style="height: 40px; border-bottom: 1px dashed #cbd5e1; width: 140px; margin-bottom: 4px; margin-left: auto;"></div>
          <div style="font-weight: 700; color: #334155;">Authorized Signatory</div>
          <div style="font-size: 9px; color: #94a3b8;">${brandName}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Directly prints the invoice using an isolated iframe or standard window.print()
 */
export function printInvoice(invoice: Invoice, settings: BusinessSettings): void {
  const printContent = buildInvoiceHtml(invoice, settings);

  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice #${invoice.invoice_number}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { margin: 0; padding: 0; background: #ffffff; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 300);
  } catch {
    window.print();
  }
}

/**
 * Downloads the invoice as a PDF file.
 */
export async function downloadInvoicePdf(
  invoice: Invoice,
  settings: BusinessSettings
): Promise<boolean> {
  const fileName = `Invoice-${invoice.invoice_number || 'INV'}.pdf`;

  // Keep the source at the viewport origin. Chromium can clip html2canvas
  // captures of elements positioned far outside the viewport (as happened in
  // the packaged Electron app), producing a valid PDF with a blank page.
  const container = document.createElement('div');
  container.id = 'invoice-pdf-capture';
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '794px'; // standard A4 at 96 DPI
  container.style.background = '#ffffff';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '2147483647';
  container.innerHTML = buildInvoiceHtml(invoice, settings);
  document.body.appendChild(container);

  try {
    // Let the browser finish resolving fonts before rasterizing the invoice.
    if (document.fonts?.ready) await document.fonts.ready;

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: Math.max(document.documentElement.clientWidth, container.scrollWidth),
      windowHeight: Math.max(document.documentElement.clientHeight, container.scrollHeight),
      onclone: clonedDocument => {
        const clonedContainer = clonedDocument.getElementById('invoice-pdf-capture');
        if (clonedContainer) clonedContainer.style.opacity = '1';
      },
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Invoice capture produced an empty canvas.');
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('Failed to generate PDF via html2canvas:', err);
    // Fallback: download as standalone self-printing HTML document
    downloadInvoiceHtml(invoice, settings);
    return false;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Downloads the invoice as a standalone HTML file that can be opened and printed anywhere.
 */
export function downloadInvoiceHtml(invoice: Invoice, settings: BusinessSettings): void {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice #${invoice.invoice_number}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    body { margin: 0; padding: 20px; background: #f8fafc; display: flex; justify-content: center; }
    .card { background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 12px; }
    @media print {
      body { padding: 0; background: #ffffff; }
      .card { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="card">
    ${buildInvoiceHtml(invoice, settings)}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${invoice.invoice_number || 'INV'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
