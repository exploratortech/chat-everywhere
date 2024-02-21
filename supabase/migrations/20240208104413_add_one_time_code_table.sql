create table "public"."one_time_codes" (
    "id" uuid not null default gen_random_uuid(),
    "teacher_profile_id" uuid not null,
    "code" character varying not null,
    "created_at" timestamp with time zone not null default now(),
    "expired_at" timestamp with time zone not null,
    "is_valid" boolean not null
);


alter table "public"."one_time_codes" enable row level security;

CREATE UNIQUE INDEX "one_time_codes_pkey" ON public."one_time_codes" USING btree (id);

alter table "public"."one_time_codes" add constraint "one_time_codes_pkey" PRIMARY KEY using index "one_time_codes_pkey";

alter table "public"."one_time_codes" add constraint "one_time_codes_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."one_time_codes" validate constraint "one_time_codes_teacher_profile_id_fkey";


CREATE POLICY one_time_codes_owner_policy
  ON "public"."one_time_codes"
  FOR ALL
  USING (
    "teacher_profile_id" = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = "one_time_codes"."teacher_profile_id"
    )
  );
