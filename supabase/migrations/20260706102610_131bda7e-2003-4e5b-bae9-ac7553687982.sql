
CREATE OR REPLACE FUNCTION public.admin_update_custom_order_status(_id uuid, _status text, _note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role)
       OR has_role(auth.uid(),'delivery_manager'::app_role)
       OR has_role(auth.uid(),'custom_orders_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs et gestionnaires';
  END IF;
  IF _status NOT IN ('pending','in_transit','delivered','cancelled') THEN
    RAISE EXCEPTION 'Statut invalide';
  END IF;
  UPDATE public.custom_orders
     SET status = _status,
         admin_note = COALESCE(_note, admin_note)
   WHERE id = _id;
END; $function$;

CREATE OR REPLACE FUNCTION public.admin_list_custom_orders()
 RETURNS TABLE(id uuid, user_id uuid, first_name text, last_name text, referral_code text, phone text, country text, product_name text, quantity integer, unit_price numeric, total_amount numeric, delivery_latitude double precision, delivery_longitude double precision, delivery_address_text text, delivery_frequency text, delivery_details jsonb, status text, calculated_commission numeric, admin_note text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role)
       OR has_role(auth.uid(),'delivery_manager'::app_role)
       OR has_role(auth.uid(),'custom_orders_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé';
  END IF;
  RETURN QUERY
  SELECT co.id, co.user_id, p.first_name, p.last_name, p.referral_code, p.phone, p.country,
    co.product_name, co.quantity, co.unit_price, co.total_amount,
    co.delivery_latitude, co.delivery_longitude, co.delivery_address_text,
    co.delivery_frequency, co.delivery_details, co.status, co.calculated_commission,
    co.admin_note, co.created_at
  FROM public.custom_orders co
  LEFT JOIN public.profiles p ON p.id = co.user_id
  ORDER BY co.created_at DESC
  LIMIT 500;
END; $function$;
