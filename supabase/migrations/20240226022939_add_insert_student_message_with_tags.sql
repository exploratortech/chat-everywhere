set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_student_message_with_tags(_message_content text, _temporary_account_profile_id bigint, _image_file_url text, _teacher_profile_id uuid, _student_name text, _tag_ids integer[])
 RETURNS TABLE(message_id bigint, tag_ids integer[])
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Insert the message and get the message ID
    INSERT INTO student_message_submissions (
        message_content,
        temporary_account_profile_id,
        image_file_url,
        teacher_profile_id,
        student_name
    ) VALUES (
        _message_content,
        _temporary_account_profile_id,
        _image_file_url,
        _teacher_profile_id,
        _student_name
    )
    RETURNING id INTO message_id;

    -- Insert tags if any
    IF _tag_ids IS NOT NULL AND array_length(_tag_ids, 1) > 0 THEN
        INSERT INTO message_tags (message_submission_id, tag_id)
        SELECT message_id, UNNEST(_tag_ids);
    END IF;

    -- Return the message ID and tag IDs
    RETURN QUERY SELECT message_id, _tag_ids;
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback the transaction on error is implicit in functions
        RAISE;
END;
$function$;
