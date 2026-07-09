import { useCurrency } from "@/contexts/CurrencyContext";

const CurrencySelector = ({ className = "" }: { className?: string }) => {
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();

  return (
    <select
      value={selectedCurrency}
      onChange={(e) => setSelectedCurrency(e.target.value)}
      className={`text-xs bg-muted/50 border border-border/50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
      title="Devise d'affichage"
    >
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>{c.label}</option>
      ))}
    </select>
  );
};

export default CurrencySelector;
