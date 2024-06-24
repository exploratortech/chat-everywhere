import { getHomeUrl } from '@/utils/app/api';
import { unauthorizedResponse } from '@/utils/server/auth';
import { sendReport } from '@/utils/server/resend';
import { getUserProfile } from '@/utils/server/supabase';

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const schema = z.object({
  title: z.string(),
  prompts: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
      pluginId: z.string().optional().nullable(),
    }),
  ),
  bugDescription: z.string(),
});

export default async function handler(req: Request) {
  if (req.method === 'POST') {
    const userToken = req.headers.get('user-token');

    const { data, error } = await supabase.auth.getUser(userToken || '');
    if (!data || error) return unauthorizedResponse;

    const user = await getUserProfile(data.user.id);
    if (!user || user.plan === 'free') return unauthorizedResponse;

    const body = schema.parse(await req.json());

    const isTeacherAccount = user.isTeacherAccount;
    const isStudentAccount = user.isTempUser && user.associatedTeacherId;
    if (!isTeacherAccount && !isStudentAccount) {
      return new Response(
        JSON.stringify({ error: 'User is not a teacher or student' }),
        {
          status: 400,
        },
      );
    }

    // Generate a unique accessible_id
    const accessible_id = uuidv4();

    // Store the conversation in the database
    const { error: storeConversationError } = await supabase
      .from('share_conversations')
      .insert([
        {
          accessible_id: accessible_id,
          title: body.title,
          prompts: JSON.stringify(body.prompts),
        },
      ]);

    if (storeConversationError) {
      return new Response(JSON.stringify({ error: 'Error storing data' }), {
        status: 500,
      });
    }

    // use the env variable to get the host
    const host = getHomeUrl();
    const url = `${host}?shareable_conversation_id=${accessible_id}`;

    // send email with the bugDescription and the link (host + accessible_id)
    const emailHtml = `
    <p>Hi,</p>
    <p>A bug has reported on the chat-everywhere app by ${user.email}.</p>
    <p>User Id : ${user.id}</p>
    <p>AssociatedTeacherId: ${user.associatedTeacherId}</p>
    <p>User Type: ${isTeacherAccount ? 'Teacher' : 'Student'}</p>
    <p>Conversation Title: ${body.title}</p>
    <p>Bug Description: ${body.bugDescription}</p>
    <p>Link: ${url}</p>
  `;

    const title = isTeacherAccount
      ? 'Teacher reported a bug'
      : 'Student reported a bug';
    try {
      await sendReport(title, emailHtml);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      console.error(error);
      return new Response('Error sending email', {
        status: 500,
        statusText: 'Internal server error',
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
