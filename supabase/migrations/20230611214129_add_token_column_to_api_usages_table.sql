ALTER TABLE api_usages
ADD COLUMN length INTEGER;

ALTER TABLE api_usages
ALTER COLUMN user_id DROP NOT NULL;
