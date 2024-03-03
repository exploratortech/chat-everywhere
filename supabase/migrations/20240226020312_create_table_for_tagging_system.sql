create sequence "public"."tags_id_seq";

create sequence "public"."teacher_tags_id_seq";

create table "public"."message_tags" (
    "message_submission_id" integer not null,
    "tag_id" integer not null
);


alter table "public"."message_tags" enable row level security;

create table "public"."one_time_code_tags" (
    "one_time_code_id" uuid not null,
    "tag_id" integer not null
);


create table "public"."tags" (
    "id" integer not null default nextval('tags_id_seq'::regclass),
    "name" character varying(255) not null
);


alter table "public"."tags" enable row level security;

create table "public"."teacher_tags" (
    "id" integer not null default nextval('teacher_tags_id_seq'::regclass),
    "teacher_profile_id" uuid not null,
    "tag_id" integer not null
);


alter table "public"."teacher_tags" enable row level security;

alter table "public"."profiles" alter column "one_time_code_duration" set default 0;

alter sequence "public"."tags_id_seq" owned by "public"."tags"."id";

alter sequence "public"."teacher_tags_id_seq" owned by "public"."teacher_tags"."id";

CREATE UNIQUE INDEX message_tags_pkey ON public.message_tags USING btree (message_submission_id, tag_id);

CREATE UNIQUE INDEX one_time_code_tags_pkey ON public.one_time_code_tags USING btree (one_time_code_id, tag_id);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX teacher_tags_pkey ON public.teacher_tags USING btree (id);

alter table "public"."message_tags" add constraint "message_tags_pkey" PRIMARY KEY using index "message_tags_pkey";

alter table "public"."one_time_code_tags" add constraint "one_time_code_tags_pkey" PRIMARY KEY using index "one_time_code_tags_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."teacher_tags" add constraint "teacher_tags_pkey" PRIMARY KEY using index "teacher_tags_pkey";

alter table "public"."message_tags" add constraint "message_tags_message_submission_id_fkey" FOREIGN KEY (message_submission_id) REFERENCES student_message_submissions(id) not valid;

alter table "public"."message_tags" validate constraint "message_tags_message_submission_id_fkey";

alter table "public"."message_tags" add constraint "message_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) not valid;

alter table "public"."message_tags" validate constraint "message_tags_tag_id_fkey";

alter table "public"."one_time_code_tags" add constraint "one_time_code_tags_one_time_code_id_fkey" FOREIGN KEY (one_time_code_id) REFERENCES one_time_codes(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."one_time_code_tags" validate constraint "one_time_code_tags_one_time_code_id_fkey";

alter table "public"."one_time_code_tags" add constraint "one_time_code_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."one_time_code_tags" validate constraint "one_time_code_tags_tag_id_fkey";

alter table "public"."teacher_tags" add constraint "teacher_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."teacher_tags" validate constraint "teacher_tags_tag_id_fkey";

alter table "public"."teacher_tags" add constraint "teacher_tags_teacher_profile_id_fkey" FOREIGN KEY (teacher_profile_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."teacher_tags" validate constraint "teacher_tags_teacher_profile_id_fkey";

create policy "Enable insert for authenticated users only"
on "public"."message_tags"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for all users"
on "public"."tags"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."teacher_tags"
as permissive
for select
to public
using (true);



