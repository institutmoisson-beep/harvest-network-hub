
-- Add 'transfert' to transaction_type enum
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'transfert';

-- Add recipient_id column to wallet_transactions
ALTER TABLE public.wallet_transactions
ADD COLUMN IF NOT EXISTS recipient_id uuid;

-- Allow financier role to read all transactions
CREATE POLICY "Financiers can read all transactions"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'financier'::app_role));

-- Allow pack_manager to manage products
CREATE POLICY "Pack managers can manage products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'pack_manager'::app_role));
