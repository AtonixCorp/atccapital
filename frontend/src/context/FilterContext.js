import React, { createContext, useState, useContext, useCallback } from 'react';

const FilterContext = createContext();

export const useFilters = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
};

const fmt = (d) => d.toISOString().split('T')[0];
const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

const DEFAULT_FILTERS = {
  dateFrom: fmt(firstOfMonth),
  dateTo: fmt(today),
  entity: 'all',
  currency: 'USD',
  environment: 'production',
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};
