// This serverless function is responsible for generating an image for a message
// and storing it in the thread.
import { NextApiRequest, NextApiResponse } from 'next';

import { getAdminSupabaseClient } from '@/utils/server/supabase';
import {
  generateImage,
  getOpenAiRunObject,
  submitToolOutput,
  updateMetadataOfMessage,
  waitForRunToCompletion,
} from '@/utils/v2Chat/openAiApiUtils';

import { authorizedOpenAiRequest } from '@/utils/server';


interface RequestBody {
  threadId: string;
  messageId: string;
  runId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log('Image generation endpoint is hit');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }

  const { threadId, messageId, runId } = req.body as RequestBody;

  if (!threadId || !messageId || !runId) {
    res.status(400).json({ error: 'Missing threadId or messageId or runId' });
    return;
  }

  console.log(
    'Generating image with threadId, messageId, runId ',
    threadId,
    messageId,
    runId,
  );

  const supabase = getAdminSupabaseClient();
  let toolCallId = null;

  const { data: thread } = await supabase
    .from('user_v2_conversations')
    .select('*')
    .eq('threadId', threadId)
    .single();

  if (!thread) {
    res.status(404).json({ error: 'Thread not found' });
    return;
  }

  // WORKING TAG ===

  // try {
    // const run = await getOpenAiRunObject(threadId, runId);
    
    const openAiUrl = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`;
    
    // const response = await authorizedOpenAiRequest(openAiUrl);
    // Breaking down the above line

    const headers = {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v1',
      'Content-Type': 'application/json',
    };
    await fetch(openAiUrl, { headers });
    // === TESTING WORKING TAG ===

    // if (!response.ok) {
    //   console.error(await response.text());
    //   throw new Error('Failed to retrieve run');
    // }
    // === NOT WORKING TAG ===

    // const requiredAction = run.required_action;
  // } catch (error) {
    // console.error("Unable to get OpenAi run object");
    // res.status(500).json({ error: 'Unable to generate image' });
  //   return;
  // }

  // if (!requiredAction) {
  //   res.status(400).json({ error: 'Run does not require action' });
  //   return;
  // }


  // const toolCall = requiredAction.submit_tool_outputs.tool_calls.find(
  //   (toolCall) => toolCall.function.name === 'generate_image',
  // );

  // if (!toolCall) {
  //   res.status(400).json({ error: 'Tool call not found' });
  //   return;
  // }

  // toolCallId = toolCall.id;

  // const imageGenerationPrompt = toolCall.function.arguments;
  // const imageGenerationPromptString = JSON.parse(
  //   imageGenerationPrompt,
  // ).prompt;

  // const imageGenerationResponse = await generateImage(
  //   imageGenerationPromptString,
  // );
  // const imageGenerationUrl = imageGenerationResponse.data[0].url;

  // console.log('Image url: ', imageGenerationUrl);

  // await submitToolOutput(
  //   threadId,
  //   runId,
  //   toolCallId,
  //   'Successfully generated image with URL: ' + imageGenerationUrl,
  // );

  // await waitForRunToCompletion(threadId, runId);

  // await updateMetadataOfMessage(threadId, messageId, {
  //   imageGenerationStatus: 'completed',
  //   imageUrl: imageGenerationUrl,
  // });

  res.status(200).end();
  // } catch (error) {
  // try {
  //   // Update meta data in message
  //   await updateMetadataOfMessage(threadId, messageId, {
  //     imageGenerationStatus: 'failed',
  //   });
  //   if (toolCallId) {
  //     await submitToolOutput(
  //       threadId,
  //       runId,
  //       toolCallId,
  //       'Unable to generate image, please try again',
  //     );
  //   }
  // } catch (error) {
  //   console.error(
  //     'Error updating metadata or submitting tool output: ',
  //     error,
  //   );
  // }
  //   console.error(error);
  //   res.status(500).json({ error: 'Unable to generate image' });
  //   return;
  // }
}
