CREATE UNIQUE INDEX instant_message_app_users_line_id_key ON public.instant_message_app_users USING btree (line_id);

alter table "public"."instant_message_app_users" add constraint "instant_message_app_users_line_id_key" UNIQUE using index "instant_message_app_users_line_id_key";


