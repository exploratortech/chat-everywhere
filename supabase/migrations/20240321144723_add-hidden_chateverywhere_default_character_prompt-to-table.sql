alter table "public"."teacher_prompts" alter column "first_message_to_gpt" set default 'Provide a very short welcome message based on your prompt, the role your are playing is based on the prompt.'::text;

alter table "public"."teacher_settings" add column "hidden_chateverywhere_default_character_prompt" boolean not null default false;


