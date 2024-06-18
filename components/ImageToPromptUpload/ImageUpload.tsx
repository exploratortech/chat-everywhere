import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { handleImageToPromptSend } from '@/utils/app/image-to-prompt';

import HomeContext from '@/components/home/home.context';

import DropZone from './Dropzone';
import ImagePreviewModel from './ImagePreviewModel';

import { v4 } from 'uuid';

const ImageToPromptUpload = () => {
  const { t: imageToPromptT } = useTranslation('imageToPrompt');
  const { t: commonT } = useTranslation('common');

  const {
    state: { user, selectedConversation, conversations, messageIsStreaming },
    dispatch: homeDispatch,
    stopConversationRef,
  } = useContext(HomeContext);

  const [preview, setPreview] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const supabaseClient = useSupabaseClient();

  const fileInputOnChange = (file: File) => {
    if (!user) {
      toast.error(commonT('Please sign in to use image to prompt feature'));
      return;
    }
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

  const supabase = useSupabaseClient();
  const confirmHandler = useCallback(async () => {
    try {
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

      const accessToken = (await supabase.auth.getSession())?.data.session
        ?.access_token;
      if (!accessToken) {
        alert('Please sign in to continue');
        return;
      }

      await handleImageToPromptSend({
        imageUrl,
        conversations,
        homeDispatch,
        selectedConversation,
        stopConversationRef,
        accessToken,
      });
    } catch (e) {
      const isErrorMessage =
        e &&
        typeof e === 'object' &&
        'message' in e &&
        typeof e.message === 'string';
      const isMaxSizeError =
        isErrorMessage &&
        (e.message as string).includes('maximum allowed size');
      if (isMaxSizeError) {
        toast.error(imageToPromptT('The Max Image Size is 20MB'));
      } else if (isErrorMessage) {
        toast.error(e.message as string);
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
    <div className="flex flex-row items-center justify-end w-full mobile:justify-between">
      <label className="text-left text-sm text-neutral-700 dark:text-neutral-400 mr-2">
        {imageToPromptT('Image to Prompt')}
      </label>
      <DropZone onDropCallback={fileInputOnChange} />

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
