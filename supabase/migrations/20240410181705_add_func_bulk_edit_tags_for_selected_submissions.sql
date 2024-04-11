set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.bulk_edit_tags_for_selected_submissions(message_submission_ids integer[], tag_ids integer[])
  RETURNS boolean
  LANGUAGE plpgsql
AS $function$
DECLARE
  submission_id INT;
BEGIN
  -- Loop through each submission ID
  FOR submission_id IN SELECT unnest(message_submission_ids)
  LOOP
    -- Delete existing tags for the message submission
    DELETE FROM message_tags
    WHERE message_submission_id = submission_id;
    -- Insert new tag associations for the message submission
    INSERT INTO message_tags(message_submission_id, tag_id)
    SELECT submission_id, unnest(tag_ids);
  END LOOP;
  -- Return true if the function completes successfully
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Return false if an exception occurs
    RETURN false;
END;
$function$;