import { useContext } from 'react';

import HomeContext from '@/pages/api/home/home.context';

const VoiceInputActiveOverlay = () => {
  const {
    state: {
      isSpeechRecognitionActive,
    },
  } = useContext(HomeContext);

  if (!isSpeechRecognitionActive)
    return null;

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black opacity-60 z-[1000]"/>
  );
};

export default VoiceInputActiveOverlay;
