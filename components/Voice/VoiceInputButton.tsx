import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerStop,
} from '@tabler/icons-react';
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { trackEvent } from '@/utils/app/eventTracking';

import HomeContext from '@/components/home/home.context';

import { useCognitiveService } from '../CognitiveService/CognitiveServiceProvider';

const getLargestValue = (bytes: Uint8Array): number => {
  let largest = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] > largest) {
      largest = bytes[i];
    }
  }
  return largest;
};

type VoiceInputButtonProps = {
  onClick?: () => void;
};

const VoiceInputButton = ({ onClick }: VoiceInputButtonProps) => {
  const { t } = useTranslation('common');

  const {
    state: { user, lightMode },
  } = useContext(HomeContext);

  const {
    isConversationModeActive,
    isConversing,
    toggleConversation,
    startSpeechRecognition,
    stopSpeechRecognition,
    audioStream,
    isSpeechRecognitionActive,
    loadingStt,
    isMicrophoneDisabled,
  } = useCognitiveService();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number>();
  const byteArray = useRef<Uint8Array>(new Uint8Array());

  const draw = useCallback(
    (node: AnalyserNode): void => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        const largestValue = getLargestValue(byteArray.current);

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.strokeStyle = lightMode === 'dark' ? '#ffffff' : '#71717a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          ctx.canvas.width / 2,
          ctx.canvas.height / 2,
          ((ctx.canvas.width - 2) / 2) * (largestValue / 255),
          0,
          2 * Math.PI,
        );
        ctx.stroke();

        node.getByteFrequencyData(byteArray.current);
      }
      animationFrameId.current = requestAnimationFrame(() => draw(node));
    },
    [lightMode],
  );

  useEffect(() => {
    if (audioStream && !loadingStt) {
      const audioContext = new window.AudioContext();
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 32;
      const audioSource = audioContext.createMediaStreamSource(audioStream);
      audioSource.connect(analyserNode);
      byteArray.current = new Uint8Array(analyserNode.frequencyBinCount);

      animationFrameId.current = requestAnimationFrame(() =>
        draw(analyserNode),
      );
    }

    const ctx = canvasRef.current?.getContext('2d');

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    };
  }, [audioStream, draw, loadingStt]);

  const statusIndicator = useMemo(() => {
    if ((!loadingStt && !isSpeechRecognitionActive) || isMicrophoneDisabled) {
      return null;
    }

    return (
      <div
        className={`absolute right-0 top-0 m-1.5 size-1.5 rounded-full bg-green-500`}
      />
    );
  }, [loadingStt, isSpeechRecognitionActive, isMicrophoneDisabled]);

  const icon = useMemo(() => {
    if (isMicrophoneDisabled) {
      return (
        <IconMicrophoneOff
          className="rounded-full bg-white text-zinc-500 opacity-50 dark:bg-[#40414F] dark:text-zinc-400"
          size={18}
        />
      );
    }
    if (isConversing) {
      return (
        <IconPlayerStop
          className="rounded-full bg-white text-zinc-500 dark:bg-[#40414F] dark:text-zinc-400"
          size={18}
        />
      );
    }
    return (
      <IconMicrophone
        className="rounded-full bg-white text-zinc-500 dark:bg-[#40414F] dark:text-zinc-400"
        size={18}
      />
    );
  }, [isMicrophoneDisabled, isConversing]);

  const handleClick = async (e: any): Promise<void> => {
    if (onClick) onClick();
    if (loadingStt) return;

    if (isConversationModeActive) {
      toggleConversation();
      return;
    }

    if (isSpeechRecognitionActive) {
      stopSpeechRecognition();

      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);

      // Clear the canvas
      if (canvasRef.current && canvasRef.current.getContext('2d')) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    } else {
      if (user) {
        await startSpeechRecognition();
      } else {
        toast.error(t('Please register and sign in to enable voice input'));
      }
    }

    e.stopPropagation();
    trackEvent('Voice input button clicked');
  };

  return (
    <div
      className={`
        size-9 rounded-full bg-white dark:bg-[#40414F]
        ${
          loadingStt || isConversing || isSpeechRecognitionActive
            ? 'z-[1100]'
            : ''
        }
      `}
    >
      <div className="relative">
        <canvas className="size-full" width="36" height="36" ref={canvasRef} />
        {loadingStt ? (
          <div className="absolute left-3 top-[0.7rem] size-4 animate-spin rounded-full border-t-2 text-zinc-500 dark:text-zinc-400"></div>
        ) : (
          <>
            <button
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent p-2"
              onClick={handleClick}
              onMouseDown={(e) => {
                // Prevents closing enhanced menu if its opened
                e.stopPropagation();
              }}
            >
              {icon}
            </button>
            {statusIndicator}
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceInputButton;
