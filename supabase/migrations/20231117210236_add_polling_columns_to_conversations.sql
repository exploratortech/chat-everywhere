alter table "public"."user_v2_conversations" add column "processLock" boolean not null default false;

alter table "public"."user_v2_conversations" add column "runInProgress" boolean not null default false;