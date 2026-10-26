import React from 'react';
import { Inbox, CheckCircle2, Truck, CheckCheck, RotateCcw, ArrowRight } from 'lucide-react';
import { OrderStatus } from '../../types';

interface OrderFunnelProps {
  counts: {
    received: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    returns: number;
  };
  onSelectStatus?: (status: OrderStatus) => void;
  className?: string;
}

export const OrderFunnelInfographic: React.FC<OrderFunnelProps> = ({
  counts,
  onSelectStatus,
  className = '',
}) => {
  const totalPipeline = counts.received + counts.confirmed + counts.shipped + counts.delivered || 1;

  const stages = [
    {
      id: 'Received' as OrderStatus,
      name: 'Received',
      count: counts.received,
      icon: Inbox,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
      badge: 'Pending Review',
    },
    {
      id: 'Confirmed' as OrderStatus,
      name: 'Confirmed',
      count: counts.confirmed,
      icon: CheckCircle2,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
      badge: 'Ready to Pack',
    },
    {
      id: 'Shipped' as OrderStatus,
      name: 'In Transit',
      count: counts.shipped,
      icon: Truck,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900',
      badge: 'Dispatched',
    },
    {
      id: 'Delivered' as OrderStatus,
      name: 'Fulfilled',
      count: counts.delivered,
      icon: CheckCheck,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
      badge: 'Completed',
    },
  ];

  const fulfillmentRate = ((counts.delivered / totalPipeline) * 100).toFixed(1);
  const returnRate = ((counts.returns / (counts.delivered || 1)) * 100).toFixed(1);

  return (
    <div className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 ${className}`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Fulfillment Pipeline &amp; Conversion</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time pipeline progression from order capture to delivery settlement
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-900 font-semibold">
            <span>Fulfillment Rate:</span>
            <span className="font-bold">{fulfillmentRate}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-900 font-semibold">
            <RotateCcw className="w-3 h-3" />
            <span>Return Rate:</span>
            <span className="font-bold">{returnRate}%</span>
          </div>
        </div>
      </div>

      {/* Stage Cards Connected with Arrows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const share = ((stage.count / totalPipeline) * 100).toFixed(0);

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStatus && onSelectStatus(stage.id)}
              className={`p-3.5 rounded-xl border ${stage.bgColor} transition-all duration-150 cursor-pointer hover:scale-[1.02] hover:shadow-xs group relative flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${stage.color} text-white flex items-center justify-center shadow-xs`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block leading-none">
                      {stage.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {stage.badge}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-semibold text-slate-400">
                  {share}%
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stage.count}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-0.5">
                  Filter <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {/* Progress bar line */}
              <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${stage.color} rounded-full`}
                  style={{ width: `${Math.max(Number(share), 8)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
