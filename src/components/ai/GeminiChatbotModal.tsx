import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Package,
  TrendingUp,
  Truck,
  AlertCircle,
  HelpCircle,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { db } from '../../services/database';

export type ChatRoleType = 'general' | 'inventory' | 'sales' | 'procurement';
export type GeminiModelType = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const ROLE_DEFINITIONS: Record<
  ChatRoleType,
  {
    name: string;
    description: string;
    icon: any;
    defaultModel: GeminiModelType;
    systemInstruction: string;
  }
> = {
  general: {
    name: 'Executive ERP Assistant',
    description: 'Comprehensive business advisor across inventory, sales, and supply chain',
    icon: Sparkles,
    defaultModel: 'gemini-3.5-flash',
    systemInstruction: `You are the Executive ERP & Business Assistant for this enterprise. 
You provide high-level strategic summaries, help analyze store health, interpret sales data, and recommend operational optimizations. 
Format your responses cleanly with markdown headings, bullet points, and concise action steps.`,
  },
  inventory: {
    name: 'Inventory Specialist',
    description: 'Safety stock, reorder levels, warehouse tracking & low stock remediation',
    icon: Package,
    defaultModel: 'gemini-3.5-flash',
    systemInstruction: `You are an expert Inventory Management & Stock Operations Specialist.
Your focus is to monitor SKU stock quantities, identify out-of-stock or low-stock risks, calculate optimal reorder points, minimize holding costs, and prevent stockouts.
Use the provided ERP real-time inventory context to answer queries accurately.`,
  },
  sales: {
    name: 'Sales & Revenue Analyst',
    description: 'Order fulfillment, customer metrics, invoice settlement & margin growth',
    icon: TrendingUp,
    defaultModel: 'gemini-3.5-flash',
    systemInstruction: `You are a Senior Sales & Commercial Analyst.
Your duty is to track sales order pipelines, channel revenues (e.g., offline store, website, Amazon), customer spend patterns, invoice statuses, and returns.
Offer actionable sales advice, pricing recommendations, and insights into order fulfillment bottlenecks.`,
  },
  procurement: {
    name: 'Procurement & Sourcing Advisor',
    description: 'Purchase orders, vendor negotiations, lead times & batch replenishment',
    icon: Truck,
    defaultModel: 'gemini-3.1-pro-preview',
    systemInstruction: `You are a Procurement & Supply Chain Strategist.
You specialize in evaluating purchase orders (POs), calculating replenishment quantities based on current sales velocity, assessing supplier lead times, and structuring cost-effective bulk orders.
Deliver thorough, mathematically grounded procurement recommendations.`,
  },
};

const SUGGESTED_PROMPTS: Record<ChatRoleType, string[]> = {
  general: [
    'Give me an executive summary of current business health',
    'What are our top revenue-generating products and channels?',
    'What key risks or bottlenecks should management address today?',
  ],
  inventory: [
    'Which products are below the safety threshold and need urgent restocking?',
    'Review our stock distribution across single products and variants',
    'How should we handle out-of-stock items to minimize lost sales?',
  ],
  sales: [
    'What is the status breakdown of our recent sales orders?',
    'Which customers have the highest lifetime order spend?',
    'How can we reduce order turnaround time from pending to shipped?',
  ],
  procurement: [
    'Generate a purchase replenishment plan for low stock SKUs',
    'Analyze our purchase order spend and supplier delivery status',
    'Calculate unit cost margins and recommended order quantities',
  ],
};

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatRoleType>('general');
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>('gemini-3.5-flash');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_erp_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome-msg',
        role: 'model',
        text: 'Hello! I am your AI ERP Assistant powered by Gemini. I have real-time access to your product catalog, sales orders, inventory balances, and purchase records. How can I help streamline your operations today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Save conversation history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('gemini_erp_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Handle initial query if passed
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
    }
  }, [isOpen, initialQuery]);

  // Handle role change default model suggestion
  const handleRoleChange = (role: ChatRoleType) => {
    setSelectedRole(role);
    setSelectedModel(ROLE_DEFINITIONS[role].defaultModel);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear your conversation history?')) {
      const welcome: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        text: `Switched context to ${ROLE_DEFINITIONS[selectedRole].name}. How can I assist you with your operations?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcome]);
      setErrorMessage(null);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compile real-time ERP Context Snapshot
  const getERPContextSnapshot = () => {
    try {
      const products = db.getProducts(true);
      const lowStock = db.getLowStockProducts();
      const orders = db.getOrders();
      const purchases = db.getPurchases();
      const customers = db.getCustomers();
      const settings = db.getSettings();

      return {
        company: {
          name: settings.company_name || settings.brand_name,
          currency: settings.currency_code || 'INR',
          symbol: settings.currency_symbol || '₹',
          lowStockThreshold: settings.low_stock_threshold || 10,
        },
        catalog_summary: {
          total_products: products.length,
          total_inventory_units: products.reduce((acc, p) => acc + (p.units || 0), 0),
          low_stock_items_count: lowStock.length,
          low_stock_list: lowStock.map(p => ({
            name: p.name,
            sku: p.sku,
            current_units: p.units,
            buy_price: p.buy_price,
            selling_price: p.selling_price,
          })),
        },
        sales_summary: {
          total_orders: orders.length,
          recent_orders: orders.slice(0, 5).map(o => ({
            order_number: o.order_number,
            customer: o.customer_name,
            status: o.status,
            total: o.total_amount,
            date: o.order_date,
            items_count: o.items?.length || 0,
          })),
        },
        procurement_summary: {
          total_purchases: purchases.length,
          recent_purchases: purchases.slice(0, 5).map(p => ({
            po_number: p.po_number || p.purchase_number,
            vendor: p.vendor_name || p.sourcing_agency,
            status: p.status,
            total: p.grand_total,
            date: p.purchase_date,
          })),
        },
        customers_summary: {
          total_customers: customers.length,
        },
      };
    } catch {
      return null;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputMessage).trim();
    if (!queryText || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const erpContext = getERPContextSnapshot();
      const currentRoleConfig = ROLE_DEFINITIONS[selectedRole];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            text: m.text,
          })),
          model: selectedModel,
          systemInstruction: currentRoleConfig.systemInstruction,
          contextData: erpContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(
        err?.message || 'Failed to receive response from Gemini Assistant. Please check server logs.'
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="gemini-chatbot-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 overflow-hidden ${
          isExpanded
            ? 'h-[94vh] max-w-5xl'
            : 'h-[85vh] sm:h-[750px] max-w-3xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Chatbot Top Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Gemini ERP Assistant
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  <ShieldCheck className="w-3 h-3" /> Real-Time Database Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {ROLE_DEFINITIONS[selectedRole].description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear Conversation History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:inline-flex p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Restore Normal Size' : 'Expand Size'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role & Model Controls Bar */}
        <div className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Role selector */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-slate-400 text-[11px] font-semibold mr-1 shrink-0">Role:</span>
            {(Object.keys(ROLE_DEFINITIONS) as ChatRoleType[]).map(roleKey => {
              const r = ROLE_DEFINITIONS[roleKey];
              const Icon = r.icon;
              const isActive = selectedRole === roleKey;
              return (
                <button
                  key={roleKey}
                  onClick={() => handleRoleChange(roleKey)}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{r.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Model selector as requested */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-400 text-[11px] font-semibold mr-1 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Model:
            </span>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value as GeminiModelType)}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-mono text-[11px] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 space-y-2 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white shadow-xs rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 shadow-2xs rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans break-words">{msg.text}</div>

                  <div
                    className={`flex items-center justify-between gap-3 pt-1 border-t text-[10px] ${
                      isUser
                        ? 'border-blue-500/50 text-blue-100'
                        : 'border-slate-100 dark:border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <span>
                      {msg.timestamp}
                      {msg.modelUsed && ` • ${msg.modelUsed}`}
                    </span>

                    {!isUser && (
                      <button
                        onClick={() => copyMessage(msg.id, msg.text)}
                        className="hover:text-blue-500 transition-colors flex items-center gap-1"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Gemini is analyzing catalog &amp; crafting response...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <div className="font-semibold">Gemini API Error</div>
                <div className="mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-semibold shrink-0">Suggestions:</span>
          {SUGGESTED_PROMPTS[selectedRole].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-600 dark:text-slate-300 truncate max-w-[240px] shrink-0 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Composer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${ROLE_DEFINITIONS[selectedRole].name} about inventory, orders, or procurement...`}
              rows={2}
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none font-sans"
              disabled={isLoading}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-xs"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
            <span>Press Enter to send, Shift+Enter for newline</span>
            <span>Role: {ROLE_DEFINITIONS[selectedRole].name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
