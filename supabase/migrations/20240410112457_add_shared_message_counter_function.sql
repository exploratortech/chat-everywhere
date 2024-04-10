set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.shared_message_counter(teacher_id uuid, input_tag_ids integer[])
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    message_count INTEGER;
BEGIN
    -- Check if input_tag_ids is empty
    IF input_tag_ids IS NULL OR array_length(input_tag_ids, 1) IS NULL THEN
        -- input_tag_ids is empty, do not use it as a filter
        SELECT COUNT(sms.id) INTO message_count
        FROM student_message_submissions sms
        WHERE sms.teacher_profile_id = teacher_id;
    ELSE
        -- input_tag_ids is not empty, use it as a filter
        SELECT COUNT(sms.id) INTO message_count
        FROM student_message_submissions sms
        WHERE sms.teacher_profile_id = teacher_id
          AND EXISTS (
            SELECT 1
            FROM message_tags mt
            JOIN tags t ON mt.tag_id = t.id
            WHERE mt.message_submission_id = sms.id
              AND t.id = ANY(input_tag_ids)
          );
    END IF;
    RETURN message_count;
END;
$function$;