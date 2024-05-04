ALTER TABLE teacher_settings
ADD COLUMN sort_key TEXT DEFAULT 'created_at',
ADD COLUMN sort_order TEXT DEFAULT 'desc';