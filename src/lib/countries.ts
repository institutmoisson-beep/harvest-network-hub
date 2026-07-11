// Liste des pays pris en charge dans le système de ciblage géographique.
// Utilisée par le sélecteur multi-pays des Packs, Produits Commerce et Partenaires.

export const AFRICAN_COUNTRIES = [
  "Bénin",
  "Burkina Faso",
  "Cameroun",
  "Côte d'Ivoire",
  "Gabon",
  "Ghana",
  "Guinée",
  "Mali",
  "Niger",
  "Nigeria",
  "République Démocratique du Congo",
  "Sénégal",
  "Togo",
  "Tchad",
  "Congo-Brazzaville",
  "Mauritanie",
  "Rwanda",
  "Burundi",
  "Madagascar",
  "Comores",
  "Maroc",
  "Algérie",
  "Tunisie",
  "Égypte",
];

export const WORLD_COUNTRIES = [
  "France",
  "Belgique",
  "Suisse",
  "Canada",
  "États-Unis",
  "Royaume-Uni",
  "Allemagne",
  "Espagne",
  "Italie",
  "Portugal",
  "Chine",
  "Inde",
  "Brésil",
  "Turquie",
  "Émirats Arabes Unis",
];

export const ALL_COUNTRIES = [...AFRICAN_COUNTRIES, ...WORLD_COUNTRIES];

/** Vérifie si un utilisateur (pays) peut voir un item (liste de pays autorisés). */
export const isCountryAllowed = (
  userCountry: string | null | undefined,
  itemCountries: string[] | null | undefined
): boolean => {
  // Universel si liste vide ou nulle
  if (!itemCountries || itemCountries.length === 0) return true;
  if (!userCountry) return true; // pas de restriction si pays inconnu
  return itemCountries.some(c => c.trim().toLowerCase() === userCountry.trim().toLowerCase());
};

/**
 * Filtre de recherche par pays pour les sections Packs / Produits.
 * - "auto"      : comportement par défaut, basé sur le pays détecté de l'utilisateur.
 * - "universal" : uniquement les items universels / internationaux (sans restriction de pays).
 * - un pays      : les items universels + ceux ciblant explicitement ce pays.
 */
export const matchesCountryFilter = (
  filterValue: string,
  userCountry: string | null | undefined,
  itemCountries: string[] | null | undefined
): boolean => {
  if (filterValue === "auto") return isCountryAllowed(userCountry, itemCountries);
  if (filterValue === "universal") return !itemCountries || itemCountries.length === 0;
  return isCountryAllowed(filterValue, itemCountries);
};
