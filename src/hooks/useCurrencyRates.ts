import { useState, useEffect, useCallback } from "react";

const CURRENCIES = [
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

type Rates = Record<string, number>;

export const useCurrencyRates = () => {
  const [rates, setRates] = useState<Rates>({});
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("XOF");

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
      } catch {}
    }
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      // Using frankfurter.app (free, open-source, no API key)
      const res = await fetch("https://api.frankfurter.app/latest?from=XOF");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const r: Rates = { XOF: 1, ...data.rates };
      // Add BTC approximation via USD
      if (r.USD) {
        try {
          const btcRes = await fetch("https://api.frankfurter.app/latest?from=USD&to=XOF");
          const btcData = await btcRes.json();
          // BTC price ~60000 USD approx, we use a rough conversion
          r.BTC = r.USD / 65000;
        } catch {
          r.BTC = r.USD / 65000;
        }
      }
      setRates(r);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: r, ts: Date.now() }));
    } catch {
      // Fallback static rates
      setRates({
        XOF: 1, USD: 0.0016, EUR: 0.0015, GBP: 0.0013,
        NGN: 2.5, GHS: 0.025, MAD: 0.016, CNY: 0.012,
        JPY: 0.24, BTC: 0.000000025,
      });
    }
    setLoading(false);
  };

  const convert = useCallback((amountFCFA: number, to: string): number => {
    if (to === "XOF") return amountFCFA;
    const rate = rates[to];
    if (!rate) return amountFCFA;
    return amountFCFA * rate;
  }, [rates]);

  const formatConverted = useCallback((amountFCFA: number, to: string): string => {
    const converted = convert(amountFCFA, to);
    const curr = CURRENCIES.find(c => c.code === to);
    if (to === "BTC") return `${curr?.symbol || ""}${converted.toFixed(8)}`;
    if (to === "XOF") return `${converted.toLocaleString()} FCFA`;
    return `${curr?.symbol || ""}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [convert]);

  return { rates, loading, selectedCurrency, setSelectedCurrency, convert, formatConverted, currencies: CURRENCIES };
};
