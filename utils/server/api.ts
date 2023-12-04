import { Message } from '@/types/chat';

// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';

const tokenCounterBuffer = 100;

const getEncodingInstance = async () => {
  await init((imports) => WebAssembly.instantiate(wasm, imports));
  return new Tiktoken(
    tiktokenModel.bpe_ranks,
    tiktokenModel.special_tokens,
    tiktokenModel.pat_str,
  );
};

export const getHomeUrl = (): string => {
  let homeUrl = !process.env.NEXT_PUBLIC_ENV
    ? `http://localhost:3000`
    : `https://${process.env.VERCEL_URL}`;

  homeUrl =
    process.env.NEXT_PUBLIC_ENV === 'production'
      ? 'https://chateverywhere.app'
      : homeUrl;
  return homeUrl;
};

export const shortenMessagesBaseOnTokenLimit = async (
  prompt: string,
  messages: Message[],
  tokenLimit: number,
  completionTokens: number = 2000, // Number of tokens to reserve for completion, the max_token params in the API
): Promise<Message[]> => {
  const encoding = await getEncodingInstance();

  const promptTokens = encoding.encode(prompt);

  let tokenCount = promptTokens.length;
  let messagesToSend: Message[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const tokens = encoding.encode(message.content);

    if (
      tokenCount + tokens.length + completionTokens + tokenCounterBuffer >
      tokenLimit
    ) {
      break;
    }
    tokenCount += tokens.length;
    messagesToSend = [message, ...messagesToSend];
  }

  if (messagesToSend.length === 0) {
    // Shorten the last message if it's too long
    const lastMessage = messages[messages.length - 1];
    let shortenedMessageContent = '';
    for (let i = 0; i < lastMessage.content.length; i++) {
      const char = lastMessage.content[i];
      const tokens = encoding.encode(char);

      if (
        tokenCount + tokens.length + completionTokens + tokenCounterBuffer >
        tokenLimit
      ) {
        break;
      }
      tokenCount += tokens.length;
      shortenedMessageContent += char;
    }
    encoding.free();
    return [
      {
        ...lastMessage,
        content: shortenedMessageContent,
      },
    ];
  } else {
    encoding.free();
    return messagesToSend;
  }
};

export const trimStringBaseOnTokenLimit = async (
  string: string,
  tokenLimit: number,
): Promise<string> => {
  const encoding = await getEncodingInstance();

  let tokenCount = 0;
  let shortenedString = '';

  if (!string || string.length === 0) {
    return shortenedString;
  }

  for (let i = 0; i < string.length; i++) {
    const char = string[i];
    const tokens = encoding.encode(char);

    if (tokenCount > tokenLimit) {
      break;
    }
    tokenCount += tokens.length;
    shortenedString += char;
  }

  encoding.free();
  return shortenedString;
};

export const getMessagesTokenCount = async (
  messages: Message[] | { role: string; content: string }[],
): Promise<number> => {
  const encoding = await getEncodingInstance();

  let tokenCount = 0;
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const tokens = encoding.encode(message.content);
    tokenCount += tokens.length;
  }

  return tokenCount;
};

export const getStringTokenCount = async (string: string): Promise<number> => {
  const encoding = await getEncodingInstance();

  const tokens = encoding.encode(string);
  return tokens.length;
};
