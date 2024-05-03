alter table "public"."message_tags" drop constraint "message_tags_message_submission_id_fkey";

alter table "public"."message_tags" drop constraint "message_tags_tag_id_fkey";

alter table "public"."message_tags" drop constraint "message_tags_pkey";

drop index if exists "public"."message_tags_pkey";

alter table "public"."message_tags" alter column "message_submission_id" set data type bigint using "message_submission_id"::bigint;

CREATE UNIQUE INDEX message_tags_pkey ON public.message_tags USING btree (tag_id, message_submission_id);

alter table "public"."message_tags" add constraint "message_tags_pkey" PRIMARY KEY using index "message_tags_pkey";

alter table "public"."message_tags" add constraint "message_tags_message_submission_id_fkey" FOREIGN KEY (message_submission_id) REFERENCES student_message_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."message_tags" validate constraint "message_tags_message_submission_id_fkey";

alter table "public"."message_tags" add constraint "message_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."message_tags" validate constraint "message_tags_tag_id_fkey";


