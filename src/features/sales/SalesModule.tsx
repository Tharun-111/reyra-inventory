import React, { useState } from 'react';
import { ShoppingBag, FileText, Users, RotateCcw } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { OrdersTab } from './OrdersTab';
import { InvoicesTab } from './InvoicesTab';
import { CustomersTab } from './CustomersTab';
import { ReturnsTab } from './ReturnsTab';

export type SalesSubTab = 'orders' | 'invoices' | 'customers' | 'returns';

interface SalesModuleProps {
  initialTab?: SalesSubTab;
  initialOrderStatusFilter?: OrderStatus | 'ALL';
  initialSearchQuery?: string;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  initialTab = 'orders',
  initialOrderStatusFilter = 'ALL',
  initialSearchQuery = '',
}) => {
  const [activeTab, setActiveTab] = useState<SalesSubTab>(initialTab);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleNavigateToInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setActiveTab('invoices');
  };

  const handleNavigateToReturn = (order: Order) => {
    setSelectedOrderForReturn(order);
    setActiveTab('returns');
  };

  return (
    <div id="sales-module-container" className="space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sales &amp; Orders Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer orders, billing invoices, customer registry, and processed returns
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            id="tab-sales-orders"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Recent Orders
          </button>

          <button
            id="tab-sales-invoices"
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Invoices
          </button>

          <button
            id="tab-sales-customers"
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'customers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Customers
          </button>

          <button
            id="tab-sales-returns"
            onClick={() => setActiveTab('returns')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'returns'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Returns
          </button>
        </div>
      </div>

      {/* Sub-Tab Views */}
      {activeTab === 'orders' && (
        <OrdersTab
          initialStatusFilter={initialOrderStatusFilter}
          initialSearchQuery={initialSearchQuery}
          onNavigateToInvoicesWithOrder={handleNavigateToInvoice}
          onNavigateToReturnsWithOrder={handleNavigateToReturn}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoicesTab preselectedOrderForInvoice={selectedOrderForInvoice} />
      )}

      {activeTab === 'customers' && <CustomersTab />}

      {activeTab === 'returns' && (
        <ReturnsTab preselectedOrderForReturn={selectedOrderForReturn} />
      )}
    </div>
  );
};
