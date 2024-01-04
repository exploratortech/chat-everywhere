import {
  IconDeviceSpeaker,
  IconLoader,
  IconPlayerStop,
} from '@tabler/icons-react';
import { useContext, useEffect, useMemo, useState } from 'react';

import { trackEvent } from '@/utils/app/eventTracking';

import HomeContext from '@/pages/api/home/home.context';

import { useLogger } from '@/components/Hooks/useLogger';

import { v4 } from 'uuid';

type Props = {
  inputText: string;
};

export const SpeechButton: React.FC<Props> = ({ inputText }) => {
  // This id is needed to track current playing speech across the entire app
  const [componentSpeechId, setComponentSpeechId] = useState('');

  const { logGeneralEvent } = useLogger();

  const {
    state: { currentSpeechId, isLoading, isPlaying, user, messageIsStreaming, isPaidUser },
    playMessage,
    stopPlaying,
  } = useContext(HomeContext);

  useEffect(() => {
    setComponentSpeechId(v4());
  }, []);

  const isComponentCurrentlyBeingPlayed = useMemo(() => {
    return currentSpeechId === componentSpeechId;
  }, [componentSpeechId, currentSpeechId]);

  const playStopOnClick = async () => {
    if (isPlaying && isComponentCurrentlyBeingPlayed) {
      stopPlaying();
    } else {
      await playMessage(inputText, componentSpeechId);
      logGeneralEvent('speech');
      trackEvent('AI speech play button clicked');
    }
  };

  const getPlayerIcon = () => {
    if (isComponentCurrentlyBeingPlayed) {
      if (isLoading) {
        return <IconLoader fill="none" size={18} />;
      } else if (isPlaying) {
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
