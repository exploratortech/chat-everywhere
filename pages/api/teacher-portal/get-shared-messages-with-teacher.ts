import { getAdminSupabaseClient } from '@/utils/server/supabase';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { accessToken, page, filter } = (await req.json()) as {
    accessToken: string;
    page: number;
    filter: {
      tag_ids: number[];
      sort_by: {
        sortKey: 'created_at' | 'student_name';
        sortOrder: 'asc' | 'desc';
      };
    };
  };

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

  const pageSize = 20;
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
      { count: 'exact' },
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

  const {
    data: messagesData,
    error: messagesError,
    count,
  } = await query.range((page - 1) * pageSize, page * pageSize - 1);

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
