import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import {
  getTeacherPromptForStudent,
  getTeacherPromptForTeacher,
} from '@/utils/server/supabase/teacher-prompt';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const userProfile = await fetchUserProfileWithAccessToken(req);
  if (
    !userProfile ||
    (!userProfile.isTempUser && !userProfile.isTeacherAccount)
  ) {
    return unauthorizedResponse;
  }

  try {
    if (userProfile.isTempUser) {
      // get teacher prompt using student profile id
      return new Response(
        JSON.stringify({
          prompts: await getTeacherPromptForStudent(userProfile.id),
        }),
        { status: 200 },
      );
    } else {
      // get teacher prompt using teacher profile id
      return new Response(
        JSON.stringify({
          prompts: await getTeacherPromptForTeacher(userProfile.id),
        }),
        { status: 200 },
      );
    }
  } catch (error) {
    console.error(error);
    return new Response('Error', {
      status: 500,
      statusText: 'Internal server error',
    });
  }
};
export default handler;
