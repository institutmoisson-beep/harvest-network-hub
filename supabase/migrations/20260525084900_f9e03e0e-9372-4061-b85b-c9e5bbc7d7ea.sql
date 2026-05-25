REVOKE EXECUTE ON FUNCTION public.contribute_to_fund(numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.contribute_to_fund(numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.contribute_to_fund(numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.withdraw_from_fund(numeric, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.withdraw_from_fund(numeric, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.withdraw_from_fund(numeric, text, uuid) TO authenticated;