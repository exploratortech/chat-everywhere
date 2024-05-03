alter table "public"."temporary_account_profiles" drop constraint "temporary_account_profiles_one_time_code_id_fkey";

alter table "public"."temporary_account_profiles" drop constraint "temporary_account_profiles_profile_id_fkey";

alter table "public"."temporary_account_profiles" alter column "one_time_code_id" drop not null;

alter table "public"."temporary_account_profiles" alter column "profile_id" set not null;

alter table "public"."temporary_account_profiles" add constraint "temporary_account_profiles_one_time_code_id_fkey" FOREIGN KEY (one_time_code_id) REFERENCES one_time_codes(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."temporary_account_profiles" validate constraint "temporary_account_profiles_one_time_code_id_fkey";

alter table "public"."temporary_account_profiles" add constraint "temporary_account_profiles_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."temporary_account_profiles" validate constraint "temporary_account_profiles_profile_id_fkey";


