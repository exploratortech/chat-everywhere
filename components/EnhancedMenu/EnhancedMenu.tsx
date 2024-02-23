import React, {
  forwardRef,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { PluginID } from '@/types/plugin';

import HomeContext from '@/components/home/home.context';

import ImageToPromptUpload from '../ImageToPromptUpload/ImageUpload';
import ChangeOutputLanguageButton from './ChangeOutputLanguageButton';
import ConversationStyleSelector from './ConversationStyleSelector';
import ImageGenerationSelectors from './ImageGenerationSelectors';
import ModeSelector from './ModeSelector';
import SpeechRecognitionLanguageSelector from './SpeechRecognitionLanguageSelector';

import PropTypes from 'prop-types';

type EnhancedMenuProps = {
  isFocused: boolean;
};

const EnhancedMenu = forwardRef<HTMLDivElement, EnhancedMenuProps>(
  ({ isFocused }, ref) => {
    const {
      state: { messageIsStreaming, currentMessage, isSpeechRecognitionActive },
    } = useContext(HomeContext);

    const shouldShow = useMemo(() => {
      return isFocused && !messageIsStreaming;
    }, [isFocused, messageIsStreaming]);

    // THIS IS A DELAY FOR THE MENU ANIMATION
    const [showMenuDisplay, setShowMenuDisplay] = useState(false);
    const [showMenuAnimation, setShowMenuAnimation] = useState(false);

    useEffect(() => {
      if (shouldShow) {
        setShowMenuDisplay(true);
        setTimeout(() => {
          setShowMenuAnimation(true);
        }, 1);
      } else {
        setShowMenuAnimation(false);
        setTimeout(() => {
          setShowMenuDisplay(false);
        }, 1);
      }
    }, [shouldShow]);

    return (
      <div
        ref={ref}
        className={`absolute w-full h-fit left-0 overflow-hidden
          bg-white dark:bg-[#343541] text-black dark:text-white 
          z-10 rounded-md -translate-y-[100%]
          border dark:border-gray-900/50 shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]
          transition-all ease-in-out ${
            showMenuAnimation ? '-top-2 opacity-90' : 'top-8 opacity-0'
          }`}
        style={{
          display: showMenuDisplay ? 'flex' : 'none',
        }}
      >
        <div className="relative w-full px-4 py-2 flex flex-col">
          <div className="flex flex-row w-full justify-start items-center pb-2 mb-2 border-b gap-4 dark:border-gray-900/50 mobile:!flex-col">
            <SpeechRecognitionLanguageSelector />
            {/* Disable until MyMidjourneyAPI supports this */}
            {/* {currentMessage?.pluginId === PluginID.IMAGE_GEN && (
              <ImageToPromptUpload />
            )} */}
          </div>
          <div className="flex flex-col md:flex-row w-full justify-between">
            <ModeSelector />
            {currentMessage?.pluginId !== PluginID.DALLE_IMAGE_GEN && (
              <ConversationStyleSelector />
            )}
            {currentMessage?.pluginId !== PluginID.IMAGE_GEN &&
              currentMessage?.pluginId !== PluginID.DALLE_IMAGE_GEN && (
                <>
                  <ChangeOutputLanguageButton />
                </>
              )}
          </div>
          {currentMessage?.pluginId === PluginID.IMAGE_GEN && (
            <ImageGenerationSelectors />
          )}
        </div>
      </div>
    );
  },
);

EnhancedMenu.propTypes = {
  isFocused: PropTypes.bool.isRequired,
};

EnhancedMenu.displayName = 'EnhancedMenu';

export default memo(EnhancedMenu);
