-- Create the trigger for admin role assignment on profiles
CREATE TRIGGER on_admin_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_on_signup();