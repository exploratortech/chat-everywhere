set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_teacher_tag_and_tag_count(teacher_profile_id_param uuid)
 RETURNS TABLE(name character varying, id integer, message_count bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT t.name, tt.tag_id, COUNT(mt.message_submission_id) AS message_count
  FROM teacher_tags tt
  JOIN tags t ON tt.tag_id = t.id
  LEFT JOIN message_tags mt ON tt.tag_id = mt.tag_id
  WHERE tt.teacher_profile_id = teacher_profile_id_param
  GROUP BY t.name, tt.tag_id;
END;
$function$
;


