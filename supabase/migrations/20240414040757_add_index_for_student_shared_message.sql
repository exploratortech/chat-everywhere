CREATE INDEX idx_mt_message_submission_id ON public.message_tags USING btree (message_submission_id);

CREATE INDEX idx_mt_tag_id ON public.message_tags USING btree (tag_id);

CREATE INDEX idx_sms_sorting ON public.student_message_submissions USING btree (created_at, student_name);

CREATE INDEX idx_sms_teacher_profile_id ON public.student_message_submissions USING btree (teacher_profile_id);

CREATE INDEX idx_tags_id ON public.tags USING btree (id);


