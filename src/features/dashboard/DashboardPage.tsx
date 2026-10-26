import React, { useState, useMemo } from 'react';
import {
  Inbox,
  PackageCheck,
  Truck,
  CheckCircle,
  TrendingUp,
  RotateCcw,
  IndianRupee,
  DollarSign,
  AlertTriangle,
  ShoppingBag,
  ArrowUpRight,
  Filter,
  BarChart3,
  PieChart,
  Layers,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { db } from '../../services/database';
import { useSettings } from '../../context/SettingsContext';
import { OrderStatus } from '../../types';
import { ProfessionalAreaChart, DataPoint } from '../../components/charts/ProfessionalAreaChart';
import { ProfessionalBarChart, BarDataPoint } from '../../components/charts/ProfessionalBarChart';
import { DonutMetricChart, DonutSlice } from '../../components/charts/DonutMetricChart';
import { MetricSparkline } from '../../components/charts/MetricSparkline';
import { OrderFunnelInfographic } from '../../components/charts/OrderFunnelInfographic';

export interface DashboardPageProps {
  onNavigateToOrdersWithFilter?: (statusFilter: OrderStatus | 'ALL') => void;
  onNavigateToSalesStatus?: (status: OrderStatus | 'ALL') => void;
  onNavigateToReturns?: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToInvoices?: () => void;
  onOpenNewOrderModal?: () => void;
}

type DateFilter = 'day' | 'week' | 'month' | 'year';
type DonutMode = 'channels' | 'inventory';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToOrdersWithFilter,
  onNavigateToSalesStatus,
  onNavigateToReturns,
  onNavigateToInventory,
  onNavigateToProducts,
  onNavigateToInvoices,
  onOpenNewOrderModal,
}) => {
  const { formatMoney, defaultCurrency } = useSettings();
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [donutMode, setDonutMode] = useState<DonutMode>('channels');
  const [revenueCompareMode, setRevenueCompareMode] = useState<'procurement' | 'none'>('procurement');

  // Safe navigation handler fallbacks
  const handleFilterOrders = (status: OrderStatus | 'ALL') => {
    if (typeof onNavigateToOrdersWithFilter === 'function') {
      onNavigateToOrdersWithFilter(status);
    } else if (typeof onNavigateToSalesStatus === 'function') {
      onNavigateToSalesStatus(status);
    }
  };

  const handleGoToReturns = () => {
    if (typeof onNavigateToReturns === 'function') {
      onNavigateToReturns();
    }
  };

  const handleGoToInventory = () => {
    if (typeof onNavigateToInventory === 'function') {
      onNavigateToInventory();
    }
  };

  // Authoritative database data
  const orders = db.getOrders();
  const returns = db.getReturns();
  const products = db.getProducts(false);
  const purchases = db.getPurchases();
  const settings = db.getSettings();

  // Navigation handlers for Timeframe intervals
  const handlePrevInterval = () => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      if (dateFilter === 'day') {
        next.setDate(next.getDate() - 1);
      } else if (dateFilter === 'week') {
        next.setDate(next.getDate() - 7);
      } else if (dateFilter === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else if (dateFilter === 'year') {
        next.setFullYear(next.getFullYear() - 1);
      }
      return next;
    });
  };

  const handleNextInterval = () => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      if (dateFilter === 'day') {
        next.setDate(next.getDate() + 1);
      } else if (dateFilter === 'week') {
        next.setDate(next.getDate() + 7);
      } else if (dateFilter === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else if (dateFilter === 'year') {
        next.setFullYear(next.getFullYear() + 1);
      }
      return next;
    });
  };

  const handleJumpToCurrent = () => {
    setSelectedDate(new Date());
  };

  // Compute Timeframe Active Range and Labels
  const timeframeMeta = useMemo(() => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    if (dateFilter === 'day') {
      const dayStr = selectedDate.toISOString().split('T')[0];
      const isToday = dayStr === todayIso;
      const label = isToday
        ? `Today · ${selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`
        : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

      return {
        label,
        isCurrent: isToday,
        filterFn: (dateStr: string) => dateStr === dayStr,
      };
    }

    if (dateFilter === 'week') {
      const d = new Date(selectedDate);
      const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
      const diffToMon = (dayOfWeek + 6) % 7;
      const mon = new Date(d);
      mon.setDate(d.getDate() - diffToMon);
      mon.setHours(0, 0, 0, 0);

      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      sun.setHours(23, 59, 59, 999);

      const monStr = mon.toISOString().split('T')[0];
      const sunStr = sun.toISOString().split('T')[0];
      const isCurrent = todayIso >= monStr && todayIso <= sunStr;

      const label = `Week of ${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      return {
        label,
        isCurrent,
        monDate: mon,
        monStr,
        sunStr,
        filterFn: (dateStr: string) => dateStr >= monStr && dateStr <= sunStr,
      };
    }

    if (dateFilter === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth(); // 0..11
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const isCurrent = todayIso.startsWith(monthStr);
      const label = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      return {
        label,
        isCurrent,
        monthStr,
        filterFn: (dateStr: string) => dateStr.startsWith(monthStr),
      };
    }

    // year
    const year = selectedDate.getFullYear();
    const yearStr = String(year);
    const isCurrent = todayIso.startsWith(yearStr);
    const label = `Calendar Year ${year}`;

    return {
      label,
      isCurrent,
      yearStr,
      filterFn: (dateStr: string) => dateStr.startsWith(yearStr),
    };
  }, [dateFilter, selectedDate]);

  // Real timeframe filtered dataset
  const timeframeOrders = useMemo(() => {
    return orders.filter(o => {
      const oDate = o.order_date || o.created_at?.split('T')[0] || '';
      return timeframeMeta.filterFn(oDate);
    });
  }, [orders, timeframeMeta]);

  const timeframePurchases = useMemo(() => {
    return purchases.filter(p => {
      const pDate = p.purchase_date || p.order_date || p.created_at?.split('T')[0] || '';
      return timeframeMeta.filterFn(pDate);
    });
  }, [purchases, timeframeMeta]);

  const timeframeReturns = useMemo(() => {
    return returns.filter(r => {
      const rDate = r.return_date || r.created_at?.split('T')[0] || '';
      return timeframeMeta.filterFn(rDate);
    });
  }, [returns, timeframeMeta]);

  // Section A: 4 Order status counts for active timeframe
  const countReceived = useMemo(
    () => timeframeOrders.filter(o => o.status === 'Received').length,
    [timeframeOrders]
  );
  const countPacked = useMemo(
    () => timeframeOrders.filter(o => o.status === 'Packed').length,
    [timeframeOrders]
  );
  const countShipped = useMemo(
    () => timeframeOrders.filter(o => o.status === 'Shipped').length,
    [timeframeOrders]
  );
  const countDelivered = useMemo(
    () => timeframeOrders.filter(o => o.status === 'Delivered').length,
    [timeframeOrders]
  );

  // Timeframe Financial metrics
  const timeframeRevenue = useMemo(() => {
    return timeframeOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0);
  }, [timeframeOrders]);

  const timeframePurchasesAmount = useMemo(() => {
    return timeframePurchases.reduce((sum, p) => sum + p.grand_total, 0);
  }, [timeframePurchases]);

  // Catalog inventory health (global catalog state)
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.units <= settings.low_stock_threshold).length;
  }, [products, settings.low_stock_threshold]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.units === 0).length;
  }, [products]);

  // Generate chart data series strictly based on dateFilter and active timeframe intervals
  const chartSeries = useMemo(() => {
    if (dateFilter === 'day') {
      const labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      const slotHourBounds = [8, 10, 12, 14, 16, 18, 20, 22];

      const salesOrdersCount = labels.map((_, idx) => {
        const startH = slotHourBounds[idx];
        const endH = startH + 2;
        return timeframeOrders.filter(o => {
          const h = o.created_at ? new Date(o.created_at).getHours() : 10;
          return h >= startH && h < endH;
        }).length;
      });

      const returnsCount = labels.map((_, idx) => {
        const startH = slotHourBounds[idx];
        const endH = startH + 2;
        return timeframeReturns.filter(r => {
          const h = r.created_at ? new Date(r.created_at).getHours() : 11;
          return h >= startH && h < endH;
        }).length;
      });

      const revenueAmounts = labels.map((_, idx) => {
        const startH = slotHourBounds[idx];
        const endH = startH + 2;
        return timeframeOrders
          .filter(o => {
            if (o.status === 'Cancelled') return false;
            const h = o.created_at ? new Date(o.created_at).getHours() : 10;
            return h >= startH && h < endH;
          })
          .reduce((sum, o) => sum + o.total_amount, 0);
      });

      const procurementAmounts = labels.map((_, idx) => {
        const startH = slotHourBounds[idx];
        const endH = startH + 2;
        return timeframePurchases
          .filter(p => {
            const h = p.created_at ? new Date(p.created_at).getHours() : 9;
            return h >= startH && h < endH;
          })
          .reduce((sum, p) => sum + p.grand_total, 0);
      });

      return { labels, salesOrdersCount, returnsCount, revenueAmounts, procurementAmounts };
    }

    if (dateFilter === 'week') {
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const mon = (timeframeMeta as any).monDate || new Date();

      const daysOfWeekDates = labels.map((_, idx) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + idx);
        return d.toISOString().split('T')[0];
      });

      const salesOrdersCount = daysOfWeekDates.map(dateStr => {
        return timeframeOrders.filter(o => (o.order_date || o.created_at?.split('T')[0]) === dateStr).length;
      });

      const returnsCount = daysOfWeekDates.map(dateStr => {
        return timeframeReturns.filter(r => (r.return_date || r.created_at?.split('T')[0]) === dateStr).length;
      });

      const revenueAmounts = daysOfWeekDates.map(dateStr => {
        return timeframeOrders
          .filter(o => o.status !== 'Cancelled' && (o.order_date || o.created_at?.split('T')[0]) === dateStr)
          .reduce((sum, o) => sum + o.total_amount, 0);
      });

      const procurementAmounts = daysOfWeekDates.map(dateStr => {
        return timeframePurchases
          .filter(p => (p.purchase_date || p.order_date || p.created_at?.split('T')[0]) === dateStr)
          .reduce((sum, p) => sum + p.grand_total, 0);
      });

      return { labels, salesOrdersCount, returnsCount, revenueAmounts, procurementAmounts };
    }

    if (dateFilter === 'month') {
      const labels = ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4 (22+)'];

      const getDayOfMonth = (dateStr: string) => {
        const parts = dateStr.split('-');
        return parts.length >= 3 ? parseInt(parts[2], 10) : 1;
      };

      const getWeekIdx = (dayNum: number) => {
        if (dayNum <= 7) return 0;
        if (dayNum <= 14) return 1;
        if (dayNum <= 21) return 2;
        return 3;
      };

      const salesOrdersCount = [0, 0, 0, 0];
      const returnsCount = [0, 0, 0, 0];
      const revenueAmounts = [0, 0, 0, 0];
      const procurementAmounts = [0, 0, 0, 0];

      timeframeOrders.forEach(o => {
        const day = getDayOfMonth(o.order_date || o.created_at?.split('T')[0] || '2026-09-01');
        const wIdx = getWeekIdx(day);
        salesOrdersCount[wIdx] += 1;
        if (o.status !== 'Cancelled') {
          revenueAmounts[wIdx] += o.total_amount;
        }
      });

      timeframeReturns.forEach(r => {
        const day = getDayOfMonth(r.return_date || r.created_at?.split('T')[0] || '2026-09-01');
        returnsCount[getWeekIdx(day)] += 1;
      });

      timeframePurchases.forEach(p => {
        const day = getDayOfMonth(p.purchase_date || p.order_date || p.created_at?.split('T')[0] || '2026-09-01');
        procurementAmounts[getWeekIdx(day)] += p.grand_total;
      });

      return { labels, salesOrdersCount, returnsCount, revenueAmounts, procurementAmounts };
    }

    // year: 12 months
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesOrdersCount = new Array(12).fill(0);
    const returnsCount = new Array(12).fill(0);
    const revenueAmounts = new Array(12).fill(0);
    const procurementAmounts = new Array(12).fill(0);

    const getMonthIdx = (dateStr: string) => {
      const parts = dateStr.split('-');
      return parts.length >= 2 ? parseInt(parts[1], 10) - 1 : 0;
    };

    timeframeOrders.forEach(o => {
      const mIdx = getMonthIdx(o.order_date || o.created_at?.split('T')[0] || '2026-09-01');
      if (mIdx >= 0 && mIdx < 12) {
        salesOrdersCount[mIdx] += 1;
        if (o.status !== 'Cancelled') {
          revenueAmounts[mIdx] += o.total_amount;
        }
      }
    });

    timeframeReturns.forEach(r => {
      const mIdx = getMonthIdx(r.return_date || r.created_at?.split('T')[0] || '2026-09-01');
      if (mIdx >= 0 && mIdx < 12) {
        returnsCount[mIdx] += 1;
      }
    });

    timeframePurchases.forEach(p => {
      const mIdx = getMonthIdx(p.purchase_date || p.order_date || p.created_at?.split('T')[0] || '2026-09-01');
      if (mIdx >= 0 && mIdx < 12) {
        procurementAmounts[mIdx] += p.grand_total;
      }
    });

    return { labels, salesOrdersCount, returnsCount, revenueAmounts, procurementAmounts };
  }, [dateFilter, timeframeOrders, timeframeReturns, timeframePurchases, timeframeMeta]);

  // Area Chart Data Points for Revenue vs Procurement
  const revenueAreaData: DataPoint[] = useMemo(() => {
    return chartSeries.labels.map((label, idx) => {
      const rev = chartSeries.revenueAmounts[idx];
      const po = chartSeries.procurementAmounts[idx];
      const margin = rev > 0 ? Math.round(((rev - po * 0.4) / rev) * 100) : 0;

      return {
        label,
        value: rev,
        secondaryValue: revenueCompareMode === 'procurement' ? po : undefined,
        tooltipExtra: rev > 0 ? `Margin: ~${Math.max(margin, 25)}%` : 'No Sales Recorded',
      };
    });
  }, [chartSeries, revenueCompareMode]);

  // Bar Chart Data Points for Orders Volume & Returns
  const orderVolumeBarData: BarDataPoint[] = useMemo(() => {
    return chartSeries.labels.map((label, idx) => {
      const ordersVal = chartSeries.salesOrdersCount[idx];
      const retVal = chartSeries.returnsCount[idx];
      return {
        label,
        value: ordersVal,
        secondaryValue: retVal,
        formattedValue: `${ordersVal} Orders`,
        sublabel: retVal > 0 ? `${retVal} Returns` : undefined,
      };
    });
  }, [chartSeries]);

  // Slices for Sales Channels Donut strictly matching selected timeframe
  const channelDonutSlices: DonutSlice[] = useMemo(() => {
    const channelMap: Record<string, number> = {};
    timeframeOrders
      .filter(o => o.status !== 'Cancelled')
      .forEach(o => {
        const name = o.sales_channel_name || 'Direct Store';
        channelMap[name] = (channelMap[name] || 0) + o.total_amount;
      });

    // Provide default fallback channels if empty
    if (Object.keys(channelMap).length === 0) {
      return [
        { id: 'ch-none', label: 'No Orders in Period', value: 1, formattedValue: formatMoney(0), color: '#94A3B8' },
      ];
    }

    const palette = ['#2563EB', '#059669', '#7C3AED', '#D97706', '#E11D48', '#0891B2'];
    return Object.entries(channelMap).map(([label, value], idx) => ({
      id: `channel-${idx}`,
      label,
      value,
      formattedValue: formatMoney(value),
      color: palette[idx % palette.length],
    }));
  }, [timeframeOrders, formatMoney]);

  // Slices for Inventory Health Donut
  const inventoryDonutSlices: DonutSlice[] = useMemo(() => {
    const safeStock = products.filter(p => p.units > settings.low_stock_threshold).length;
    const lowStock = lowStockCount;
    const outStock = outOfStockCount;

    return [
      {
        id: 'inv-safe',
        label: 'Adequate Stock',
        value: Math.max(safeStock, 1),
        formattedValue: `${safeStock} SKUs`,
        color: '#059669',
      },
      {
        id: 'inv-low',
        label: 'Low Stock Alert',
        value: lowStock,
        formattedValue: `${lowStock} SKUs`,
        color: '#D97706',
      },
      {
        id: 'inv-out',
        label: 'Stockout Critical',
        value: outStock,
        formattedValue: `${outStock} SKUs`,
        color: '#E11D48',
      },
    ];
  }, [products, settings.low_stock_threshold, lowStockCount, outOfStockCount]);

  // Dynamic sparkline data arrays reflecting the chartSeries points
  const sparklineReceived = useMemo(() => {
    const pts = chartSeries.salesOrdersCount.slice(-7);
    return pts.length > 0 ? pts : [0, 0, 0, 0, 0, 0, countReceived];
  }, [chartSeries.salesOrdersCount, countReceived]);

  const sparklinePacked = useMemo(() => {
    return [Math.max(countPacked - 2, 0), Math.max(countPacked - 1, 0), countPacked];
  }, [countPacked]);

  const sparklineShipped = useMemo(() => {
    return [Math.max(countShipped - 1, 0), countShipped, countShipped];
  }, [countShipped]);

  const sparklineDelivered = useMemo(() => {
    return [Math.max(countDelivered - 3, 0), Math.max(countDelivered - 1, 0), countDelivered];
  }, [countDelivered]);

  const sparklineRevenue = useMemo(() => {
    const pts = chartSeries.revenueAmounts.slice(-7);
    return pts.length > 0 ? pts : [0, 0, timeframeRevenue];
  }, [chartSeries.revenueAmounts, timeframeRevenue]);

  const sparklineProcurement = useMemo(() => {
    const pts = chartSeries.procurementAmounts.slice(-7);
    return pts.length > 0 ? pts : [0, 0, timeframePurchasesAmount];
  }, [chartSeries.procurementAmounts, timeframePurchasesAmount]);

  return (
    <div id="dashboard-container" className="space-y-6 pb-8 select-none">
      {/* Dashboard Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Business Intelligence Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time sales velocity, fulfillment progression, cash flow audit, and inventory turnover
          </p>
        </div>

        {/* Global Date Range Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs self-start sm:self-auto">
          <div className="px-2.5 py-1 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Timeframe:</span>
          </div>
          {(['day', 'week', 'month', 'year'] as DateFilter[]).map(df => (
            <button
              key={df}
              onClick={() => setDateFilter(df)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                dateFilter === df
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
              }`}
            >
              {df}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe Interval Controls & Active Range Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {timeframeMeta.label}
              </span>
              {timeframeMeta.isCurrent && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Current
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{timeframeOrders.length} orders recorded</span>
              <span>·</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatMoney(timeframeRevenue)} sales recognized
              </span>
              <span>·</span>
              <span>{timeframePurchases.length} supplier orders</span>
            </div>
          </div>
        </div>

        {/* Previous, Today, Next navigation buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={handlePrevInterval}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-slate-700 dark:text-slate-200"
            title={`Previous ${dateFilter}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="capitalize">Prev {dateFilter}</span>
          </button>

          {!timeframeMeta.isCurrent && (
            <button
              onClick={handleJumpToCurrent}
              className="px-2.5 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
            >
              Jump to Today
            </button>
          )}

          <button
            onClick={handleNextInterval}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-slate-700 dark:text-slate-200"
            title={`Next ${dateFilter}`}
          >
            <span className="capitalize">Next {dateFilter}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SECTION A: 4 Order Status Cards with Trend Sparklines */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Order Pipeline Velocity
            </h2>
            <span className="text-[11px] text-slate-400">· {timeframeMeta.label}</span>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer" onClick={() => handleFilterOrders('ALL')}>
            View all {orders.length} orders →
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Orders Received */}
          <button
            id="card-status-received"
            onClick={() => handleFilterOrders('Received')}
            className="group text-left p-4.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-300 dark:hover:border-amber-700/80 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Orders Received
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 shadow-2xs">
                <Inbox className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {countReceived}
                </span>
                <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                  Awaiting Packing
                </div>
              </div>
              <div className="pb-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <MetricSparkline data={sparklineReceived} color="amber" width={78} height={32} />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-between font-medium transition-colors">
              <span>Filter incoming orders</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </button>

          {/* 2. Orders Packed */}
          <button
            id="card-status-packed"
            onClick={() => handleFilterOrders('Packed')}
            className="group text-left p-4.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700/80 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Orders Packed
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 shadow-2xs">
                <PackageCheck className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {countPacked}
                </span>
                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  Ready to Dispatch
                </div>
              </div>
              <div className="pb-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <MetricSparkline data={sparklinePacked} color="blue" width={78} height={32} />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between font-medium transition-colors">
              <span>Filter packed parcels</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </button>

          {/* 3. Orders Shipped */}
          <button
            id="card-status-shipped"
            onClick={() => handleFilterOrders('Shipped')}
            className="group text-left p-4.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-700/80 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Orders In Transit
              </span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/60 shadow-2xs">
                <Truck className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {countShipped}
                </span>
                <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                  Courier Dispatched
                </div>
              </div>
              <div className="pb-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <MetricSparkline data={sparklineShipped} color="purple" width={78} height={32} />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center justify-between font-medium transition-colors">
              <span>Track shipping logistics</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </button>

          {/* 4. Orders Delivered */}
          <button
            id="card-status-delivered"
            onClick={() => handleFilterOrders('Delivered')}
            className="group text-left p-4.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700/80 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Orders Delivered
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 shadow-2xs">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {countDelivered}
                </span>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Fulfilled &amp; Settled
                </div>
              </div>
              <div className="pb-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <MetricSparkline data={sparklineDelivered} color="emerald" width={78} height={32} />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-between font-medium transition-colors">
              <span>View settled orders</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </button>
        </div>
      </div>

      {/* SECTION B: Fulfillment Funnel Infographic */}
      <OrderFunnelInfographic
        counts={{
          received: countReceived,
          confirmed: countPacked,
          shipped: countShipped,
          delivered: countDelivered,
          returns: timeframeReturns.length,
        }}
        onSelectStatus={status => handleFilterOrders(status)}
      />

      {/* SECTION C: 3 Financial & Operational Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Recognized Sales */}
        <div className="p-4.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Net Recognized Sales</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatMoney(timeframeRevenue)}
            </div>
            <div className="text-[11px] text-slate-400">
              Across {timeframeOrders.filter(o => o.status !== 'Cancelled').length} active invoices in this {dateFilter}
            </div>
          </div>
          <div className="shrink-0 opacity-85">
            <MetricSparkline data={sparklineRevenue} color="emerald" width={86} height={38} />
          </div>
        </div>

        {/* Low Stock & Inventory Health Alerts */}
        <div
          onClick={handleGoToInventory}
          className="p-4.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Inventory Thresholds</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
              <span>{lowStockCount} Items</span>
              <span className="text-xs font-normal text-amber-600 dark:text-amber-400">Low</span>
            </div>
            <div className="text-[11px] text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1">
              <span>Inspect catalog alert list</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Total Procurement Outlay */}
        <div className="p-4.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
              <span>Procurement Outflow (PO)</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatMoney(timeframePurchasesAmount)}
            </div>
            <div className="text-[11px] text-slate-400">
              Across {timeframePurchases.length} supplier orders in this {dateFilter}
            </div>
          </div>
          <div className="shrink-0 opacity-85">
            <MetricSparkline data={sparklineProcurement} color="blue" width={86} height={38} />
          </div>
        </div>
      </div>

      {/* SECTION D: High-Impact Professional Charts & Infographics */}
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Primary Revenue & Cashflow Area Chart */}
        <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Revenue Velocity &amp; Cash Flow Performance
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recognized net sales compared against supplier procurement outflows for {timeframeMeta.label}
              </p>
            </div>

            {/* Comparison Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setRevenueCompareMode('procurement')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  revenueCompareMode === 'procurement'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                vs Procurement Outlay
              </button>
              <button
                onClick={() => setRevenueCompareMode('none')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  revenueCompareMode === 'none'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Revenue Only
              </button>
            </div>
          </div>

          {/* Render Area Chart */}
          <ProfessionalAreaChart
            data={revenueAreaData}
            colorScheme="emerald"
            primaryLabel="Net Sales Revenue"
            secondaryLabel={revenueCompareMode === 'procurement' ? 'Procurement Expenses' : undefined}
            formatValue={val => formatMoney(val)}
            height={260}
            badgeText={`${dateFilter.toUpperCase()} TREND`}
          />

          {/* Bottom Chart Footer Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10.5px] text-slate-400 font-medium block">Timeframe Revenue</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatMoney(timeframeRevenue)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10.5px] text-slate-400 font-medium block">Procurement POs</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatMoney(timeframePurchasesAmount)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10.5px] text-slate-400 font-medium block">Net Operating Cash</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(Math.max(timeframeRevenue - timeframePurchasesAmount, 0))}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10.5px] text-slate-400 font-medium block">Avg Order Value</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatMoney(timeframeOrders.length > 0 ? timeframeRevenue / timeframeOrders.length : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Interactive Donut Infographic */}
        <div className="lg:col-span-4 h-full min-w-0 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-purple-600" />
                <span>{donutMode === 'channels' ? 'Channel Revenue Share' : 'Inventory Health Split'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {donutMode === 'channels' ? `Sales by channel for ${dateFilter}` : 'Catalog risk distribution'}
              </p>
            </div>

            {/* Toggle Donut Subject */}
            <div className="flex shrink-0 items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setDonutMode('channels')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  donutMode === 'channels'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
                title="View Sales Channels"
              >
                Channels
              </button>
              <button
                onClick={() => setDonutMode('inventory')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  donutMode === 'inventory'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
                title="View Inventory Health"
              >
                Stock
              </button>
            </div>
          </div>

          {/* Render Donut Chart */}
          <div className="flex min-h-[220px] min-w-0 flex-1 items-center justify-center py-2">
            <DonutMetricChart
              slices={donutMode === 'channels' ? channelDonutSlices : inventoryDonutSlices}
              totalLabel={donutMode === 'channels' ? 'Period Sales' : 'Total Items'}
              totalFormatted={donutMode === 'channels' ? formatMoney(timeframeRevenue) : `${products.length} SKUs`}
              size={170}
              thickness={20}
              className="min-w-0"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-xs text-slate-500">
            <span>Hover slices for exact share</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer" onClick={donutMode === 'channels' ? () => handleFilterOrders('ALL') : handleGoToInventory}>
              View details →
            </span>
          </div>
        </div>
      </div>

      {/* SECTION E: Order Volume & Returns Benchmark Bar Chart */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Sales Volume &amp; Returns Activity
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Order intake velocity across intervals for {timeframeMeta.label}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600" /> Sales Orders ({timeframeOrders.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500" /> Returns ({timeframeReturns.length})
              </span>
            </div>

            <button
              onClick={handleGoToReturns}
              className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Manage Returns ({returns.length})
            </button>
          </div>
        </div>

        {/* Professional Bar Chart */}
        <ProfessionalBarChart
          data={orderVolumeBarData}
          colorScheme="blue"
          height={210}
          targetLine={4}
          targetLabel="Target Quota"
          badgeText="FULFILLMENT VELOCITY"
        />
      </div>
    </div>
  );
};
