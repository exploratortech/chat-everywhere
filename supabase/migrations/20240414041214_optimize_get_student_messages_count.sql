set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_student_messages_count(input_tag_ids integer[], input_teacher_profile_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_count BIGINT;
BEGIN
    IF cardinality(input_tag_ids) = 0 THEN
        -- Count messages for the teacher without filtering by tags
        SELECT COUNT(*)
        INTO total_count
        FROM student_message_submissions sms
        WHERE sms.teacher_profile_id = input_teacher_profile_id;
    ELSE
        -- Count messages for the teacher that have specific tags
        SELECT COUNT(DISTINCT sms.id)
        INTO total_count
        FROM student_message_submissions sms
        INNER JOIN message_tags mt ON sms.id = mt.message_submission_id
        WHERE sms.teacher_profile_id = input_teacher_profile_id
          AND mt.tag_id = ANY(input_tag_ids);
    END IF;

    RETURN total_count;
END;
$function$
;


