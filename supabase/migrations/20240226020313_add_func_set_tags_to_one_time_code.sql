
set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_tags_to_one_time_code(one_time_code_id_param uuid, tag_ids_param integer[])
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Start a transaction block
    -- Delete existing tags for the one-time code
    DELETE FROM one_time_code_tags
    WHERE one_time_code_id = one_time_code_id_param;

    -- Insert new tags for the one-time code
    INSERT INTO one_time_code_tags (one_time_code_id, tag_id)
    SELECT one_time_code_id_param, UNNEST(tag_ids_param)
    ON CONFLICT DO NOTHING;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- In case of any exception, return false
        RETURN FALSE;
END;
$function$
;
