alter table "public"."student_message_submissions" drop constraint "student_message_submissions_temporary_account_profile_id_fkey";

alter table "public"."student_message_submissions" add column "student_name" text not null default ''::text;

alter table "public"."student_message_submissions" alter column "temporary_account_profile_id" drop not null;

alter table "public"."student_message_submissions" add constraint "student_message_submissions_temporary_account_profile_id_fkey" FOREIGN KEY (temporary_account_profile_id) REFERENCES temporary_account_profiles(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."student_message_submissions" validate constraint "student_message_submissions_temporary_account_profile_id_fkey";


