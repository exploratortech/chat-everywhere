import { useCognitiveService } from '../CognitiveService/CognitiveServiceProvider';

const VoiceInputActiveOverlay = () => {
  const { isSpeechRecognitionActive } = useCognitiveService();

  if (!isSpeechRecognitionActive) return null;

  return (
    <div
      className="absolute top-0 left-0 w-full h-full bg-black opacity-60 z-[1000]"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

export default VoiceInputActiveOverlay;
