-- migrations/20240316144508_add_items_per_page_to_teacher_settings.sql

ALTER TABLE "public"."teacher_settings"
ADD COLUMN "items_per_page" INT DEFAULT 20;