// This is our first version of our own API endpoint, currently it's only a wrapper of ChatGPT API's completion endpoint.
import { trackError } from '@/utils/app/azureTelemetry';
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TEMPERATURE,
  OPENAI_API_HOST,
} from '@/utils/app/const';
import { OpenAIError } from '@/utils/server';
import { getAdminSupabaseClient } from '@/utils/server/supabase';

import model from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';
// @ts-expect-error
import wasm from '@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';
import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

export const config = {
  runtime: 'edge',
};

type RequestBody = {
  message: string;
  temperature?: number;
};

const addApiUsageEntry = async (tokenLength: number) => {
  const supabase = getAdminSupabaseClient();
  const { error } = await supabase.from('api_usages').insert([
    {
      length: tokenLength,
      api_type: 'gpt-3.5-api',
    },
  ]);

  if (error) {
    console.error(error);
  }
};

const handler = async (req: Request): Promise<Response> => {
  // check Authorization header
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.API_ACCESS_KEY}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await init((imports) => WebAssembly.instantiate(wasm, imports));

  try {
    const { message, temperature } = (await req.json()) as RequestBody;

    let url = `${OPENAI_API_HOST}/v1/chat/completions`;

    const bodyToSend = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: DEFAULT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 800,
      temperature: temperature || DEFAULT_TEMPERATURE,
      stream: true,
    };

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      method: 'POST',
      body: JSON.stringify(bodyToSend),
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    if (res.status !== 200) {
      const result = await res.json();
      if (result.error) {
        throw new OpenAIError(
          result.error.message,
          result.error.type,
          result.error.param,
          result.error.code,
          res.status,
        );
      } else {
        throw new Error(
          `OpenAI API returned an error: ${
            decoder.decode(result?.value) || result.statusText
          }`,
        );
      }
    }

    let responseContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        const onParse = async (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === 'event') {
            const data = event.data;

            try {
              if (data === '[DONE]') {
                await addApiUsageEntry(getTokenLength(responseContent));
                controller.close();
                return;
              }

              const json = JSON.parse(data);
              const text = json.choices[0].delta.content;
              if (text) {
                responseContent += text;
              }
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              console.error(e);
              controller.error(e);
              //Log error to Azure App Insights
              trackError(e as string);
            }
          }
        };

        const parser = createParser(onParse);

        for await (const chunk of res.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error(error);
    //Log error to Azure App Insights
    trackError(error as string);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

const getTokenLength = (value: string) => {
  const encoding = new Tiktoken(
    model.bpe_ranks,
    model.special_tokens,
    model.pat_str,
  );
  const tokens = encoding.encode(value);
  encoding.free();

  return tokens.length;
};

export default handler;
