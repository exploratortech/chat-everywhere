import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconCirclePlus } from '@tabler/icons-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
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
import { handleImageToPromptSend } from '@/utils/app/image-to-prompt';
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

const ImageToPromptUpload = () => {
  const { t } = useTranslation('model');
  const { t: commonT } = useTranslation('common');
  const { t: imageToPromptT } = useTranslation('imageToPrompt');

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
    try {
      if (!user) {
        toast.error('User not found');
      }
      if (!imageFile) return;
      const file = imageFile;
      clearFile();
      const uploadImage = async (imageFile: File) => {
        // upload image
        const filenameExtension = filename.split('.').pop();

        // each user has a folder to store their images
        const newFilename =
          `${user?.id}` + '/' + `${v4()}.${filenameExtension}`;
        const { data, error } = await supabaseClient.storage
          .from('image-to-prompt')
          .upload(newFilename, imageFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/png',
          });
        if (error) {
          clearFile();
          throw error;
        }
        const imageUrl = await supabaseClient.storage
          .from('image-to-prompt')
          .getPublicUrl(newFilename).data.publicUrl;
        return imageUrl;
      };

      setShowImagePreview(false);

      if (!selectedConversation) return;
      // upload image and get imageUrl
      const imageUrl = await uploadImage(file);
      if (!imageUrl) return;

      await handleImageToPromptSend({
        imageUrl,
        conversations,
        homeDispatch,
        selectedConversation,
        stopConversationRef,
        user,
      });
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message);
      }
      console.log(e);
    }

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
    <div className="flex flex-row items-center justify-end w-full">
      <label className="text-left text-sm text-neutral-700 dark:text-neutral-400 mr-2">
        {imageToPromptT('Image to Prompt')}
      </label>
      <div
        className="flex justify-between items-center p-[.4rem]  cursor-pointer w-[50%] rounded-lg border border-neutral-200 bg-transparent text-neutral-900 dark:border-neutral-600 dark:text-white  pr-1 focus:outline-none"
        onClick={() => {
          if (!user) {
            toast.error(
              commonT('Please sign in to use image to prompt feature'),
            );
            return;
          }
          document.getElementById('upload-images-to-text')?.click();
        }}
      >
        <div className="text-gray-400">{commonT('Upload')}</div>
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

export default ImageToPromptUpload;
