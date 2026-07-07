import { useState } from "react";
import { Check, Globe, MapPin, X, Search } from "lucide-react";
import { ALL_COUNTRIES } from "@/lib/countries";

interface Props {
  value: string[] | null | undefined;
  onChange: (countries: string[] | null) => void;
  label?: string;
}

/**
 * Sélecteur multi-pays ultra-moderne pour cibler la visibilité d'un pack,
 * produit commerce ou partenaire.
 *
 * - value null ou vide  -> "Universel / International" (visible partout)
 * - value non vide      -> restreint aux pays sélectionnés
 */
const CountriesPicker = ({ value, onChange, label = "Disponibilité par pays" }: Props) => {
  const [search, setSearch] = useState("");
  const selected = value || [];
  const isUniversal = selected.length === 0;

  const toggle = (c: string) => {
    const next = selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c];
    onChange(next.length === 0 ? null : next);
  };

  const setUniversal = () => onChange(null);

  const filtered = ALL_COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-display font-bold flex items-center gap-1">
          <MapPin size={12} className="text-primary" /> {label}
        </label>
        <button
          type="button"
          onClick={setUniversal}
          className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition ${
            isUniversal
              ? "bg-gradient-gold text-secondary-foreground border-transparent font-bold"
              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <Globe size={10} /> Universel / International
        </button>
      </div>

      {/* Chips des pays sélectionnés */}
      {!isUniversal && (
        <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-muted/30 border border-border/50">
          {selected.map(c => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30"
            >
              {c}
              <button type="button" onClick={() => toggle(c)} className="hover:text-destructive">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Recherche + grille */}
      <div className="relative">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un pays…"
          className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-input border border-border text-xs"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-44 overflow-y-auto p-1 rounded-lg border border-border/50 bg-background/40">
        {filtered.map(c => {
          const active = selected.includes(c);
          return (
            <button
              type="button"
              key={c}
              onClick={() => toggle(c)}
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border transition text-left ${
                active
                  ? "bg-primary/15 border-primary text-primary font-bold"
                  : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {active && <Check size={10} />}
              <span className="truncate">{c}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {isUniversal
          ? "🌍 Ce contenu sera visible par TOUS les moissonneurs, quel que soit leur pays."
          : `🎯 Visible uniquement dans ${selected.length} pays. Les autres utilisateurs ne le verront pas.`}
      </p>
    </div>
  );
};

export default CountriesPicker;