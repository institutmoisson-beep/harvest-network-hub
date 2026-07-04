
-- 1. community_fund_transactions: restrict SELECT to admins + own rows
DROP POLICY IF EXISTS "Anyone can read fund tx" ON public.community_fund_transactions;
CREATE POLICY "Users read own fund tx" ON public.community_fund_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

-- 2. relay_points: restrict SELECT to authenticated (public still uses list_relay_points RPC)
DROP POLICY IF EXISTS "Anyone reads active relays" ON public.relay_points;
CREATE POLICY "Authenticated read active relays" ON public.relay_points
  FOR SELECT TO authenticated
  USING (is_active = true
         OR public.has_role(auth.uid(),'admin'::app_role)
         OR public.has_role(auth.uid(),'country_harvester'::app_role)
         OR public.has_role(auth.uid(),'delivery_manager'::app_role));

-- 3. wallet_transactions: restrict client INSERT to pending recharge/retrait only
DROP POLICY IF EXISTS "Users can create transactions" ON public.wallet_transactions;
CREATE POLICY "Users can create pending recharge/retrait" ON public.wallet_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND type IN ('recharge'::transaction_type, 'retrait'::transaction_type)
    AND status = 'pending'::transaction_status
  );

-- 4. Set search_path on the only remaining public function without it
CREATE OR REPLACE FUNCTION public.generate_investment_operation_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE _yr text := to_char(now(),'YYYY'); _rand text; _try int := 0;
BEGIN
  IF NEW.operation_id IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    _rand := lpad((floor(random()*100000))::int::text,5,'0');
    NEW.operation_id := 'MS-RECP-'||_yr||'-'||_rand;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.moisson_community_investments WHERE operation_id = NEW.operation_id);
    _try := _try+1;
    IF _try > 20 THEN
      NEW.operation_id := 'MS-RECP-'||_yr||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,6);
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END; $function$;
