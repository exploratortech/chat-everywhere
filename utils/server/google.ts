import { getAccessToken } from '@/utils/server/google/auth';

import { Message } from '@/types/chat';

import { logEvent } from './api';

import {
  Content,
  GenerateContentResponse,
  GenerationConfig,
  SafetyRating,
} from '@google-cloud/vertexai';
import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

// Refer to this page for all the available models: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models

const PROJECT_ID = process.env.GCP_PROJECT_ID as string;
// const API_ENDPOINT = 'us-east1-aiplatform.googleapis.com';
// const LOCATION_ID = 'us-east1';
const API_ENDPOINT = 'asia-east1-aiplatform.googleapis.com';
const LOCATION_ID = 'asia-east1';
const MODEL_ID = 'gemini-1.5-flash';

export const cleanSourceText = (text: string) => {
  return text
    .trim()
    .replace(/(\n){4,}/g, '\n\n\n')
    .replace(/\n\n/g, ' ')
    .replace(/ {3,}/g, '  ')
    .replace(/\t/g, '')
    .replace(/\n+(\s*\n)*/g, '\n');
};

export async function callGeminiAPI({
  userIdentifier,
  contents,
  generationConfig,
  safetySettings,
  systemInstruction,
  messagesToSendInArray,
}: {
  userIdentifier: string;
  contents: Content[];
  generationConfig: GenerationConfig;
  safetySettings?: any[];
  systemInstruction: Content;
  messagesToSendInArray: Message[];
}) {
  const requestPayload = {
    contents,
    generationConfig,
    safetySettings: safetySettings || [],
    systemInstruction,
  };

  const startTime = Date.now();

  const access_token = await getAccessToken();
  const url = `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:streamGenerateContent?alt=sse`;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let timeToFirstTokenInMs = 0;
  return new ReadableStream({
    async start(controller) {
      let isStreamClosed = false;
      const placeHolder = '[PLACEHOLDER]';
      controller.enqueue(encoder.encode(placeHolder));

      const intervalId = setInterval(() => {
        if (isStreamClosed) {
          clearInterval(intervalId);
        } else {
          controller.enqueue(encoder.encode(placeHolder));
        }
      }, 10000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          const res = await response.json();
          console.error(res);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const body = response.body;

        let respondMessage = '';

        const parser = createParser(
          async (event: ParsedEvent | ReconnectInterval) => {
            if (event.type === 'event') {
              const data = event.data;

              try {
                if (data === '[DONE]') {
                  controller.close();
                  isStreamClosed = true;
                  return;
                }
                const json = JSON.parse(data) as GenerateContentResponse;
                json?.candidates?.forEach((item) => {
                  const content = item.content;

                  if (content.role === 'model') {
                    if (timeToFirstTokenInMs === 0) {
                      timeToFirstTokenInMs = Date.now() - startTime;
                    }
                    const text = content.parts
                      .map((part) => part.text)
                      .join('');

                    respondMessage += text;
                    controller.enqueue(encoder.encode(text));
                  }
                  if (item.finishReason && item.finishReason === 'STOP') {
                    controller.close();
                    isStreamClosed = true;
                  }
                });
                if (json?.promptFeedback?.blockReason) {
                  controller.enqueue(
                    encoder.encode(
                      `CONTENT BLOCKED BY GOOGLE GEMINI: ${json.promptFeedback.blockReason}`,
                    ),
                  );
                  controller.close();
                  isStreamClosed = true;
                }
              } catch (e) {
                console.error(e);
                controller.error(e);
                isStreamClosed = true;
              }
            }
          },
        );

        for await (const chunk of body as any) {
          const decoded = decoder.decode(chunk, { stream: true });
          parser.feed(decoded);
        }
        await logEvent({
          userIdentifier,
          eventName: 'Gemini mode message',
          promptMessages: messagesToSendInArray,
          completionMessage: respondMessage,
          totalDurationInMs: Date.now() - startTime,
          timeToFirstTokenInMs,
          endpoint: url,
          geminiRequestPayload: {
            contents,
            system_instruction: systemInstruction,
          },
          geminiFinalPayload: {
            contents: [
              ...contents,
              {
                parts: [{ text: respondMessage }],
                role: 'model',
              },
            ],
            system_instruction: systemInstruction,
          },
        });
      } catch (error) {
        console.error('Failed to call Gemini API:', error);
        controller.error(error);
        isStreamClosed = true;
      }
    },
  });
}

export async function getTokenCountForPrompt(payload: {
  contents: Content[];
  system_instruction: Content;
}) {
  let totalTokens = 0;
  try {
    const url = `https://${LOCATION_ID}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:countTokens`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    totalTokens = data.totalTokens;
  } catch (e) {
    console.error(e);
  } finally {
    return totalTokens;
  }
}
