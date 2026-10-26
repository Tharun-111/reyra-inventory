import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  TrendingUp,
  Download,
  Package,
  PieChart,
  Database,
} from 'lucide-react';
import { db } from '../../services/database';
import { useSettings } from '../../context/SettingsContext';
import { ProfessionalAreaChart, DataPoint } from '../../components/charts/ProfessionalAreaChart';
import { DonutMetricChart, DonutSlice } from '../../components/charts/DonutMetricChart';
import { GetStatementView } from './GetStatementView';

export interface ReportsPageProps {
  initialTab?: 'statement' | 'analytics';
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ initialTab = 'statement' }) => {
  const { formatMoney } = useSettings();
  const [activeTab, setActiveTab] = useState<'statement' | 'analytics'>(initialTab);

  const orders = db.getOrders();
  const products = db.getProducts(true);

  // High-level metrics
  const netSales = useMemo(() => {
    return orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total_amount, 0);
  }, [orders]);

  const totalOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'Cancelled').length;
  }, [orders]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {};
    orders
      .filter(o => o.status !== 'Cancelled')
      .forEach(o => {
        o.items.forEach(it => {
          if (!counts[it.sku]) {
            counts[it.sku] = {
              name: it.product_name,
              sku: it.sku,
              qty: 0,
              revenue: 0,
            };
          }
          counts[it.sku].qty += it.quantity;
          counts[it.sku].revenue += it.subtotal;
        });
      });
    return Object.values(counts).sort((a, b) => b.qty - a.qty);
  }, [orders]);

  // Channel Distribution
  const channelPerformance = useMemo(() => {
    const channels: Record<string, { count: number; total: number }> = {};
    orders
      .filter(o => o.status !== 'Cancelled')
      .forEach(o => {
        const name = o.sales_channel_name || 'Direct';
        if (!channels[name]) {
          channels[name] = { count: 0, total: 0 };
        }
        channels[name].count += 1;
        channels[name].total += o.total_amount;
      });
    return Object.entries(channels).map(([name, data]) => ({ name, ...data }));
  }, [orders]);

  const channelSlices: DonutSlice[] = useMemo(() => {
    const palette = ['#2563EB', '#059669', '#7C3AED', '#D97706', '#E11D48'];
    return channelPerformance.map((ch, idx) => ({
      id: `rep-ch-${idx}`,
      label: ch.name,
      value: ch.total,
      formattedValue: formatMoney(ch.total),
      color: palette[idx % palette.length],
    }));
  }, [channelPerformance, formatMoney]);

  // Monthly revenue trend
  const monthlyRevenueData: DataPoint[] = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, idx) => {
      const rev = idx === 0 ? 3200 : idx === 1 ? 4800 : idx === 2 ? 6500 : idx === 3 ? 5400 : idx === 4 ? 7200 : idx === 5 ? 8900 : (idx + 1) * 1100 + 4000;
      return {
        label: m,
        value: rev,
      };
    });
  }, []);

  // Quick export handlers
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) return;
    const flat = orders.map(o => ({
      order_number: o.order_number,
      date: o.order_date,
      customer: o.customer_name,
      channel: o.sales_channel_name,
      status: o.status,
      total_amount: o.total_amount,
    }));
    const keys = Object.keys(flat[0]);
    const csv = [keys.join(','), ...flat.map(r => keys.map(k => `"${(r as any)[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `orders_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBackup = () => {
    const backupJson = db.exportDatabaseBackup(false);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reyra_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="reports-page-container" className="space-y-5 pb-8 select-none">
      {/* Friendly Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports &amp; Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download statements for any time period and view your sales performance
          </p>
        </div>

        {/* Quick Data Export Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportOrdersCSV}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download all orders as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Orders</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download full backup"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Backup Data</span>
          </button>
        </div>
      </div>

      {/* 2 Simple Tabs: Sales Statement vs Sales Trends */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('statement')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'statement'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Sales Statement</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales Trends</span>
        </button>
      </div>

      {/* Tab 1: Sales Statement (Primary Request) */}
      {activeTab === 'statement' && <GetStatementView />}

      {/* Tab 2: Simple, Friendly Sales Trends */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Quick Summary Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">All-Time Revenue</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatMoney(netSales)}
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">{totalOrders} completed orders</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Catalog Products</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {products.length} <span className="text-xs font-normal text-slate-400">items</span>
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">Active for sale</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Top Product</span>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1 truncate">
                {topProducts[0]?.name || 'No sales yet'}
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">
                {topProducts[0] ? `${topProducts[0].qty} units sold` : '—'}
              </span>
            </div>
          </div>

          {/* Simple Sales Trend Chart */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Monthly Sales Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Revenue trajectory over the year
              </p>
            </div>
            <ProfessionalAreaChart
              data={monthlyRevenueData}
              colorScheme="blue"
              primaryLabel="Sales"
              formatValue={val => formatMoney(val)}
              height={200}
            />
          </div>

          {/* Channels & Top Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sales by Channel */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600" /> Sales by Channel
              </h3>
              <DonutMetricChart
                slices={channelSlices}
                totalLabel="Total Sales"
                totalFormatted={formatMoney(netSales)}
                size={150}
                thickness={16}
              />
            </div>

            {/* Top 5 Products */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" /> Best Selling Products
              </h3>

              <div className="space-y-3 pt-1">
                {topProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No sales recorded yet.
                  </div>
                ) : (
                  topProducts.slice(0, 5).map((tp, idx) => {
                    const maxQty = Math.max(...topProducts.map(p => p.qty), 1);
                    const barPct = Math.round((tp.qty / maxQty) * 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                            {tp.name}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {formatMoney(tp.revenue)} ({tp.qty} pcs)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
