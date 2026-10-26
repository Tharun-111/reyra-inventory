import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  Printer,
  Search,
  Package,
  X,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../services/database';
import { useSettings } from '../../context/SettingsContext';
import {
  StatementData,
  StatementLineItem,
  downloadStatementCsv,
  downloadStatementPdf,
  buildStatementHtml,
} from './statementPdf';

export const GetStatementView: React.FC = () => {
  const { formatMoney } = useSettings();
  const settings = db.getSettings();
  const orders = db.getOrders();
  const products = db.getProducts(true);

  // Compute default date range (Current month: start of month to today)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayStr = now.toISOString().split('T')[0];
  const firstDayOfMonthStr = `${currentYear}-${currentMonth}-01`;

  const [startDate, setStartDate] = useState<string>(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [activePreset, setActivePreset] = useState<string>('this_month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Friendly Range Presets
  const applyPreset = (preset: 'today' | 'week' | 'this_month' | 'last_month' | 'all') => {
    setActivePreset(preset);
    const d = new Date();
    const today = d.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'week') {
      const dayOfWeek = d.getDay();
      const diffToMon = (dayOfWeek + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - diffToMon);
      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'this_month') {
      setStartDate(`${currentYear}-${currentMonth}-01`);
      setEndDate(today);
    } else if (preset === 'last_month') {
      const prevMonthDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(d.getFullYear(), d.getMonth(), 0);
      setStartDate(prevMonthDate.toISOString().split('T')[0]);
      setEndDate(lastDayPrevMonth.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('2025-01-01');
      setEndDate(today);
    }
  };

  // Product lookup map for purchase rates
  const productCostMap = useMemo(() => {
    const map: Record<string, { buy_price: number; name: string }> = {};
    products.forEach(p => {
      map[p.id] = { buy_price: p.buy_price, name: p.name };
      if (p.sku) {
        map[p.sku] = { buy_price: p.buy_price, name: p.name };
      }
      if (p.variants) {
        p.variants.forEach(v => {
          map[v.id] = { buy_price: v.buy_price, name: `${p.name} - ${v.variant_name}` };
          if (v.sku) {
            map[v.sku] = { buy_price: v.buy_price, name: `${p.name} - ${v.variant_name}` };
          }
        });
      }
    });
    return map;
  }, [products]);

  // Extract statement line items
  const statementItems: StatementLineItem[] = useMemo(() => {
    const lines: StatementLineItem[] = [];

    const periodOrders = orders.filter(o => {
      if (o.status === 'Cancelled') return false;
      const oDate = o.order_date || o.created_at?.split('T')[0] || '';
      return oDate >= startDate && oDate <= endDate;
    });

    periodOrders.sort((a, b) => {
      const dateA = a.order_date || a.created_at;
      const dateB = b.order_date || b.created_at;
      return dateA.localeCompare(dateB);
    });

    periodOrders.forEach(order => {
      const oDate = order.order_date || order.created_at?.split('T')[0] || '';

      order.items.forEach((item, itemIdx) => {
        let buyPrice = 0;
        if (item.variant_id && productCostMap[item.variant_id]) {
          buyPrice = productCostMap[item.variant_id].buy_price;
        } else if (item.product_id && productCostMap[item.product_id]) {
          buyPrice = productCostMap[item.product_id].buy_price;
        } else if (item.sku && productCostMap[item.sku]) {
          buyPrice = productCostMap[item.sku].buy_price;
        } else {
          buyPrice = Math.round(item.rate * 0.6);
        }

        const qty = item.quantity;
        const salesRate = item.rate;
        const lineRev =
          typeof item.line_total === 'number'
            ? item.line_total
            : qty * salesRate * (1 - (item.discount || 0) / 100);

        const totalCost = buyPrice * qty;
        const profit = lineRev - totalCost;
        const marginPct = lineRev > 0 ? (profit / lineRev) * 100 : 0;

        lines.push({
          id: `${order.id}-${item.id || itemIdx}`,
          date: oDate,
          orderNumber: order.order_number,
          customerName: order.customer_name || 'Direct Customer',
          productSold: item.product_name,
          variantName: item.variant_name,
          sku: item.sku || 'N/A',
          quantity: qty,
          purchaseRate: buyPrice,
          salesRate: salesRate,
          revenue: lineRev,
          profit: profit,
          marginPct: marginPct,
        });
      });
    });

    return lines;
  }, [orders, startDate, endDate, productCostMap]);

  // Filtered by Search Query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return statementItems;
    const q = searchQuery.toLowerCase();
    return statementItems.filter(
      it =>
        it.productSold.toLowerCase().includes(q) ||
        it.sku.toLowerCase().includes(q) ||
        it.orderNumber.toLowerCase().includes(q) ||
        it.date.includes(q)
    );
  }, [statementItems, searchQuery]);

  // Totals calculations
  const totalQty = useMemo(
    () => filteredItems.reduce((sum, it) => sum + it.quantity, 0),
    [filteredItems]
  );

  const totalPurchaseCost = useMemo(
    () => filteredItems.reduce((sum, it) => sum + it.purchaseRate * it.quantity, 0),
    [filteredItems]
  );

  const finalTotalRevenue = useMemo(
    () => filteredItems.reduce((sum, it) => sum + it.revenue, 0),
    [filteredItems]
  );

  const totalProfit = useMemo(
    () => filteredItems.reduce((sum, it) => sum + it.profit, 0),
    [filteredItems]
  );

  // Statement Data Payload
  const statementPayload: StatementData = useMemo(() => ({
    startDate,
    endDate,
    generatedAt: new Date().toLocaleString(),
    items: filteredItems,
    totalQty,
    totalPurchaseCost,
    finalTotalRevenue,
    totalProfit,
    currencySymbol: settings.currency_symbol || '₹',
    settings,
  }), [startDate, endDate, filteredItems, totalQty, totalPurchaseCost, finalTotalRevenue, totalProfit, settings]);

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadStatementPdf(statementPayload);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadCsv = () => {
    downloadStatementCsv(statementPayload);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="get-statement-view" className="space-y-5">
      {/* Printable container for browser print */}
      <div
        id="printable-statement"
        className="hidden print:block"
        dangerouslySetInnerHTML={{ __html: buildStatementHtml(statementPayload) }}
      />

      {/* Screen Interactive View */}
      <div className="print:hidden space-y-5">
        {/* Friendly Top Controls Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          {/* Row 1: Date Presets & Custom Pickers */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Period:
              </span>
              {[
                { id: 'this_month', label: 'This Month' },
                { id: 'week', label: 'This Week' },
                { id: 'today', label: 'Today' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'all', label: 'All Time' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    activePreset === p.id
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom From / To Inputs */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => {
                    setEndDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Search Bar & Big Friendly Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products or order #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Clear Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf || filteredItems.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                title="Download Statement PDF"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isExportingPdf ? 'Preparing PDF...' : 'Download PDF'}</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                disabled={filteredItems.length === 0}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Export as Excel CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Print Statement"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Friendly Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Revenue (Main Highlight) */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Total Revenue
            </span>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {formatMoney(finalTotalRevenue)}
            </div>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">
              Between {startDate} and {endDate}
            </span>
          </div>

          {/* Card 2: Items Sold */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">
              Products Sold
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalQty} <span className="text-xs font-normal text-slate-400">items</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              In {filteredItems.length} transactions
            </span>
          </div>

          {/* Card 3: Estimated Profit */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">
              Estimated Profit
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              +{formatMoney(totalProfit)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Cost of goods: {formatMoney(totalPurchaseCost)}
            </span>
          </div>
        </div>

        {/* Clean, Easy-to-Read Statement Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Sales Statement ({filteredItems.length} entries)
            </h3>
            <span className="text-xs text-slate-400">
              {startDate} to {endDate}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4">Product Sold</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Purchase Rate</th>
                  <th className="py-3 px-3 text-right">Sales Rate</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-sm">No sales found in this period.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try selecting "All Time" or picking a different date range above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {item.date}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.productSold}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>SKU: {item.sku}</span>
                          {item.variantName && <span>· {item.variantName}</span>}
                          <span>· Order: #{item.orderNumber}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                        {formatMoney(item.purchaseRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                        {formatMoney(item.salesRate)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(item.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Final Total Row at the End */}
              {filteredItems.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-semibold">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-4 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wide">
                      Total for Selected Period ({startDate} to {endDate})
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                      {totalQty}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-500">
                      Total Cost: {formatMoney(totalPurchaseCost)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-500">
                      —
                    </td>
                    {/* Final Total of Revenue */}
                    <td className="py-3.5 px-4 text-right bg-emerald-600 text-white font-bold text-sm shadow-xs rounded-br-2xl">
                      <span className="text-[10px] block font-normal uppercase opacity-90">
                        Final Total Revenue
                      </span>
                      {formatMoney(finalTotalRevenue)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
