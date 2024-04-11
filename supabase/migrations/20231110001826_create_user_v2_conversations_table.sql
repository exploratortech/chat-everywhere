create table "public"."user_v2_conversations" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone default now(),
    "uid" uuid,
    "threadId" text,
    "title" text
);


alter table "public"."user_v2_conversations" enable row level security;

CREATE UNIQUE INDEX user_v2_conversations_pkey ON public.user_v2_conversations USING btree (id);

alter table "public"."user_v2_conversations" add constraint "user_v2_conversations_pkey" PRIMARY KEY using index "user_v2_conversations_pkey";

alter table "public"."user_v2_conversations" add constraint "user_v2_conversations_uid_fkey" FOREIGN KEY (uid) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_v2_conversations" validate constraint "user_v2_conversations_uid_fkey";

create policy "Only allow user to modify their own conversations"
on "public"."user_v2_conversations"
as permissive
for all
to public
using ((auth.uid() = uid))
with check ((auth.uid() = uid));