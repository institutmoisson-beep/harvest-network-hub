import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export const CURRENCIES = [
  { code: "XOF", label: "FCFA (XOF)", symbol: "FCFA" },
  { code: "USD", label: "Dollar US", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "Livre Sterling", symbol: "£" },
  { code: "NGN", label: "Naira", symbol: "₦" },
  { code: "GHS", label: "Cedi", symbol: "₵" },
  { code: "MAD", label: "Dirham", symbol: "MAD" },
  { code: "CNY", label: "Yuan", symbol: "¥" },
  { code: "JPY", label: "Yen", symbol: "¥" },
  { code: "BTC", label: "Bitcoin", symbol: "₿" },
];

const CACHE_KEY = "moisson_fx_rates";
const CACHE_TTL = 30 * 60 * 1000; // 30 min
const CURRENCY_STORAGE_KEY = "moisson_preferred_currency";

type Rates = Record<string, number>;

interface CurrencyContextValue {
  rates: Rates;
  loading: boolean;
  selectedCurrency: string;
  setSelectedCurrency: (code: string) => void;
  convert: (amountFCFA: number, to?: string) => number;
  formatConverted: (amountFCFA: number, to?: string) => string;
  currencies: typeof CURRENCIES;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [rates, setRates] = useState<Rates>({ XOF: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrencyState] = useState(
    () => localStorage.getItem(CURRENCY_STORAGE_KEY) || "XOF"
  );

  // Charge la devise préférée depuis le profil (si connecté), sinon garde le localStorage
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (profile?.preferred_currency) {
        setSelectedCurrencyState(profile.preferred_currency);
        localStorage.setItem(CURRENCY_STORAGE_KEY, profile.preferred_currency);
      }
    })();
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setRates(data);
          setLoading(false);
          return;
        }
      } catch {
        // ignore, refetch below
      }
    }
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      // frankfurter.app : API de taux de change gratuite, sans clé, temps réel
      const res = await fetch("https://api.frankfurter.app/latest?from=XOF");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const r: Rates = { XOF: 1, ...data.rates };
      if (r.USD) {
        r.BTC = r.USD / 65000; // approximation via USD
      }
      setRates(r);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: r, ts: Date.now() }));
    } catch {
      setRates({
        XOF: 1, USD: 0.0016, EUR: 0.0015, GBP: 0.0013,
        NGN: 2.5, GHS: 0.025, MAD: 0.016, CNY: 0.012,
        JPY: 0.24, BTC: 0.000000025,
      });
    }
    setLoading(false);
  };

  const setSelectedCurrency = useCallback((code: string) => {
    setSelectedCurrencyState(code);
    localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      await supabase
        .from("profiles")
        .update({ preferred_currency: code })
        .eq("id", userData.user.id);
    })();
  }, []);

  const convert = useCallback((amountFCFA: number, to?: string): number => {
    const target = to || selectedCurrency;
    if (target === "XOF") return amountFCFA;
    const rate = rates[target];
    if (!rate) return amountFCFA;
    return amountFCFA * rate;
  }, [rates, selectedCurrency]);

  const formatConverted = useCallback((amountFCFA: number, to?: string): string => {
    const target = to || selectedCurrency;
    const converted = convert(amountFCFA, target);
    const curr = CURRENCIES.find(c => c.code === target);
    if (target === "BTC") return `${curr?.symbol || ""}${converted.toFixed(8)}`;
    if (target === "XOF") return `${converted.toLocaleString()} FCFA`;
    return `${curr?.symbol || ""}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [convert, selectedCurrency]);

  return (
    <CurrencyContext.Provider value={{ rates, loading, selectedCurrency, setSelectedCurrency, convert, formatConverted, currencies: CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency doit être utilisé dans un CurrencyProvider");
  return ctx;
};
