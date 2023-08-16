import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconCirclePlus } from '@tabler/icons-react';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getAvailableSpeechSourceLanguages } from '@/utils/app/i18n';
import { saveOutputLanguage } from '@/utils/app/outputLanguage';
import { saveSpeechRecognitionLanguage } from '@/utils/app/speechRecognitionLanguage.ts';

import HomeContext from '@/pages/api/home/home.context';

import ImagePreviewModel from './ImagePreviewModel';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { v4 } from 'uuid';

const ImageToTextUpload = () => {
  const { t } = useTranslation('model');

  const {
    state: { speechRecognitionLanguage },
    dispatch: homeDispatch,
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

  const confirmHandler = async () => {
    // upload image
    if (!imageFile || !preview) return;

    const filenameExtension = filename.split('.').pop();
    const newFilename = `${v4()}.${filenameExtension}`;
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

    // use the imageUrl to call api (image to text)
  };

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
