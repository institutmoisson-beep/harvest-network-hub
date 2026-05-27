
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'zone_harvester';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'city_harvester';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'country_harvester';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'emergency_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery_manager';
ALTER TYPE public.account_status ADD VALUE IF NOT EXISTS 'blocked';
DO $$ BEGIN
  CREATE TYPE public.delivery_status AS ENUM ('en_preparation','en_route_relais','disponible_au_relais','recupere');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
