create table "public"."files" (
    "id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "name" text not null,
    "type" text,
    "size" bigint,
    "path" text not null
);


alter table "public"."files" enable row level security;

CREATE UNIQUE INDEX attachments_path_key ON public.files USING btree (path);

CREATE UNIQUE INDEX attachments_pkey ON public.files USING btree (id);

alter table "public"."files" add constraint "attachments_pkey" PRIMARY KEY using index "attachments_pkey";

alter table "public"."files" add constraint "attachments_path_key" UNIQUE using index "attachments_path_key";

alter table "public"."files" add constraint "files_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."files" validate constraint "files_user_id_fkey";


