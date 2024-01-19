alter table "public"."profiles" drop constraint "profiles_plan_check";
alter table "public"."profiles" add constraint "profiles_plan_check" CHECK ((plan = ANY (ARRAY['free'::text, 'pro'::text, 'edu'::text, 'ultra'::text, 'basic'::text]))) not valid;
alter table "public"."profiles" validate constraint "profiles_plan_check";
