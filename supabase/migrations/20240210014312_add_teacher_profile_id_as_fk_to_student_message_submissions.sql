alter table "public"."student_message_submissions" add column "teacher_profile_id" uuid not null;

alter table "public"."student_message_submissions" add constraint "student_message_submissions_teacher_profile_id_fkey" FOREIGN KEY (teacher_profile_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."student_message_submissions" validate constraint "student_message_submissions_teacher_profile_id_fkey";


