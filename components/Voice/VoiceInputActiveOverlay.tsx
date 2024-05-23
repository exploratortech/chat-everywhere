import { useCognitiveService } from '../CognitiveService/CognitiveServiceProvider';

import { cn } from '@/lib/utils';

type VoiceInputActiveOverlayProps = {
  interactable?: boolean;
};

const VoiceInputActiveOverlay = ({
  interactable = false,
}: VoiceInputActiveOverlayProps) => {
  const { isConversing, isSpeechRecognitionActive } = useCognitiveService();

  if (!isConversing && !isSpeechRecognitionActive) return null;

  return (
    <div
      className={cn(
        'absolute top-0 left-0 w-full h-full bg-black opacity-40 z-[1000]',
        interactable && 'pointer-events-none',
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

export default VoiceInputActiveOverlay;
