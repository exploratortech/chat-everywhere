alter table "public"."conversations" alter column "user_id" drop not null;

CREATE UNIQUE INDEX instant_message_app_users_user_id_key ON public.instant_message_app_users USING btree (user_id);

alter table "public"."instant_message_app_users" add constraint "instant_message_app_users_user_id_key" UNIQUE using index "instant_message_app_users_user_id_key";


