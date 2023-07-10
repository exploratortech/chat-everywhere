set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_referees_profile_by_referrer_id(referrer uuid)
 RETURNS TABLE(id uuid, plan text, stripe_subscription_id text, pro_plan_expiration_date timestamp with time zone, referral_code character varying, referral_code_expiration_date timestamp with time zone, email text, referral_date timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY 
        SELECT P.id, P.plan, P.stripe_subscription_id, P.pro_plan_expiration_date, P.referral_code, P.referral_code_expiration_date, P.email, R.referral_date
        FROM public.profiles P
        INNER JOIN public.referral R ON P.id = R.referee_id
        WHERE R.referrer_id = referrer;
END;
$function$
;


