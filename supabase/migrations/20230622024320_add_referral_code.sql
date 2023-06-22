alter table "public"."profiles" drop constraint "profiles_plan_check";

create table "public"."referral" (
    "id" bigint generated by default as identity not null,
    "referrer_id" uuid,
    "referree_id" uuid,
    "referral_date" timestamp with time zone default now()
);


alter table "public"."referral" enable row level security;

alter table "public"."profiles" add column "pro_plan_expiration_date" timestamp with time zone;

alter table "public"."profiles" add column "referral_code" character varying;

CREATE UNIQUE INDEX referral_id_key ON public.referral USING btree (id);

CREATE UNIQUE INDEX referral_pkey ON public.referral USING btree (id);

alter table "public"."referral" add constraint "referral_pkey" PRIMARY KEY using index "referral_pkey";

alter table "public"."referral" add constraint "referral_id_key" UNIQUE using index "referral_id_key";

alter table "public"."referral" add constraint "referral_referree_id_fkey" FOREIGN KEY (referree_id) REFERENCES profiles(id) not valid;

alter table "public"."referral" validate constraint "referral_referree_id_fkey";

alter table "public"."referral" add constraint "referral_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES profiles(id) not valid;

alter table "public"."referral" validate constraint "referral_referrer_id_fkey";

alter table "public"."profiles" add constraint "profiles_plan_check" CHECK ((plan = ANY (ARRAY['free'::text, 'pro'::text, 'edu'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_plan_check";

create policy "user can view their referrer and referree"
on "public"."referral"
as permissive
for select
to public
using (((referrer_id = auth.uid()) OR (referree_id = auth.uid())));



