import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_IMAGE_GENERATION_QUALITY,
  DEFAULT_IMAGE_GENERATION_STYLE,
} from '@/utils/app/const';
import { capitalizeFirstLetter } from '@/utils/app/ui';

import HomeContext from '@/components/home/home.context';

// Subject to changes in the future: style_preset at https://platform.stability.ai/rest-api#tag/v1generation/operation/textToImage
const AVAILABLE_STYLES = {
  default: 'Default',
  photorealism: 'Photorealism',
  portrait: 'Portrait photography',
  cinematic: 'Cinematic',
  anime: 'Anime',
  'analog-film': 'Analog Film',
  'comic-book': 'Comic Book',
  'digital-art': 'Digital Art',
  'low-poly': 'Low Poly',
  'pixel-art': 'Pixel Art',
};

const ImageGenerationSelectors = () => {
  const { t } = useTranslation('model');

  const {
    state: { selectedConversation },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const imageStyle = useMemo(
    () => selectedConversation?.imageStyle ?? DEFAULT_IMAGE_GENERATION_STYLE,
    [selectedConversation],
  );

  const imageQuality = useMemo(
    () =>
      selectedConversation?.imageQuality ?? DEFAULT_IMAGE_GENERATION_QUALITY,
    [selectedConversation],
  );

  const imageStyleOnChange = (newImageStyle: string) => {
    homeDispatch({
      field: 'selectedConversation',
      value: {
        ...selectedConversation,
        imageStyle: newImageStyle,
      },
    });
  };

  const imageQualityOnChange = (newImageQuality: string) => {
    homeDispatch({
      field: 'selectedConversation',
      value: {
        ...selectedConversation,
        imageQuality: newImageQuality,
      },
    });
  };

  const getOptionsForImageQuality = useMemo(() => {
    const options = ['High', 'Medium', 'Low'];

    return options.map((option) => (
      <option
        key={option}
        value={option}
        className="dark:bg-[#343541] dark:text-white"
      >
        {t(option)}
      </option>
    ));
  }, []);

  const getOptionsForImageStyles = useMemo(() => {
    const options = [];
    const stylesMapping = Object.entries(AVAILABLE_STYLES);
    for (let i = 0; i < stylesMapping.length; i++) {
      const [key, value] = stylesMapping[i];
      options.push(
        <option
          key={key}
          value={value}
          className="dark:bg-[#343541] dark:text-white"
        >
          {capitalizeFirstLetter(t(key))}
        </option>,
      );
    }
    return options;
  }, []);

  return (
    <div className="mt-2 flex flex-col justify-between text-left text-sm text-neutral-700 dark:text-neutral-400 md:flex-row">
      <div className="flex flex-row items-center justify-between md:justify-start">
        <label className="mr-2">{t('Quality')}</label>
        <div className="w-fit rounded-lg border border-neutral-200 bg-transparent pr-1 text-neutral-900 focus:outline-none dark:border-neutral-600 dark:text-white">
          <select
            className="bg-transparent p-2 focus:outline-none"
            value={imageQuality}
            onChange={(e) => {
              imageQualityOnChange(e.target.value);
            }}
          >
            {getOptionsForImageQuality}
          </select>
        </div>
      </div>
      <div className="mt-2 flex flex-row items-center justify-between md:mt-0 md:justify-start">
        <label className="mr-2">{t('Image Style')}</label>
        <div className="w-fit rounded-lg border border-neutral-200 bg-transparent pr-1 text-neutral-900 focus:outline-none dark:border-neutral-600 dark:text-white">
          <select
            className="bg-transparent p-2 focus:outline-none"
            value={imageStyle}
            onChange={(e) => {
              imageStyleOnChange(e.target.value);
            }}
          >
            {getOptionsForImageStyles}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationSelectors;
