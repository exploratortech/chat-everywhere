import {
  fetchUserProfileWithAccessToken,
  unauthorizedResponse,
} from '@/utils/server/auth';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import { z } from 'zod';

export const config = {
  runtime: 'edge',
};
const supabase = getAdminSupabaseClient();

// Define a schema for the request body
const requestBodySchema = z.object({
  studentId: z.number(),
  newName: z.string(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Parse and validate the request body
  const result = requestBodySchema.safeParse(await req.json());
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 400,
    });
  }
  const { studentId, newName } = result.data;

  // First, check if the user is a teacher
  const teacherProfile = await fetchUserProfileWithAccessToken(req);
  if (!teacherProfile || !teacherProfile.isTeacherAccount)
    return unauthorizedResponse;
  // Retrieve the teacherProfileId from the teacherProfile object
  const teacherProfileId = teacherProfile.id;

  // Modify the update query to include the teacherProfileId in the condition
  const { data: studentProfile, error: studentProfileError } = (await supabase
    .from('temporary_account_profiles')
    .select('one_time_codes(teacher_profile_id)')
    .eq('id', studentId)
    .single()) as { data: StudentProfile; error: any };
  if (studentProfileError) {
    return new Response(
      JSON.stringify({ error: studentProfileError.message }),
      {
        status: 400,
      },
    );
  }

  // Make sure the studentProfile has a teacherProfileId that matches the teacherProfileId
  if (studentProfile?.one_time_codes?.teacher_profile_id !== teacherProfileId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized to update this student name' }),
      {
        status: 401,
      },
    );
  }

  // Then, update the student name in both tables in parallel
  const updateStudentProfilePromise = supabase
    .from('temporary_account_profiles')
    .update({ uniqueId: newName })
    .eq('id', studentId);

  const updateMessageSubmissionPromise = supabase
    .from('student_message_submissions')
    .update({ student_name: newName })
    .eq('temporary_account_profile_id', studentId);

  const [updateStudentProfileResult, updateMessageSubmissionResult] =
    await Promise.all([
      updateStudentProfilePromise,
      updateMessageSubmissionPromise,
    ]);

  if (updateStudentProfileResult.error) {
    console.log(updateStudentProfileResult.error);
    return new Response(
      JSON.stringify({ error: updateStudentProfileResult.error.message }),
      {
        status: 400,
      },
    );
  }

  if (updateMessageSubmissionResult.error) {
    return new Response(
      JSON.stringify({ error: updateMessageSubmissionResult.error.message }),
      {
        status: 400,
      },
    );
  }

  return new Response(
    JSON.stringify({ message: 'Student name updated successfully' }),
    { status: 200 },
  );
};
export default handler;

type OneTimeCodes = {
  teacher_profile_id: string;
};

type StudentProfile = {
  one_time_codes: OneTimeCodes;
};
