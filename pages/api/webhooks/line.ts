import { NextApiRequest, NextApiResponse } from 'next';
import { Client, Message, WebhookRequestBody, validateSignature } from '@line/bot-sdk';
import getRawBody from 'raw-body';

import { OpenAIStream } from '@/utils/server';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { createConversationByApp, getConversationByApp, saveConversationByApp } from '@/utils/server/supabase';
import { executeCommand, isCommand } from '@/utils/app/commands';
import { getInstantMessageAppUser } from '@/utils/server/pairing';

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
}

const client = new Client(lineConfig);

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const rawBody = await getRawBody(req);

  const signature = req.headers['x-line-signature'] as string;
  if (!validateSignature(rawBody, lineConfig.channelSecret, signature)) {
    res.status(401).end('Signature Invalid');
    return;
  }

  const data: WebhookRequestBody = JSON.parse(Buffer.from(rawBody).toString());
  const event = data.events[0];
  
  if (!event) {
    // LINE may send a request without events to confirm communication
    res.status(200).end();
    return;
  }

  switch (event.type) {
    case 'message': {
      if (event.message.type !== "text") {
        client.replyMessage(event.replyToken, {
          emojis: [{
            index: 0,
            productId: '5ac1bfd5040ab15980c9b435',
            emojiId: '024',
          }],
          text: '$ Sorry, I can only handle text messages.',
          type: 'text',
        });
      } else {
        if (isCommand(event.message.text)) {
          const result = await executeCommand(
            event.message.text,
            { lineId: event.source.userId },
          );
          client.replyMessage(event.replyToken, {
            text: result.message,
            type: 'text',
          });
        } else {
          const lineId = event.source.userId!;
          // 1. Fetch conversation by LINE user id
          // TODO: Check if the user has consented to sharing their user id
          let conversation = await getConversationByApp(lineId);
  
          if (conversation == null) {
            try {
              conversation = await createConversationByApp(lineId);
            } catch (error) {
              client.replyMessage(event.replyToken, {
                text: 'Unable to create conversation',
                type: 'text',
              });
              res.status(200).end();
              return;
            }
          }
  
          const messages = conversation.content;
  
          messages.push({
            role: 'user',
            content: event.message.text,
            pluginId: null,
          });
  
          const stream = await OpenAIStream(
            OpenAIModels[OpenAIModelID.GPT_3_5],
            'You are a helpful chatbot part of the Chat Everywhere app created by Explorator Labs. The link to the app is \'https://chateverywhere.app\'.',
            DEFAULT_TEMPERATURE,
            messages,
            null,
          );
  
          const reader = stream.getReader();
          const decoder = new TextDecoder();
  
          let doneReading = false;
          let content = '';
  
          while (!doneReading) {
            const { value, done } = await reader.read();
            const chunk = decoder.decode(value);
            doneReading = done;
            content += chunk;
          }
    
          const replyMessage: Message = {
            text: content,
            type: 'text',
          };
  
          messages.push({
            role: 'assistant',
            content: replyMessage.text,
            pluginId: null,
          });
  
          client.replyMessage(event.replyToken, replyMessage);
          await saveConversationByApp(lineId, {
            content: messages,
          });
        }
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).end();
};

export default handler;
