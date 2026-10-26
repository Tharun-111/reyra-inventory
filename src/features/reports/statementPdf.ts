import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BusinessSettings } from '../../types';

export interface StatementLineItem {
  id: string;
  date: string;
  orderNumber: string;
  customerName: string;
  productSold: string;
  variantName?: string;
  sku: string;
  quantity: number;
  purchaseRate: number;
  salesRate: number;
  revenue: number;
  profit: number;
  marginPct: number;
}

export interface StatementData {
  startDate: string;
  endDate: string;
  generatedAt: string;
  items: StatementLineItem[];
  totalQty: number;
  totalPurchaseCost: number;
  finalTotalRevenue: number;
  totalProfit: number;
  currencySymbol: string;
  settings: BusinessSettings;
}

/**
 * Formats a numeric currency amount with Indian/standard grouping and 2 decimal places.
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

export function formatStatementMoney(val: number | undefined | null, symbol = '₹'): string {
  const num = Number(val ?? 0);
  return `${symbol} ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Exports statement data as a clean CSV spreadsheet with exact columns and final total row at last.
 */
export function downloadStatementCsv(data: StatementData): void {
  const headers = [
    'Date',
    'Order Number',
    'Customer',
    'Product Sold',
    'Variant',
    'SKU',
    'Quantity',
    `Purchase Rate (${data.currencySymbol})`,
    `Sales Rate (${data.currencySymbol})`,
    `Revenue (${data.currencySymbol})`,
    `Gross Profit (${data.currencySymbol})`,
    'Margin (%)',
  ];

  const rows = data.items.map(it => [
    `"${it.date}"`,
    `"${it.orderNumber}"`,
    `"${it.customerName.replace(/"/g, '""')}"`,
    `"${it.productSold.replace(/"/g, '""')}"`,
    `"${(it.variantName || '').replace(/"/g, '""')}"`,
    `"${it.sku}"`,
    it.quantity,
    it.purchaseRate.toFixed(2),
    it.salesRate.toFixed(2),
    it.revenue.toFixed(2),
    it.profit.toFixed(2),
    `${it.marginPct.toFixed(1)}%`,
  ]);

  // Final Total row at the very bottom
  const summaryRow = [
    `"FINAL TOTAL (Period: ${data.startDate} to ${data.endDate})"`,
    '""',
    '""',
    `"${data.items.length} Line Items"`,
    '""',
    '""',
    data.totalQty,
    data.totalPurchaseCost.toFixed(2),
    '""',
    data.finalTotalRevenue.toFixed(2),
    data.totalProfit.toFixed(2),
    `${data.finalTotalRevenue > 0 ? ((data.totalProfit / data.finalTotalRevenue) * 100).toFixed(1) : '0'}%`,
  ];

  const csvContent = [
    `# REYRA Inventory - Statement of Sales & Revenue`,
    `# Period: ${data.startDate} to ${data.endDate}`,
    `# Generated: ${data.generatedAt}`,
    `# Final Total Revenue: ${data.currencySymbol} ${data.finalTotalRevenue.toFixed(2)}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(',')),
    '',
    summaryRow.join(','),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute(
    'download',
    `reyra_statement_${data.startDate}_to_${data.endDate}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Builds printable and PDF-ready HTML for the Statement.
 */
export function buildStatementHtml(data: StatementData): string {
  const brandName = data.settings.brand_name || 'REYRA Inventory';
  const taxId = data.settings.tax_id || data.settings.tax_identifier || '';
  const address = data.settings.business_address || data.settings.company_address || '';
  const phone = data.settings.business_phone || data.settings.company_phone || '';
  const email = data.settings.business_email || data.settings.company_email || '';

  const rowsHtml = data.items
    .map(
      (it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 7px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 8px; font-family: monospace; font-weight: 600; color: #0f172a; white-space: nowrap;">${escapeHtml(it.date)}</td>
        <td style="padding: 7px 8px; color: #334155; font-weight: 500;">
          <div style="font-weight: 700; color: #0f172a;">${escapeHtml(it.productSold)}</div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">SKU: ${escapeHtml(it.sku)}${it.variantName ? ` · ${escapeHtml(it.variantName)}` : ''}</div>
        </td>
        <td style="padding: 7px 8px; text-align: center; font-weight: 700; color: #0f172a;">${it.quantity}</td>
        <td style="padding: 7px 8px; text-align: right; color: #475569;">${formatStatementMoney(it.purchaseRate, data.currencySymbol)}</td>
        <td style="padding: 7px 8px; text-align: right; color: #0f172a; font-weight: 600;">${formatStatementMoney(it.salesRate, data.currencySymbol)}</td>
        <td style="padding: 7px 8px; text-align: right; font-weight: 800; color: #047857; background-color: #f0fdf4;">${formatStatementMoney(it.revenue, data.currencySymbol)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; padding: 28px; box-sizing: border-box; width: 100%; max-width: 900px; margin: 0 auto; font-size: 12px; line-height: 1.4;">
      <!-- Statement Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: #072e22; display: flex; align-items: center; justify-content: center; color: #e5b94e; font-weight: 900; font-size: 26px; font-family: serif; border: 1.5px solid #c89626;">
            R
          </div>
          <div>
            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; text-transform: uppercase;">
              ${escapeHtml(brandName)}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">
              ${address ? `${escapeHtml(address)} · ` : ''}${phone ? `Tel: ${escapeHtml(phone)}` : ''}
            </div>
            ${taxId ? `<div style="font-size: 10px; font-weight: 700; color: #047857; margin-top: 2px;">GST / Tax ID: ${escapeHtml(taxId)}</div>` : ''}
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 16px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">
            Statement of Sales &amp; Revenue
          </div>
          <div style="margin-top: 4px; font-size: 11px; font-weight: 700; color: #0f172a;">
            Period: <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">${data.startDate}</span> to <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">${data.endDate}</span>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 3px;">
            Generated: ${data.generatedAt}
          </div>
        </div>
      </div>

      <!-- Quick Executive Summary Banner -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
        <div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Items Sold</div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${data.totalQty} Units</div>
        </div>
        <div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Purchase Cost</div>
          <div style="font-size: 16px; font-weight: 900; color: #475569;">${formatStatementMoney(data.totalPurchaseCost, data.currencySymbol)}</div>
        </div>
        <div>
          <div style="font-size: 10px; font-weight: 700; color: #047857; text-transform: uppercase;">Final Total Revenue</div>
          <div style="font-size: 18px; font-weight: 900; color: #047857;">${formatStatementMoney(data.finalTotalRevenue, data.currencySymbol)}</div>
        </div>
        <div>
          <div style="font-size: 10px; font-weight: 700; color: #2563eb; text-transform: uppercase;">Estimated Gross Margin</div>
          <div style="font-size: 16px; font-weight: 900; color: #2563eb;">+${formatStatementMoney(data.totalProfit, data.currencySymbol)}</div>
        </div>
      </div>

      <!-- Statement Ledger Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 8px; text-align: center; width: 30px;">#</th>
            <th style="padding: 8px; text-align: left; width: 85px;">Date</th>
            <th style="padding: 8px; text-align: left;">Product Sold &amp; SKU</th>
            <th style="padding: 8px; text-align: center; width: 55px;">Qty</th>
            <th style="padding: 8px; text-align: right; width: 95px;">Purchase Rate</th>
            <th style="padding: 8px; text-align: right; width: 95px;">Sales Rate</th>
            <th style="padding: 8px; text-align: right; width: 110px;">Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="7" style="padding: 24px; text-align: center; color: #64748b;">No sales transactions found for the selected time period.</td></tr>'}
        </tbody>
        <tfoot>
          <!-- Prominent Final Total Row at the very bottom -->
          <tr style="background: #0f172a; color: #ffffff; font-size: 12px; font-weight: 800; border-top: 2px solid #000000;">
            <td colspan="3" style="padding: 12px 10px; text-transform: uppercase; letter-spacing: 0.5px;">
              FINAL TOTAL OF REVENUE (Period: ${data.startDate} to ${data.endDate})
            </td>
            <td style="padding: 12px 6px; text-align: center; font-size: 13px; color: #fde047;">${data.totalQty}</td>
            <td style="padding: 12px 6px; text-align: right; font-size: 11px; color: #cbd5e1;">${formatStatementMoney(data.totalPurchaseCost, data.currencySymbol)}</td>
            <td style="padding: 12px 6px; text-align: right; font-size: 11px; color: #cbd5e1;">—</td>
            <td style="padding: 12px 10px; text-align: right; font-size: 16px; font-weight: 900; color: #4ade80; background: #064e3b; border-left: 2px solid #047857;">
              ${formatStatementMoney(data.finalTotalRevenue, data.currencySymbol)}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Footer & Signatory -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #64748b;">
        <div>
          <div style="font-weight: 700; color: #0f172a;">Official Audit Statement</div>
          <div>This statement reflects verified order ledger entries from ${data.startDate} to ${data.endDate}.</div>
          <div>System Generated: ${data.generatedAt} · REYRA Inventory</div>
        </div>
        <div style="text-align: right;">
          <div style="border-bottom: 1px solid #94a3b8; width: 160px; height: 35px; margin-bottom: 4px;"></div>
          <div style="font-weight: 700; color: #0f172a;">Authorized Signatory</div>
          <div>${brandName} Accounts</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Downloads a high-quality PDF statement.
 */
export async function downloadStatementPdf(data: StatementData): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '880px';
  container.style.background = '#ffffff';
  container.style.zIndex = '-9999';
  container.innerHTML = buildStatementHtml(data);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(`reyra_statement_${data.startDate}_to_${data.endDate}.pdf`);
  } catch (err) {
    console.error('PDF generation error:', err);
    // Fallback: print view
    window.print();
  } finally {
    document.body.removeChild(container);
  }
}
