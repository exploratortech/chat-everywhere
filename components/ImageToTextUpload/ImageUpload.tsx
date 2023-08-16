import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconCirclePlus } from '@tabler/icons-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  saveConversation,
  saveConversations,
  updateConversationLastUpdatedAtTimeStamp,
} from '@/utils/app/conversation';
import {
  removeRedundantTempHtmlString,
  removeTempHtmlString,
} from '@/utils/app/htmlStringHandler';
import { getAvailableSpeechSourceLanguages } from '@/utils/app/i18n';
import { saveOutputLanguage } from '@/utils/app/outputLanguage';
import { saveSpeechRecognitionLanguage } from '@/utils/app/speechRecognitionLanguage.ts';
import { removeSecondLastLine } from '@/utils/app/ui';

import { Conversation, Message } from '@/types/chat';
import { PluginID } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import ImagePreviewModel from './ImagePreviewModel';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import dayjs from 'dayjs';
import { v4 } from 'uuid';

const ImageToTextUpload = () => {
  const { t } = useTranslation('model');

  const {
    state: { user, selectedConversation, conversations, messageIsStreaming },
    dispatch: homeDispatch,
    stopConversationRef,
  } = useContext(HomeContext);

  const [preview, setPreview] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const supabaseClient = useMemo(() => createBrowserSupabaseClient(), []);

  const fileInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onloadend = () => {
      setPreview(reader.result as string);
      setFilename(file.name);
      setImageFile(file);
      setShowImagePreview(true);
    };
  };
  const clearFile = () => {
    setPreview(undefined);
    setFilename('');
    setImageFile(null);
  };

  const confirmHandler = useCallback(async () => {
    if (!imageFile) return;
    const file = imageFile;
    clearFile();
    const uploadImage = async (imageFile: File) => {
      // upload image
      const filenameExtension = filename.split('.').pop();

      // each user has a folder to store their images
      const newFilename = `${user?.id}` + '/' + `${v4()}.${filenameExtension}`;
      const { data, error } = await supabaseClient.storage
        .from('image-to-text')
        .upload(newFilename, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png',
        });
      console.log({
        data,
        error,
      });
      if (error) {
        throw error;
      }
      const imageUrl = await supabaseClient.storage
        .from('image-to-text')
        .getPublicUrl(newFilename).data.publicUrl;
      return imageUrl;
    };

    setShowImagePreview(false);

    let updatedConversation: Conversation;
    if (!selectedConversation) return;
    // upload image and get imageUrl
    const imageUrl = await uploadImage(file);
    if (!imageUrl) return;

    const newMessage: Message = {
      content: `<img id="${PluginID.IMAGE_TO_TEXT}" src="${imageUrl}" />`,
      role: 'assistant',
      pluginId: PluginID.IMAGE_TO_TEXT,
    };
    updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
    };

    homeDispatch({ field: 'loading', value: true });
    homeDispatch({ field: 'messageIsStreaming', value: true });

    const controller = new AbortController();

    // use the imageUrl to call api (image to text)
    const response = await fetch('/api/image-to-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-token': user?.token || '',
      },
      signal: controller.signal,
      body: JSON.stringify({
        url: imageUrl,
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
      updatedConversation.messages.length > 0
        ? updatedConversation.messages[updatedConversation.messages.length - 1]
            .content
        : '';
    while (!done) {
      if (stopConversationRef.current === true) {
        controller.abort();
        done = true;
        break;
      }
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      text += chunkValue;

      if (text.includes('[DONE]')) {
        text = text.replace('[DONE]', '');
        done = true;
      }
      if (text.includes('[REMOVE_TEMP_HTML]')) {
        text = removeTempHtmlString(text);
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
              content:
                removeTempHtmlString(originalMessages) +
                removeRedundantTempHtmlString(text),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filename,
    homeDispatch,
    imageFile,
    preview,
    selectedConversation,
    stopConversationRef,
  ]);

  return (
    <div className="flex flex-row items-center justify-between w-full md:justify-start">
      <label className="text-left text-sm text-neutral-700 dark:text-neutral-400 mr-2">
        {t('Image to Text Upload')}
      </label>
      <div
        className="flex justify-between items-center p-[.4rem]  cursor-pointer w-[50%] rounded-lg border border-neutral-200 bg-transparent text-neutral-900 dark:border-neutral-600 dark:text-white  pr-1 focus:outline-none"
        onClick={() => {
          document.getElementById('upload-images-to-text')?.click();
        }}
      >
        <div className="text-gray-400">{'Click to Upload'}</div>
        <IconCirclePlus />
      </div>
      <input
        id="upload-images-to-text"
        className="sr-only hidden"
        type="file"
        accept=".jpg,.jpeg,.png,.gif"
        onChange={fileInputOnChange}
      />
      {showImagePreview && (
        <ImagePreviewModel
          onClose={() => {
            setShowImagePreview(false);
            clearFile();
          }}
          preview={preview}
          filename={filename}
          onConfirm={confirmHandler}
        />
      )}
    </div>
  );
};

export default ImageToTextUpload;
