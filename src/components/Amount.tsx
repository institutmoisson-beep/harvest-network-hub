import { useCurrency } from "@/contexts/CurrencyContext";

/**
 * Affiche un montant stocké en FCFA (devise de référence de l'app),
 * avec en dessous sa conversion automatique dans la devise choisie par
 * l'utilisateur (si différente du FCFA).
 */
const Amount = ({
  value,
  prefix = "",
  className = "",
  convertedClassName = "text-[10px] text-muted-foreground",
}: {
  value: number;
  prefix?: string;
  className?: string;
  convertedClassName?: string;
}) => {
  const { selectedCurrency, formatConverted, loading } = useCurrency();
  return (
    <span className={className}>
      {prefix}{Number(value || 0).toLocaleString()} FCFA
      {selectedCurrency !== "XOF" && !loading && (
        <span className={`block ${convertedClassName}`}>≈ {formatConverted(value, selectedCurrency)}</span>
      )}
    </span>
  );
};

export default Amount;
