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
  ProcessingMjJob,
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

const switchApiKey = (authorizationHeader: string) => {
  const apiKey = authorizationHeader.split(' ')[1];
  return apiKey === MY_MIDJOURNEY_API_KEY
    ? `Bearer ${MY_MIDJOURNEY_ON_DEMAND_API_KEY}`
    : `Bearer ${MY_MIDJOURNEY_API_KEY}`;
};

const retryWithDifferentApiKey = async <T>(
  operation: (headers: {
    Authorization: string;
    'Content-Type': string;
  }) => Promise<T>,
  initialHeaders: { Authorization: string; 'Content-Type': string },
): Promise<T> => {
  try {
    return await operation(initialHeaders);
  } catch (error) {
    // TODO: Add Posthog event
    console.log('🤧 First attempt failed, retrying with different API key');
    const newAuthorizationHeader = switchApiKey(initialHeaders.Authorization);
    const retryHeaders = {
      ...initialHeaders,
      Authorization: newAuthorizationHeader,
    };
    return await operation(retryHeaders);
  }
};

const handler = async (req: Request) => {
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

  let hasSubtractedUserCredit = false;
  try {
    hasSubtractedUserCredit = await subtractedUserCredit(jobInfo.userId);
    if (jobInfo.mjRequest.type === 'MJ_BUTTON_COMMAND') {
      await buttonCommand(jobInfo, requestHeader);
    }
    if (jobInfo.mjRequest.type === 'MJ_IMAGE_GEN') {
      await imageGeneration(jobInfo, requestHeader);
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

const imageGeneration = async (
  job: MjJob,
  headers: {
    Authorization: string;
    'Content-Type': string;
  },
) => {
  if (job.mjRequest.type !== 'MJ_IMAGE_GEN') {
    throw new Error('Invalid job type for the calling method');
  }
  const userPrompt = job.mjRequest.userPrompt;
  const imageStyle = job.mjRequest.imageStyle;
  const imageQuality = job.mjRequest.imageQuality;
  const temperature = job.mjRequest.temperature || undefined;
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
    await MjQueueJob.update(job.jobId, {
      mjRequest: {
        ...(job.mjRequest as MjImageGenRequest),
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
          ref: job.jobId,
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
          userId: job.userId,
          startTime: job.startProcessingAt || job.enqueuedAt,
          errorMessage: 'Image generation failed due to content filter',
          promptBeforeProcessing: (job.mjRequest as MjImageGenRequest)
            .userPrompt,
          generationPrompt: generationPrompt,
          useOnDemandCredit: job.status !== 'QUEUED' ? !!(job.useOnDemandCredit) : false,
        });
        throw new Error('Image generation failed due to content filter', {
          cause: {
            message:
              'Sorry, our safety system detected unsafe content in your message. Please try again with a different topic.',
          },
        });
      }

      await OriginalMjLogEvent({
        userId: job.userId,
        startTime: job.startProcessingAt || job.enqueuedAt,
        errorMessage: 'Image generation failed',
        promptBeforeProcessing: (job.mjRequest as MjImageGenRequest).userPrompt,
        generationPrompt: generationPrompt,
        useOnDemandCredit: job.status !== 'QUEUED' ? !!(job.useOnDemandCredit) : false,
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
        userId: job.userId,
        startTime: job.startProcessingAt || job.enqueuedAt,
        errorMessage: 'Failed during submitting request',
        promptBeforeProcessing: (job.mjRequest as MjImageGenRequest).userPrompt,
        generationPrompt: generationPrompt,
        useOnDemandCredit: job.status !== 'QUEUED' ? !!(job.useOnDemandCredit) : false,
      });

      throw new Error('Image generation failed');
    }

    return responseJson;
  }, headers);
};

const buttonCommand = async (
  job: MjJob,
  headers: {
    Authorization: string;
    'Content-Type': string;
  },
) => {
  if (job.mjRequest.type !== 'MJ_BUTTON_COMMAND') {
    throw new Error('Invalid job type for the calling method');
  }

  return retryWithDifferentApiKey(async (currentHeaders) => {
    const imageGenerationResponse = await fetch(
      `https://api.mymidjourney.ai/api/v1/midjourney/button`,
      {
        method: 'POST',
        headers: currentHeaders,
        body: JSON.stringify({
          messageId: (job.mjRequest as MjButtonCommandRequest).messageId,
          button: (job.mjRequest as MjButtonCommandRequest).button,
          ref: job.jobId,
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
