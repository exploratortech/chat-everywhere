create table "public"."conversations" (
    "id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "user_id" uuid not null,
    "content" jsonb not null default '{}'::jsonb
);


alter table "public"."conversations" enable row level security;

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."conversations" add constraint "conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_user_id_fkey";


