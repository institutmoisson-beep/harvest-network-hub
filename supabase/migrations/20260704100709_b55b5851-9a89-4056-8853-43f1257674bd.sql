
-- Add new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'identity_verifier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'title_verifier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'grenier_manager';
