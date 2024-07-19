import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { bulkEditTitlesForSelectedSubmissions } from '@/utils/server/supabase/tags';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (!userProfile || !userProfile.isTeacherAccount)
    return unauthorizedResponse;

  const { messageSubmissionIds, title } = await req.json();

  if (!messageSubmissionIds) {
    return new Response('No submissions selected', { status: 400 });
  }

  try {
    const success = await bulkEditTitlesForSelectedSubmissions(
      messageSubmissionIds,
      title,
    );
    if (!success) {
      throw new Error('Failed to update titles in the database');
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Titles updated successfully',
      }),
      { status: 200 },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};
export default handler;
