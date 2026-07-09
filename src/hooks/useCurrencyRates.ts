// Ce hook délègue désormais au CurrencyContext global (voir src/contexts/CurrencyContext.tsx)
// afin que la devise sélectionnée par l'utilisateur soit partagée et persistée
// sur toute l'application, plutôt que ré-initialisée à chaque page.
export { useCurrency as useCurrencyRates } from "@/contexts/CurrencyContext";
