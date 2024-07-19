import {
  IconDeviceSpeaker,
  IconLoader,
  IconPlayerStop,
} from '@tabler/icons-react';
import { useContext, useEffect, useMemo, useState } from 'react';

import { trackEvent } from '@/utils/app/eventTracking';

import { useLogger } from '@/components/Hooks/useLogger';
import HomeContext from '@/components/home/home.context';

import { useCognitiveService } from '../CognitiveService/CognitiveServiceProvider';

import { v4 } from 'uuid';

type Props = {
  inputText: string;
};

export const SpeechButton: React.FC<Props> = ({ inputText }) => {
  // This id is needed to track current playing speech across the entire app
  const [componentSpeechId, setComponentSpeechId] = useState('');

  const { logGeneralEvent } = useLogger();

  const {
    state: { messageIsStreaming, isPaidUser },
  } = useContext(HomeContext);

  const {
    closeSpeechSynthesizer,
    closePlayer,
    playMessage,
    playingSpeech,
    currentSpeechId,
    loadingTts,
  } = useCognitiveService();

  useEffect(() => {
    setComponentSpeechId(v4());
  }, []);

  const isComponentCurrentlyBeingPlayed = useMemo(() => {
    return currentSpeechId === componentSpeechId;
  }, [componentSpeechId, currentSpeechId]);

  const removeEmojis = (text: string): string => {
    return text.replace(
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g,
      '',
    );
  };

  const playStopOnClick = async () => {
    if (loadingTts) return;
    if (playingSpeech && isComponentCurrentlyBeingPlayed) {
      closePlayer();
      closeSpeechSynthesizer();
    } else {
      const sanitizedInputText = removeEmojis(inputText);
      await playMessage(sanitizedInputText, componentSpeechId);
      logGeneralEvent('speech');
      trackEvent('AI speech play button clicked');
    }
  };

  const getPlayerIcon = () => {
    if (isComponentCurrentlyBeingPlayed) {
      if (loadingTts) {
        return <IconLoader fill="none" size={18} className="animate-spin" />;
      } else if (playingSpeech) {
        return (
          <IconPlayerStop onClick={playStopOnClick} fill="none" size={18} />
        );
      }
    }

    return (
      <IconDeviceSpeaker onClick={playStopOnClick} fill="none" size={18} />
    );
  };

  // Only enable for paying users
  if (!isPaidUser || messageIsStreaming) return <></>;

  return (
    <div className={`cursor-pointer text-gray-500 hover:text-gray-300`}>
      {getPlayerIcon()}
    </div>
  );
};
