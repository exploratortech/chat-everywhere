create table "public"."instant_message_app_users" (
    "id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "user_id" uuid not null,
    "line_id" character varying,
    "pair_code" character varying,
    "pair_code_expires_at" timestamp without time zone
);


alter table "public"."instant_message_app_users" enable row level security;

CREATE UNIQUE INDEX instant_message_app_users_pkey ON public.instant_message_app_users USING btree (id);

alter table "public"."instant_message_app_users" add constraint "instant_message_app_users_pkey" PRIMARY KEY using index "instant_message_app_users_pkey";

alter table "public"."instant_message_app_users" add constraint "instant_message_app_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."instant_message_app_users" validate constraint "instant_message_app_users_user_id_fkey";


