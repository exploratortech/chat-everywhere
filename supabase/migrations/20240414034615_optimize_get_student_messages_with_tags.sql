
set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_student_messages_with_tags(
    input_tag_ids integer[],
    input_teacher_profile_id uuid,
    input_sort_by_key text,
    input_sort_by_order text,
    input_page integer,
    input_page_size integer
) RETURNS TABLE(
    id bigint,
    created_at timestamp with time zone,
    message_content text,
    image_file_url text,
    student_name text,
    tags_agg jsonb
)
LANGUAGE plpgsql
AS $function$
DECLARE
    offset_calc INT;
    sort_column TEXT;
    sort_order TEXT;
BEGIN
    -- Calculate the offset based on the current page and page size
    offset_calc := (input_page - 1) * input_page_size;

    -- Determine sort column
    IF input_sort_by_key = 'student_name' THEN
        sort_column := 'sms.student_name';
    ELSE
        sort_column := 'sms.created_at'; -- Default sort by created_at
    END IF;

    -- Determine sort order
    sort_order := CASE input_sort_by_order
        WHEN 'desc' THEN 'DESC'
        ELSE 'ASC'
    END;

    RETURN QUERY EXECUTE
    format('SELECT
        sms.id,
        sms.created_at,
        sms.message_content,
        sms.image_file_url,
        sms.student_name,
        JSON_AGG(JSON_BUILD_OBJECT(''id'', t.id, ''name'', t.name))::JSONB AS tags_agg
    FROM
        student_message_submissions sms
    LEFT JOIN message_tags mt ON sms.id = mt.message_submission_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    WHERE
        sms.teacher_profile_id = $1
        AND (ARRAY_LENGTH($2, 1) IS NULL OR ARRAY_LENGTH($2, 1) = 0 OR mt.tag_id = ANY($2))
    GROUP BY sms.id
    ORDER BY %s %s
    LIMIT $3 OFFSET $4', sort_column, sort_order)
    USING input_teacher_profile_id, input_tag_ids, input_page_size, offset_calc;
END;
$function$
;