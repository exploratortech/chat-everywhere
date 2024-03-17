alter table "public"."teacher_prompts" add column "first_message_to_gpt" text default 'Provide a short welcome message based on your prompt, the role you are playing is based on the prompt'::text;


