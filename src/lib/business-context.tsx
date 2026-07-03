import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, type Business } from './api';

interface BusinessContextValue {
  business: Business | null;
  businesses: Business[];
  loading: boolean;
  error: string | null;
  setCurrent: (b: Business) => void;
  refetch: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.businesses.list({ active: 'true' });
      setBusinesses(res.businesses);
      if (!business && res.businesses.length > 0) {
        setBusiness(res.businesses[0]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load businesses';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBusinesses(); }, []);

  return (
    <BusinessContext.Provider value={{ business, businesses, loading, error, setCurrent: setBusiness, refetch: fetchBusinesses }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
