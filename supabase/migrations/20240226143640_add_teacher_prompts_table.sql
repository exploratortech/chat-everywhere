create table "public"."teacher_prompts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "teacher_profile_id" uuid not null,
    "model" jsonb,
    "name" text not null default ''::text,
    "description" text default ''::text,
    "is_enable" boolean not null default false,
    "content" text not null default ''::text
);


alter table "public"."teacher_prompts" enable row level security;

CREATE UNIQUE INDEX teacher_prompt_pkey ON public.teacher_prompts USING btree (id);

alter table "public"."teacher_prompts" add constraint "teacher_prompt_pkey" PRIMARY KEY using index "teacher_prompt_pkey";

alter table "public"."teacher_prompts" add constraint "teacher_prompts_teacher_profile_id_fkey" FOREIGN KEY (teacher_profile_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."teacher_prompts" validate constraint "teacher_prompts_teacher_profile_id_fkey";


