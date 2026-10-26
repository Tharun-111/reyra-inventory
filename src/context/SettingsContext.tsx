import React, { createContext, useContext, useState, useEffect } from 'react';
import { BusinessSettings, Currency } from '../types';
import { db } from '../services/database';

interface SettingsContextType {
  settings: BusinessSettings;
  currencies: Currency[];
  defaultCurrency: Currency;
  updateSettings: (updates: Partial<BusinessSettings>) => void;
  addCurrency: (currency: Omit<Currency, 'id'>) => void;
  setDefaultCurrency: (code: string) => void;
  formatMoney: (amount: number, currencyCode?: string) => string;
  refreshSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings>(() => db.getSettings());
  const [currencies, setCurrencies] = useState<Currency[]>(() => db.getCurrencies());

  const refreshSettings = () => {
    setSettings(db.getSettings());
    setCurrencies(db.getCurrencies());
  };

  const updateSettings = (updates: Partial<BusinessSettings>) => {
    const updated = db.updateSettings(updates);
    setSettings(updated);
  };

  const addCurrency = (curr: Omit<Currency, 'id'>) => {
    db.addCurrency(curr);
    setCurrencies(db.getCurrencies());
  };

  const setDefaultCurrency = (code: string) => {
    db.setDefaultCurrency(code);
    refreshSettings();
  };

  const defaultCurrency = currencies.find(c => c.is_default) ||
    currencies.find(c => c.code === settings.default_currency_code) ||
    currencies[0] || {
      id: 'default',
      name: 'Indian Rupee',
      code: 'INR',
      symbol: '₹',
      decimal_precision: 2,
      is_active: true,
      is_default: true,
    };

  const formatMoney = (amount: number, currencyCode?: string): string => {
    const targetCurrency = currencyCode
      ? currencies.find(c => c.code === currencyCode) || defaultCurrency
      : defaultCurrency;

    const safeAmount = isNaN(amount) ? 0 : amount;
    const formattedNum = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: targetCurrency.decimal_precision,
      maximumFractionDigits: targetCurrency.decimal_precision,
    }).format(safeAmount);

    return `${targetCurrency.symbol}${formattedNum}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        currencies,
        defaultCurrency,
        updateSettings,
        addCurrency,
        setDefaultCurrency,
        formatMoney,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
