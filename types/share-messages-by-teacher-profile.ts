import type { Tag } from './tags';

import type { Pagination } from '@supabase/supabase-js';

export interface StudentMessageSubmission {
  id: number;
  message_content: string;
  image_file_url: string;
  created_at: string;
  student_name: string;
  message_tags: Tag[];
}

export type ShareMessagesByTeacherProfilePayload = {
  submissions: StudentMessageSubmission[];
  pagination: Pagination;
};
