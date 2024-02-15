import { Pagination } from '@supabase/supabase-js';

export interface StudentMessageSubmission {
  id: number;
  message_content: string;
  image_file_url: string;
  created_at: string;
  temporary_account_profiles: {
    uniqueId: string;
  };
}

export type ShareMessagesByTeacherProfilePayload = {
  submissions: StudentMessageSubmission[];
  pagination: Pagination;
};