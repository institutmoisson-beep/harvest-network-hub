import { Globe2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_COUNTRIES } from "@/lib/countries";

const CountryFilter = ({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`gap-1 ${className}`}>
        <Globe2 size={14} className="text-muted-foreground shrink-0" />
        <SelectValue placeholder="Pays" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="auto">🌍 Mon pays (auto)</SelectItem>
        <SelectItem value="universal">🌐 Universel / International</SelectItem>
        {ALL_COUNTRIES.map(c => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountryFilter;
