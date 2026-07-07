-- Ajout du ciblage géographique pour produits MLM, produits commerce et partenaires
-- countries = NULL ou tableau vide  ->  disponible dans le monde entier (international/universel)
-- countries = tableau non vide       ->  disponible uniquement dans les pays listés

ALTER TABLE public.products         ADD COLUMN IF NOT EXISTS countries text[];
ALTER TABLE public.commerce_products ADD COLUMN IF NOT EXISTS countries text[];
ALTER TABLE public.companies        ADD COLUMN IF NOT EXISTS countries text[];

COMMENT ON COLUMN public.products.countries         IS 'Pays autorisés à voir/acheter ce pack. NULL/vide = universel.';
COMMENT ON COLUMN public.commerce_products.countries IS 'Pays autorisés à voir/acheter ce produit. NULL/vide = universel.';
COMMENT ON COLUMN public.companies.countries        IS 'Pays où ce partenaire est visible. NULL/vide = universel.';

CREATE INDEX IF NOT EXISTS idx_products_countries         ON public.products         USING gin (countries);
CREATE INDEX IF NOT EXISTS idx_commerce_products_countries ON public.commerce_products USING gin (countries);
CREATE INDEX IF NOT EXISTS idx_companies_countries        ON public.companies        USING gin (countries);
