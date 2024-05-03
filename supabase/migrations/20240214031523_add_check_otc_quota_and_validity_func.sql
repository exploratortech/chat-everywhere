set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_otc_quota_and_validity(otc_code character varying)
 RETURNS TABLE(has_quota boolean, code_is_valid boolean, referrer_is_teacher_account boolean, otc_id uuid)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY 
    SELECT
        COUNT(tap.id) < p.max_temp_account_quota AS has_quota,
        otc.is_valid AS code_is_valid,
        p.is_teacher_account AS referrer_is_teacher_account,
        otc.id AS otc_id
    FROM
        one_time_codes otc
    JOIN
        profiles p ON otc.teacher_profile_id = p.id
    LEFT JOIN
        temporary_account_profiles tap ON otc.id = tap.one_time_code_id
    WHERE
        otc.code = otc_code
    GROUP BY
        otc.id,
        otc.is_valid,
        p.is_teacher_account,
        p.max_temp_account_quota;
END;
$function$
;


