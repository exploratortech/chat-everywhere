import { Conversation } from '@/types/chat';

import { load } from 'cheerio';

export const getUpdatedAssistantMjConversationV2 = (
  selectedConversation: Conversation,
  buttonMessageId: string,
) => {
  // find the message with role assistant, pluginId image-gen, and content includes the buttonMessageId
  const assistantImgGenMessageContent = selectedConversation?.messages.filter(
    (message) => {
      return (
        message.role === 'assistant' &&
        message.pluginId === 'image-gen' &&
        message.content.includes(buttonMessageId)
      );
    },
  );

  if (!assistantImgGenMessageContent) return;

  console.log(assistantImgGenMessageContent);
  const oldContent = assistantImgGenMessageContent[0].content;

  // find the html tag with id mj-image-static-v2, return the content
  const mjImageSelection = oldContent.match(
    /(<div id="mj-image-static-v2" (.*)>(.*)<\/div>)/,
  );

  const html = mjImageSelection?.[0];
  if (!html) return;

  const $ = load(html);
  // find all img tag , add data-ai-image-button-commands-executed="1" to all the image tag
  const images = $('img');
  images.each((index, element) => {
    $(element).attr('data-ai-image-button-commands-executed', '1');
  });
  const result = $('#mj-image-static-v2').prop('outerHTML')!;

  // update the message content with the new html string, replace the old html string
  const newContent = oldContent.replace(
    /(<div id="mj-image-static-v2" (.*)>(.*)<\/div>)/,
    result,
  );
  selectedConversation.messages = selectedConversation.messages.map(
    (message) => {
      if (
        message.role === 'assistant' &&
        message.pluginId === 'image-gen' &&
        message.content.includes(buttonMessageId)
      ) {
        message.content = newContent;
        return message;
      } else {
        return message;
      }
    },
  );
  return selectedConversation;
};

export const getUpdatedAssistantMjConversation = (
  selectedConversation: Conversation,
  buttonMessageId: string,
) => {
  // find the message with role assistant, pluginId image-gen, and content includes the buttonMessageId
  const assistantImgGenMessageContent = selectedConversation?.messages.filter(
    (message) => {
      return (
        message.role === 'assistant' &&
        message.pluginId === 'image-gen' &&
        message.content.includes(buttonMessageId)
      );
    },
  );

  if (!assistantImgGenMessageContent) return;

  console.log(assistantImgGenMessageContent);
  const oldContent = assistantImgGenMessageContent[0].content;

  // find the html tag with id mj-image-selection, return the content
  const mjImageSelection = oldContent.match(
    /(<div id="mj-image-selection" (.*)>(.*)<\/div>)/,
  );

  const html = mjImageSelection?.[0];
  if (!html) return;

  const $ = load(html);
  // find all img tag , add data-ai-image-button-commands-executed="1" to all the image tag
  const images = $('img');
  images.each((index, element) => {
    $(element).attr('data-ai-image-button-commands-executed', '1');
  });
  const result = $('#mj-image-selection').prop('outerHTML')!;

  // update the message content with the new html string, replace the old html string
  const newContent = oldContent.replace(
    /(<div id="mj-image-selection" (.*)>(.*)<\/div>)/,
    result,
  );
  selectedConversation.messages = selectedConversation.messages.map(
    (message) => {
      if (
        message.role === 'assistant' &&
        message.pluginId === 'image-gen' &&
        message.content.includes(buttonMessageId)
      ) {
        message.content = newContent;
        return message;
      } else {
        return message;
      }
    },
  );
  return selectedConversation;
};
