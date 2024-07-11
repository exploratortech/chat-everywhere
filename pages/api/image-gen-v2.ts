import { NextResponse } from 'next/server';

import { getHomeUrl } from '@/utils/app/api';
import {
  DEFAULT_IMAGE_GENERATION_QUALITY,
  DEFAULT_IMAGE_GENERATION_STYLE,
} from '@/utils/app/const';
import { capitalizeFirstLetter } from '@/utils/app/ui';
import { translateAndEnhancePrompt } from '@/utils/server/imageGen';
import { MjQueueJob, MjQueueService } from '@/utils/server/mjQueueService';
import {
  OriginalMjLogEvent,
  trackFailedEvent,
} from '@/utils/server/mjServiceServerHelper';
import {
  addCredit,
  addUsageEntry,
  getUserProfile,
  hasUserRunOutOfCredits,
  subtractCredit,
} from '@/utils/server/supabase';

import {
  MjButtonCommandRequest,
  MjImageGenRequest,
  MjJob,
} from '@/types/mjJob';
import { PluginID } from '@/types/plugin';

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
  maxDuration: 60,
};

const MY_MIDJOURNEY_API_KEY = process.env.MY_MIDJOURNEY_API_KEY || '';
const MY_MIDJOURNEY_ON_DEMAND_API_KEY =
  process.env.MY_MIDJOURNEY_ON_DEMAND_API_KEY || '';

const ContentFilterErrorMessageListFromMyMidjourneyProvider = [
  'Our AI moderator thinks this prompt is probably against our community standards',
  'Request cancelled due to image filters',
  'forbidden: The prompt has blocked words',
];

const switchApiKey = (apiKey: string) => {
  return apiKey === MY_MIDJOURNEY_API_KEY
    ? MY_MIDJOURNEY_ON_DEMAND_API_KEY
    : MY_MIDJOURNEY_API_KEY;
};

let hasApiKeySwitched = false;

const handler = async (req: Request) => {
  hasApiKeySwitched = false;
  const requestBody = (await req.json()) as {
    jobId: string;
    useOnDemand?: boolean;
  } | null;
  if (!requestBody) {
    return new Response('Bad request', { status: 400 });
  }

  if (!requestBody.jobId) {
    return new Response('Invalid request body', { status: 400 });
  }

  const requestHeader = {
    Authorization: `Bearer ${MY_MIDJOURNEY_API_KEY}`,
    'Content-Type': 'application/json',
  };

  if (requestBody.useOnDemand && MY_MIDJOURNEY_ON_DEMAND_API_KEY) {
    requestHeader.Authorization = `Bearer ${MY_MIDJOURNEY_ON_DEMAND_API_KEY}`;
  }

  // TODO: add Posthog event
  console.log(
    '🤧 Using on-demand API key: ',
    !!(requestBody.useOnDemand && MY_MIDJOURNEY_ON_DEMAND_API_KEY),
  );

  const jobInfo = await MjQueueJob.get(requestBody.jobId);
  if (!jobInfo) {
    return new Response('Invalid job id', { status: 400 });
  }

  async function imageGeneration(headers: {
    Authorization: string;
    'Content-Type': string;
  }) {
    if (!jobInfo) return;
    if (jobInfo.mjRequest.type !== 'MJ_IMAGE_GEN') {
      throw new Error('Invalid job type for the calling method');
    }
    const userPrompt = jobInfo.mjRequest.userPrompt;
    const imageStyle = jobInfo.mjRequest.imageStyle;
    const imageQuality = jobInfo.mjRequest.imageQuality;
    const temperature = jobInfo.mjRequest.temperature || undefined;
    let generationPrompt = await translateAndEnhancePrompt(userPrompt);
    if (!generationPrompt) {
      throw new Error('Failed to generate prompt');
    }

    return retryWithDifferentApiKey(async (currentHeaders) => {
      generationPrompt = generateMjPrompt(
        generationPrompt as string,
        imageStyle,
        imageQuality,
        temperature,
        userPrompt,
      );

      // Put the generated Prompt to JobInfo
      await MjQueueJob.update(jobInfo.jobId, {
        mjRequest: {
          ...(jobInfo.mjRequest as MjImageGenRequest),
          enhancedPrompt: generationPrompt,
        },
      });

      const imageGenerationResponse = await fetch(
        `https://api.mymidjourney.ai/api/v1/midjourney/imagine`,
        {
          method: 'POST',
          headers: currentHeaders,
          body: JSON.stringify({
            prompt: generationPrompt,
            ref: jobInfo.jobId,
            // TODO: rollback
            webhookOverride: `${`https://oriented-balanced-owl.ngrok-free.app`}/api/webhooks/mj-webhook-handler`,
          }),
        },
      );
      const responseText = await imageGenerationResponse.text();

      if (!imageGenerationResponse.ok) {
        if (
          ContentFilterErrorMessageListFromMyMidjourneyProvider.some(
            (errorMessage) => responseText.includes(errorMessage),
          )
        ) {
          await OriginalMjLogEvent({
            userId: jobInfo.userId,
            startTime: jobInfo.startProcessingAt || jobInfo.enqueuedAt,
            errorMessage: 'Image generation failed due to content filter',
            promptBeforeProcessing: (jobInfo.mjRequest as MjImageGenRequest)
              .userPrompt,
            generationPrompt: generationPrompt,
          });
          throw new Error('Image generation failed due to content filter', {
            cause: {
              message:
                'Sorry, our safety system detected unsafe content in your message. Please try again with a different topic.',
            },
          });
        }

        await OriginalMjLogEvent({
          userId: jobInfo.userId,
          startTime: jobInfo.startProcessingAt || jobInfo.enqueuedAt,
          errorMessage: 'Image generation failed',
          promptBeforeProcessing: (jobInfo.mjRequest as MjImageGenRequest).userPrompt,
          generationPrompt: generationPrompt,
        });
        console.log({
          responseText,
        });

        throw new Error('Image generation failed');
      }

      const responseJson = JSON.parse(responseText);

      if (responseJson.success !== true || !responseJson.messageId) {
        console.log(responseJson);
        console.error('Failed during submitting request');

        await OriginalMjLogEvent({
          userId: jobInfo.userId,
          startTime: jobInfo.startProcessingAt || jobInfo.enqueuedAt,
          errorMessage: 'Failed during submitting request',
          promptBeforeProcessing: (jobInfo.mjRequest as MjImageGenRequest).userPrompt,
          generationPrompt: generationPrompt,
        });

        throw new Error('Image generation failed');
      }

      return responseJson;
    }, headers);
  };

  const buttonCommand = async (
    headers: {
      Authorization: string;
      'Content-Type': string;
    },
  ) => {
    if (!jobInfo) return;
    if (jobInfo.mjRequest.type !== 'MJ_BUTTON_COMMAND') {
      throw new Error('Invalid job type for the calling method');
    }

    return retryWithDifferentApiKey(async (currentHeaders) => {
      const imageGenerationResponse = await fetch(
        `https://api.mymidjourney.ai/api/v1/midjourney/button`,
        {
          method: 'POST',
          headers: currentHeaders,
          body: JSON.stringify({
            messageId: (jobInfo.mjRequest as MjButtonCommandRequest).messageId,
            button: (jobInfo.mjRequest as MjButtonCommandRequest).button,
            ref: jobInfo.jobId,
            // TODO: rollback
            webhookOverride: `${`https://oriented-balanced-owl.ngrok-free.app`}/api/webhooks/mj-webhook-handler`,
          }),
        },
      );
      const imageGenerationResponseText = await imageGenerationResponse.text();

      if (!imageGenerationResponse.ok) {
        if (
          ContentFilterErrorMessageListFromMyMidjourneyProvider.some(
            (errorMessage) => imageGenerationResponseText.includes(errorMessage),
          )
        ) {
          throw new Error('Image generation failed due to content filter', {
            cause: {
              message:
                'Sorry, our safety system detected unsafe content in your message. Please try again with a different topic.',
            },
          });
        }

        throw new Error('Image generation failed');
      }

      const imageGenerationResponseJson = JSON.parse(imageGenerationResponseText);

      if (
        imageGenerationResponseJson.success !== true ||
        !imageGenerationResponseJson.messageId
      ) {
        console.log(imageGenerationResponseJson);
        console.error('Failed during submitting request');
        throw new Error('Image generation failed');
      }

      return imageGenerationResponseJson;
    }, headers);
  };

  const retryWithDifferentApiKey = async <T>(
    operation: (headers: {
      Authorization: string;
      'Content-Type': string;
    }) => Promise<T>,
    initialHeaders: { Authorization: string; 'Content-Type': string },
  ): Promise<T> => {
    if (!jobInfo) throw new Error('Job info not found');
    try {
      return await operation(initialHeaders);
    } catch (error) {
      if (hasApiKeySwitched) {
        // If the API key has already been switched, do not switch it again
        throw error;
      }
      // TODO: Add Posthog event
      console.log('🤧 First attempt failed, retrying with different API key');

      const currentApiKey = initialHeaders.Authorization.split(' ')[1];
      const newApiKey = switchApiKey(currentApiKey);
      const newAuthorizationHeader = `Bearer ${newApiKey}`;

      const retryHeaders = {
        ...initialHeaders,
        Authorization: newAuthorizationHeader,
      };
      hasApiKeySwitched = true;
      return await operation(retryHeaders);
    }
  };


  let hasSubtractedUserCredit = false;
  try {
    hasSubtractedUserCredit = await subtractedUserCredit(jobInfo.userId);
    if (jobInfo.mjRequest.type === 'MJ_BUTTON_COMMAND') {
      await buttonCommand(requestHeader);
    }
    if (jobInfo.mjRequest.type === 'MJ_IMAGE_GEN') {
      await imageGeneration(requestHeader);
    }

    return new NextResponse(JSON.stringify({}), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in image generation', error);
    console.log(`Error is instanceof Error: ${error instanceof Error}`);
    if (error instanceof Error) {
      const errorMessage =
        (error.cause as { message?: string })?.message || error.message;
      const trackFailedEventPromise = trackFailedEvent(jobInfo, errorMessage);
      const markFailedPromise = MjQueueJob.markFailed(
        jobInfo.jobId,
        errorMessage,
      );
      await Promise.all([trackFailedEventPromise, markFailedPromise]);
    }

    // Remove the job from the processing set
    await Promise.all([
      MjQueueService.removeFromProcessingSet(jobInfo.jobId),
      hasSubtractedUserCredit
        ? addCredit(jobInfo.userId, PluginID.IMAGE_GEN, 1)
        : Promise.resolve(),
    ]);
    return new Response('Image generation failed', { status: 500 });
  }
};

export default handler;

const generateMjPrompt = (
  userInputText: string,
  style: string = DEFAULT_IMAGE_GENERATION_STYLE,
  quality: string = DEFAULT_IMAGE_GENERATION_QUALITY,
  temperature: number = 0.5,
  originalPrompt?: string,
): string => {
  let resultPrompt = userInputText;

  if (style !== 'Default') {
    resultPrompt += `, ${capitalizeFirstLetter(style)}`;
  }

  switch (quality) {
    case 'High':
      resultPrompt += ' --quality 1';
      break;
    case 'Medium':
      resultPrompt += ' --quality .5';
      break;
    case 'Low':
      resultPrompt += ' --quality .25';
      break;
    default:
      resultPrompt += ' --quality 1';
      break;
  }

  if (temperature === 0.5) {
    resultPrompt += ' --chaos 5';
  } else if (temperature > 0.5) {
    resultPrompt += ' --chaos 50';
  }

  if (originalPrompt) {
    const originalPromptSubstrings = originalPrompt.match(
      /--\w+ \d+(\.\d+)?(:\d+)?/g,
    );
    if (originalPromptSubstrings) {
      originalPromptSubstrings.forEach((substring) => {
        if (!resultPrompt.includes(substring)) {
          resultPrompt += ` ${substring}`;
        }
      });
    }
  }

  return resultPrompt;
};


async function subtractedUserCredit(userId: string): Promise<boolean> {
  try {
    console.log('Checking if user has run out of credits...');
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    const isUserInUltraPlan = userProfile.plan === 'ultra';
    if (isUserInUltraPlan) {
      return false;
    }
    if (await hasUserRunOutOfCredits(userId, PluginID.IMAGE_GEN)) {
      throw new Error('User has run out of credits');
    }

    await addUsageEntry(PluginID.IMAGE_GEN, userId);
    await subtractCredit(userId, PluginID.IMAGE_GEN);
    return true;
  } catch (error) {
    console.error('Error subtracting user credit', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('User out of image generation credit');
  }
}
