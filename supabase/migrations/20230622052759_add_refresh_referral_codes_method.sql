set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.refresh_referral_codes(payload json)
 RETURNS SETOF profiles
 LANGUAGE sql
AS $function$
  update profiles as p set referral_code = x.referral_code 
  from (
    select id, referral_code from json_populate_recordset(null::profiles, payload)
  ) as x(id, referral_code)
  where p.id = x.id
  returning p.*;      
$function$
;


