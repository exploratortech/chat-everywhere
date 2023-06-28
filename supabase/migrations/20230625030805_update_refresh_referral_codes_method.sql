set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.refresh_referral_codes(payload json)
 RETURNS SETOF profiles
 LANGUAGE sql
AS $function$
  -- Start an update operation on the table 'profiles'
  update profiles as p 
  -- Setting 'referral_code' and 'referral_code_expiration_date' from source 'x'
  set 
    referral_code = x.referral_code,
    referral_code_expiration_date = x.referral_code_expiration_date  
  from (
    -- Create a record set from JSON payload
    select id, referral_code, referral_code_expiration_date 
    from json_populate_recordset(null::profiles, payload)  
  ) as x(id, referral_code, referral_code_expiration_date)
  -- Matching records from the source and 'profiles' table for update
  where p.id = x.id 
  -- Returning updated records
  returning p.*;      
$function$
;


