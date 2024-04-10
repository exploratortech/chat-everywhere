import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

interface FetchMessagesParams {
  supabase: SupabaseClient;
  teacherProfileId: string;
  filter: {
    tag_ids?: number[];
    sort_by: {
      sortKey: string;
      sortOrder: 'asc' | 'desc';
    };
  };
  page: number;
  pageSize: number;
}
export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};
const requestSchema = z.object({
  accessToken: z.string(),
  page: z.number(),
  filter: z.object({
    tag_ids: z.array(z.number()),
    sort_by: z.object({
      sortKey: z.enum(['created_at', 'student_name']),
      sortOrder: z.enum(['asc', 'desc']),
    }),
  }),
  itemPerPage: z
    .string()
    .refine(
      (val) =>
        ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'].includes(
          val,
        ),
      'Item per page must be one of the following values: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100',
    ),
});

const handler = async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const parsed = requestSchema.safeParse(await req.json());

  if (!parsed.success) {
    return new Response('Invalid request format', { status: 400 });
  }

  const { accessToken, page, filter, itemPerPage } = parsed.data;

  const supabase = getAdminSupabaseClient();

  if (!accessToken) {
    return new Response('Missing accessToken', {
      status: 400,
    });
  }

  const userRes = await supabase.auth.getUser(accessToken);

  if (!userRes || userRes.error) {
    console.error('No user found with this access token');
    return new Response('No user found with this access token', {
      status: 400,
    });
  }

  const userId = userRes.data.user.id;

  const teacherProfileId = userId;

  const pageSize = parseInt(itemPerPage);
  const startTime = new Date().getTime();

  const [count, messagesResult] = await Promise.all([
    fetchShareMessageCount({
      supabase,
      teacherProfileId,
      filter,
    }),
    fetchMessages({
      supabase,
      teacherProfileId,
      filter,
      page,
      pageSize,
    }),
  ]);

  const { data: messagesData, error: messagesError } = messagesResult;

  console.log(
    `Time taken to fetch messages: ${new Date().getTime() - startTime}ms`,
  );

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
    return new Response('Error fetching messages', {
      status: 500,
    });
  }

  let formattedMessagesData = messagesData.map((message) => ({
    ...message,
    message_tags: message.message_tags.map((tag) => ({
      id: tag.tag_id,
      name: (tag.tags as unknown as { name: string }).name,
    })),
  }));

  // Filter out messages with no tags, if tag_ids filter is provided
  if (filter.tag_ids?.length) {
    formattedMessagesData = formattedMessagesData.filter(
      (message) => message.message_tags.length > 0,
    );
  }
  // Calculate total pages
  const totalPages = Math.ceil((count || 1) / pageSize);
  // Adjust next_page and prev_page to ensure they are within valid range
  const nextPage = page < totalPages ? page + 1 : null;
  const prevPage = page > 1 ? page - 1 : null;

  return new Response(
    JSON.stringify({
      submissions: formattedMessagesData,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        next_page: nextPage,
        prev_page: prevPage,
      },
    }),
    {
      status: 200,
    },
  );
};

export default handler;

function fetchMessages({
  supabase,
  teacherProfileId,
  filter,
  page,
  pageSize,
}: FetchMessagesParams) {
  let query = supabase
    .from('student_message_submissions')
    .select(
      `
        id,
        message_content,
        image_file_url,
        created_at,
        student_name,
        message_tags!left(tag_id, tags(name))
      `,
    )
    .eq('teacher_profile_id', teacherProfileId);

  // Apply tag_ids filter if provided
  if (filter.tag_ids?.length) {
    query = query.filter(
      'message_tags.tag_id',
      'in',
      `(${filter.tag_ids.join(',')})`,
    );
  }

  // Apply sorting based on sortKey and sortOrder
  query = query.order(filter.sort_by.sortKey, {
    ascending: filter.sort_by.sortOrder === 'asc',
  });

  return query.range((page - 1) * pageSize, page * pageSize - 1);
}

async function fetchShareMessageCount({
  supabase,
  teacherProfileId,
  filter,
}: Omit<FetchMessagesParams, 'page' | 'pageSize'>) {
  const { data: count, error } = await supabase.rpc('shared_message_counter', {
    teacher_id: teacherProfileId,
    input_tag_ids: filter.tag_ids || [],
  });
  if (error) {
    throw error;
  }
  return count as number;
}
