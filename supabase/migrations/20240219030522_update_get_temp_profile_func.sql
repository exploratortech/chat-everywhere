drop function if exists "public"."get_temp_account_teacher_profile"(p_profile_id uuid);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_temp_account_teacher_profile(p_profile_id uuid)
 RETURNS TABLE(profile_id uuid, temp_account_id bigint, uniqueid text, code character varying, teacher_profile_id uuid)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        profiles.id AS profile_id,
        temporary_account_profiles.id AS temp_account_id,
        temporary_account_profiles."uniqueId" AS "uniqueId",
        one_time_codes.code,
        one_time_codes.teacher_profile_id
    FROM profiles
    JOIN temporary_account_profiles ON profiles.id = temporary_account_profiles.profile_id
    JOIN one_time_codes ON temporary_account_profiles.one_time_code_id = one_time_codes.id
    WHERE profiles.id = p_profile_id;
END;
$function$
;


