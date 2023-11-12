import { NextApiRequest, NextApiResponse } from 'next';

import { getAdminSupabaseClient } from '@/utils/server/supabase';
import {
  getOpenAiRunObject,
  updateMetadataOfMessage,
  generateImage,
  submitToolOutput
} from '@/utils/v2Chat/openAiApiUtils';

interface RequestBody {
  threadId: string;
  messageId: string;
  runId: string;
}

// This serverless function is responsible for generating an image for a message
// and storing it in the database.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }

  const { threadId, messageId, runId } = req.body as RequestBody;

  if (!threadId || !messageId || !runId) {
    res.status(400).json({ error: 'Missing threadId or messageId or runId' });
    return;
  }

  console.log("Generating image with threadId, messageId, runId ", threadId, messageId, runId);
  

  const supabase = getAdminSupabaseClient();
  let toolCallId = null;

  try {
    const { data: thread, error } = await supabase
      .from('user_v2_conversations')
      .select('*')
      .eq('threadId', threadId)
      .single();

    if (error) throw new Error(JSON.stringify(error));

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    const run = await getOpenAiRunObject(threadId, runId);
    const requiredAction = run.required_action;
    
    if (!requiredAction) {
      res.status(400).json({ error: 'Run does not require action' });
      return;
    }

    const toolCall = requiredAction.submit_tool_outputs.tool_calls.find(
      (toolCall) => toolCall.function.name === "generate_image"
    );

    if (!toolCall) {
      res.status(400).json({ error: 'Tool call not found' });
      return;
    }

    toolCallId = toolCall.id;

    const imageGenerationPrompt = toolCall.function.arguments;
    const imageGenerationPromptString = JSON.parse(imageGenerationPrompt).prompt;

    const imageGenerationResponse = await generateImage(imageGenerationPromptString);
    const imageGenerationUrl = imageGenerationResponse.data[0].url;

    console.log("Image url: ", imageGenerationUrl);
    
    await updateMetadataOfMessage(threadId, messageId, {
      imageGenerationStatus: 'completed',
      imageUrl: imageGenerationUrl,
    });

    await submitToolOutput(threadId, runId, toolCallId, "Successfully generated image");

    res.status(200).end();

  } catch (error) {
    // Update meta data in message
    await updateMetadataOfMessage(threadId, messageId, {
      imageGenerationStatus: 'failed',
    });
    if(toolCallId){
      await submitToolOutput(threadId, runId, toolCallId, "Unable to generate image, please try again");
    }
    console.error(error);
    res.status(500).json({ error: 'Unable to generate image' });
    return;
  }
}
