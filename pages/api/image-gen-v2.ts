import { NextResponse } from 'next/server';

import { getHomeUrl } from '@/utils/app/api';
import {
  DEFAULT_IMAGE_GENERATION_QUALITY,
  DEFAULT_IMAGE_GENERATION_STYLE,
} from '@/utils/app/const';
import { capitalizeFirstLetter } from '@/utils/app/ui';
import { translateAndEnhancePrompt } from '@/utils/server/imageGen';
import { MjQueueJob, MjQueueService } from '@/utils/server/mjQueueService';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const ContentFilterErrorMessageListFromMyMidjourneyProvider = [
  'Our AI moderator thinks this prompt is probably against our community standards',
  'Request cancelled due to image filters',
  'forbidden: The prompt has blocked words',
];

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
  } else if (temperature > 0.5) {
    resultPrompt += ' --chaos 5';
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

const handler = async (req: Request) => {
  const requestBody = (await req.json()) as {
    jobId: string;
  } | null;
  if (!requestBody) {
    return new Response('Bad request', { status: 400 });
  }

  if (!requestBody.jobId) {
    return new Response('Invalid request body', { status: 400 });
  }

  try {
    const jobInfo = await MjQueueJob.get(requestBody.jobId);
    if (!jobInfo) {
      return new Response('Invalid job id', { status: 400 });
    }

    const userPrompt = jobInfo.mjRequest.userPrompt;
    const imageStyle = jobInfo.mjRequest.imageStyle;
    const imageQuality = jobInfo.mjRequest.imageQuality;
    const temperature = jobInfo.mjRequest.temperature || undefined;

    let generationPrompt = userPrompt;

    const imageGeneration = async () => {
      const requestHeader = {
        Authorization: `Bearer ${process.env.MY_MIDJOURNEY_API_KEY || ''}`,
        'Content-Type': 'application/json',
      };

      generationPrompt = await translateAndEnhancePrompt(userPrompt);

      generationPrompt = generateMjPrompt(
        generationPrompt,
        imageStyle,
        imageQuality,
        temperature,
        userPrompt,
      );
      console.log({
        generationPrompt,
      });

      // Put the generated Prompt to JobInfo
      await MjQueueJob.update(requestBody.jobId, {
        mjRequest: {
          ...jobInfo.mjRequest,
          enhancedPrompt: generationPrompt,
        },
      });

      const imageGenerationResponse = await fetch(
        `https://api.mymidjourney.ai/api/v1/midjourney/imagine`,
        {
          method: 'POST',
          headers: requestHeader,
          body: JSON.stringify({
            prompt: generationPrompt,
            ref: requestBody.jobId,
            webhookOverride: `${getHomeUrl()}/api/webhooks/mj-health-check`,
          }),
        },
      );
      const imageGenerationResponseText = await imageGenerationResponse.text();

      if (!imageGenerationResponse.ok) {
        if (
          ContentFilterErrorMessageListFromMyMidjourneyProvider.some(
            (errorMessage) =>
              imageGenerationResponseText.includes(errorMessage),
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

      const imageGenerationResponseJson = JSON.parse(
        imageGenerationResponseText,
      );

      if (
        imageGenerationResponseJson.success !== true ||
        !imageGenerationResponseJson.messageId
      ) {
        console.log(imageGenerationResponseJson);
        console.error('Failed during submitting request');
        throw new Error('Image generation failed');
      }
    };

    await imageGeneration();

    return new NextResponse(JSON.stringify({}), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      const errorMessage =
        (error.cause as { message?: string })?.message || error.message;
      await MjQueueJob.markFailed(requestBody.jobId, errorMessage);
    }

    return new Response('Image generation failed', { status: 500 });
  }
};

export default handler;
