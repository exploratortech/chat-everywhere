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

import ChangeOutputLanguageButton from './ChangeOutputLanguageButton';
import ConversationModeToggle from './ConversationModeToggle';
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
      state: { messageIsStreaming, currentMessage, isPaidUser },
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
        data-cy="chat-enhanced-menu-container"
        className={`absolute left-0 z-10 h-fit w-full
          -translate-y-full overflow-hidden rounded-md border 
          bg-white text-black shadow-[0_0_10px_rgba(0,0,0,0.10)]
          transition-all ease-in-out dark:border-gray-900/50 dark:bg-[#343541]
          dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] ${
            showMenuAnimation ? '-top-2 opacity-90' : 'top-8 opacity-0'
          }`}
        style={{
          display: showMenuDisplay ? 'flex' : 'none',
        }}
      >
        <div
          className="relative flex w-full flex-col px-4 py-2"
          data-cy="chat-enhanced-menu"
        >
          <div className="mb-2 flex w-full flex-row items-center justify-between gap-4 border-b pb-2 dark:border-gray-900/50 mobile:!flex-col mobile:items-stretch">
            <SpeechRecognitionLanguageSelector />
            {/* Disable until MyMidjourneyAPI supports this */}
            {/* {currentMessage?.pluginId === PluginID.IMAGE_GEN && (
              <ImageToPromptUpload />
            )} */}
            {isPaidUser && <ConversationModeToggle />}
          </div>
          <div className="flex w-full flex-col justify-between md:flex-row">
            <ModeSelector />
            <ConversationStyleSelector />
            {currentMessage?.pluginId !== PluginID.IMAGE_GEN && (
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
