set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, plan, email)
  values (new.id, 'free', new.email); -- Set the plan to 'free' by default when a new user is created
  return new;
end;
$function$
;


