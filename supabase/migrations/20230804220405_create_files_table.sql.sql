-- this is for Assistant MVP PR 

create table "public"."files" (
    "id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid not null,
    "name" text not null,
    "type" text,
    "size" bigint,
    "path" text not null
);


alter table "public"."files" enable row level security;

CREATE UNIQUE INDEX files_path_key ON public.files USING btree (path);

CREATE UNIQUE INDEX files_pkey ON public.files USING btree (id);

alter table "public"."files" add constraint "files_pkey" PRIMARY KEY using index "files_pkey";

alter table "public"."files" add constraint "files_path_key" UNIQUE using index "files_path_key";

alter table "public"."files" add constraint "files_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."files" validate constraint "files_user_id_fkey";