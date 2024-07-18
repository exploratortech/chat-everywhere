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

  const removeEmojisOnly = (text: string): string => {
    // Remove emojis and other unicode symbols, but keep basic punctuation
    return text.replace(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g, '');
  };

  const normalizePunctuations = (text: string): string => {
    return text.replace(/\p{P}/gu, (match) => {
      // Full stop (period) equivalents
      if (/[\u3002\uFF0E\uFF61]/u.test(match)) {
        return '. ';
      }
      // Comma equivalents
      if (/[\u060C\u3001\uFF0C\u2E41\u2E34\u2E32]/u.test(match)) {
        return ', ';
      }
      // Question mark equivalents
      if (/[\uFF1F\u037E\u061F]/u.test(match)) {
        return '? ';
      }
      // Exclamation mark equivalents
      if (/[\uFF01\u01C3\u2D51\u05C6\u061B]/u.test(match)) {
        return '! ';
      }
      // For other punctuation, replace with a space
      return ' ';
    });
  };

  const playStopOnClick = async () => {
    if (loadingTts) return;
    if (playingSpeech && isComponentCurrentlyBeingPlayed) {
      closePlayer();
      closeSpeechSynthesizer();x
    } else {

      const sanitizedInputText = normalizePunctuations(removeEmojisOnly(inputText)).trim();

      console.log("sanitizedInputText: ", sanitizedInputText);

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