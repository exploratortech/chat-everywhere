set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_latest_valid_one_time_code_info(teacher_profile_id_param uuid)
 RETURNS TABLE(code_id uuid, code character varying, code_is_valid boolean, code_expired_at timestamp with time zone, referrer_is_teacher_account boolean, referrer_max_temp_account_quota integer, current_total_referrer_temp_account_number bigint, active_temp_account_profiles jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH temp_accounts AS (
        SELECT tap.id, tap.created_at, tap."uniqueId", tap.profile_id, otc.code, otc.expired_at
        FROM temporary_account_profiles tap
        JOIN one_time_codes otc ON tap.one_time_code_id = otc.id
        WHERE otc.teacher_profile_id = teacher_profile_id_param
        order by tap.created_at DESC
    )
    SELECT 
        otc.id AS code_id,
        otc.code AS code,
        otc.is_valid as code_is_valid,
        otc.expired_at as code_expired_at,
        p.is_teacher_account as referrer_is_teacher_account,
        p.max_temp_account_quota as referrer_max_temp_account_quota,
        (SELECT COUNT(*)
         FROM temporary_account_profiles tap
         JOIN one_time_codes o
         ON tap.one_time_code_id = o.id
         WHERE o.teacher_profile_id = teacher_profile_id_param) AS current_total_referrer_temp_account_number,
        (SELECT jsonb_agg(ta) FROM temp_accounts ta) as temp_account_profiles -- Aggregate the temp accounts into a JSON array
    FROM 
        one_time_codes otc
    JOIN profiles p ON otc.teacher_profile_id = p.id
    WHERE 
        otc.teacher_profile_id = teacher_profile_id_param AND
        otc.is_valid = TRUE
    ORDER BY otc.created_at DESC
    LIMIT 1;
END;
$function$
;


