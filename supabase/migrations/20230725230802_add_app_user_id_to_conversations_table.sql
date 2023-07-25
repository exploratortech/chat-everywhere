alter table "public"."conversations" add column "app_user_id" text;

CREATE INDEX conversations_app_user_id_key ON public.conversations USING btree (app_user_id);
