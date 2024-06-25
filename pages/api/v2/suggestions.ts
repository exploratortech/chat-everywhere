// This endpoint is for front-end to pass in the chat history, and get a nicely formatted suggestions back.
import { authorizedOpenAiRequest } from '@/utils/server/api';
import {
  getAdminSupabaseClient,
  getUserProfile,
} from '@/utils/server/supabase';

import { MessageType } from '@/types/v2Chat/chat';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
  regions: [
    'arn1',
    'bom1',
    'cdg1',
    'cle1',
    'cpt1',
    'dub1',
    'fra1',
    'gru1',
    'hnd1',
    'iad1',
    'icn1',
    'kix1',
    'lhr1',
    'pdx1',
    'sfo1',
    'sin1',
    'syd1',
  ],
};

const unauthorizedResponse = new Response('Unauthorized', { status: 401 });

const handler = async (req: Request): Promise<Response> => {
  console.log('Suggestions endpoint is hit');
  const supabase = getAdminSupabaseClient();

  try {
    const userToken = req.headers.get('user-token');
    const { data: user, error: userFetchingError } =
      await supabase.auth.getUser(userToken || '');
    if (!user || userFetchingError) return unauthorizedResponse;

    const userProfile = await getUserProfile(user.user.id);
    if (!user || userProfile.plan === 'free') return unauthorizedResponse;

    const { previousMessages, latestAssistantMessage } = (await req.json()) as {
      previousMessages: MessageType[];
      latestAssistantMessage: MessageType;
    };

    if (!previousMessages || !latestAssistantMessage)
      return new Response('Invalid request type', { status: 400 });

    const chatCompletionAPI = 'https://api.openai.com/v1/chat/completions';

    const messagesPayload = [
      ...previousMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: 'user',
        content: `
          Base on the past conversations, and the latest assistant response below, give me at most 3 potential answers that the user may respond in the same language as user previous message.
          For example, if the latest assistant message is "which artistic style would you like to use?", the suggestions could be "Van Gogh", "Picasso", "Monet".

          Latest assistant message: ${latestAssistantMessage.content}

          Respond in JSON format directly. For example: {"suggestions": ["Van Gogh", "Picasso", "Monet"]}
        `,
      },
    ];

    const suggestionResponse = await authorizedOpenAiRequest(
      chatCompletionAPI,
      {
        method: 'POST',
        body: JSON.stringify({
          messages: messagesPayload,
          max_tokens: 500,
          model: 'gpt-3.5-turbo-1106',
          temperature: 0.0,
          stream: false,
          response_format: { type: 'json_object' },
        }),
      },
    );

    if (!suggestionResponse.ok) {
      console.log(
        'Suggestion failed, response: ',
        await suggestionResponse.json(),
      );
      throw new Error('Failed to retrieve message');
    }

    const suggestionResponseObject = await suggestionResponse.json();

    try {
      const suggestionArrayObject =
        suggestionResponseObject.choices[0].message.content;
      const parsedObject = JSON.parse(suggestionArrayObject);
      const suggestions = Object.values(parsedObject)[0];

      console.log(suggestionArrayObject);

      return new Response(JSON.stringify(suggestions), {
        status: 200,
      });
    } catch (e) {
      console.log('Failed to parse suggestions: ', e);
      return new Response('{}', {
        status: 200,
      });
    }
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
