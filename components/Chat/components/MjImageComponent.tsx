import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery } from 'react-query';

import {
  saveConversation,
  saveConversations,
  updateConversation,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';
import { getUpdatedAssistantMjConversation } from '@/utils/app/mjImage';
import { removeSecondLastLine } from '@/utils/app/ui';

import { Conversation, Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import dayjs from 'dayjs';

interface MjImageComponentProps {
  src: string;
  buttons: string[];
  buttonMessageId: string;
}

export default function MjImageComponent({
  src,
  buttons,
  buttonMessageId,
}: MjImageComponentProps) {
  const {
    state: {
      user,
      isPaidUser,
      selectedConversation,
      conversations,
      currentMessage,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const runButtonCommand = async (button: string) => {
    if (!user) return;
    let updatedConversation: Conversation;
    if (!selectedConversation) return;
    updatedConversation = selectedConversation;

    homeDispatch({ field: 'loading', value: true });
    homeDispatch({ field: 'messageIsStreaming', value: true });

    const controller = new AbortController();
    const response = await fetch('api/mj-image-upscale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-token': user?.token || '',
      },
      signal: controller.signal,
      body: JSON.stringify({
        button: button,
        buttonMessageId,
      }),
    });
    if (!response.ok) {
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
      throw new Error('Network response was not ok');
    }

    const data = response.body;
    if (!data) {
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
      return;
    }
    // response is ok, continue
    homeDispatch({ field: 'loading', value: false });
    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let text = '';
    let largeContextResponse = false;
    let showHintForLargeContextResponse = false;
    const originalMessages =
      updatedConversation.messages[updatedConversation.messages.length - 1]
        .content;
    while (!done) {
      // TODO: need a way to stop the conversation
      // if (stopConversationRef.current === true) {
      //   controller.abort();
      //   done = true;
      //   break;
      // }
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      text += chunkValue;

      if (text.includes('[DONE]')) {
        text = text.replace('[DONE]', '');
        done = true;
      }
      if (text.includes('[REMOVE_LAST_LINE]')) {
        text = text.replace('[REMOVE_LAST_LINE]', '');
        text = removeSecondLastLine(text);
      }

      const updatedMessages: Message[] = updatedConversation.messages.map(
        (message, index) => {
          if (index === updatedConversation.messages.length - 1) {
            return {
              ...message,
              content: originalMessages + text,
              largeContextResponse,
              showHintForLargeContextResponse,
            };
          }
          return message;
        },
      );
      updatedConversation = {
        ...updatedConversation,
        messages: updatedMessages,
        lastUpdateAtUTC: dayjs().valueOf(),
      };
      homeDispatch({
        field: 'selectedConversation',
        value: updatedConversation,
      });
    }
    const updatedConversations: Conversation[] = conversations.map(
      (conversation) => {
        if (conversation.id === selectedConversation.id) {
          return updatedConversation;
        }
        return conversation;
      },
    );
    saveConversation(updatedConversation);

    homeDispatch({ field: 'conversations', value: updatedConversations });
    saveConversations(updatedConversations);

    homeDispatch({ field: 'messageIsStreaming', value: false });
    updateConversationLastUpdatedAtTimeStamp();
  };

  const availableCommands = useMemo(() => {
    let commands: string[] = [];
    // if buttons list has a element with text like "U{number}" then it is a upscale command
    // const upscaleCommand = buttons.find((button) => button.match(/^U\d+$/));
    // const zoomOutCommands = buttons.filter((button) =>
    //   button.match(/^🔍 Zoom Out/),
    // );
    // if (upscaleCommand) {
    //   commands.push('upscale');
    // }
    // if (zoomOutCommands.length > 0) {
    //   commands.push(...(zoomOutCommands as Command[]));
    // }
    // return commands;
    return buttons;
  }, [buttons]);

  const imageButtonOnClick = async (button: string) => {
    const updatedConversation = getUpdatedAssistantMjConversation(
      selectedConversation!,
      buttonMessageId,
    );
    if (!updatedConversation) return;
    handleUpdateConversation(updatedConversation);
    await runButtonCommand(button);
  };
  const handleUpdateConversation = useCallback(
    (updatedConversation: Conversation) => {
      const { single, all } = updateConversation(
        updatedConversation,
        conversations,
      );
      homeDispatch({ field: 'selectedConversation', value: single });
      homeDispatch({ field: 'conversations', value: all });
    },
    [conversations, homeDispatch],
  );

  return (
    <div className={`group/image relative hover:z-10`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={`${
          user ? `group-hover/image:scale-110` : ''
        } w-full m-0 transition-all duration-500 `}
      />

      <div
        className={`${
          user ? `group-hover/image:scale-110` : ''
        } group-hover/image:drop-shadow-2xl group-hover/image:bg-black/75 transition-all duration-500 absolute top-0 left-0 w-full h-full`}
      >
        {/*  Button selections  */}
        <div className="hidden group-hover/image:flex flex-col justify-center items-center h-full">
          {availableCommands.map((command, index) => {
            return (
              <button
                key={`${command}-${index}`}
                className="cursor-pointer select-none border border-white text-white font-bold py-2 px-4"
                onClick={() => imageButtonOnClick(command)}
              >
                {command}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
