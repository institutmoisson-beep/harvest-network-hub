-- Add new staff roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pack_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'communication';
