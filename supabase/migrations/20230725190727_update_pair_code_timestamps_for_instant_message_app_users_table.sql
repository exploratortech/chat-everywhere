alter table "public"."instant_message_app_users" add column "pair_code_generated_at" timestamp with time zone default now();

alter table "public"."instant_message_app_users" alter column "pair_code_expires_at" set default now();

alter table "public"."instant_message_app_users" alter column "pair_code_expires_at" set data type timestamp with time zone using "pair_code_expires_at"::timestamp with time zone;


