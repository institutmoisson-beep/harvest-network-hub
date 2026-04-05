
-- Create recursive function to get full downline
CREATE OR REPLACE FUNCTION public.get_downline(_user_id uuid)
RETURNS TABLE(member_id uuid, member_sponsor_id uuid, member_position text, member_level integer, tree_depth integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE tree AS (
    SELECT n.user_id AS member_id, n.sponsor_id AS member_sponsor_id, n.position AS member_position, n.level AS member_level, 1 AS tree_depth
    FROM public.network n
    WHERE n.sponsor_id = _user_id
    UNION ALL
    SELECT n.user_id, n.sponsor_id, n.position, n.level, t.tree_depth + 1
    FROM public.network n
    INNER JOIN tree t ON n.sponsor_id = t.member_id
    WHERE t.tree_depth < 50
  )
  SELECT * FROM tree ORDER BY tree_depth, member_position;
$$;
