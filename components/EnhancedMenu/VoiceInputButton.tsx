import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';

import { useAzureStt } from '../Hooks/useAzureStt';
import HomeContext from '@/pages/api/home/home.context';
import { toast } from 'react-hot-toast';

const getLargestValue = (bytes: Uint8Array): number => {
  let largest = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] > largest) {
      largest = bytes[i];
    }
  }
  return largest;
};

const VoiceInputButton = () => {
  const {
    state: {
      user,
      isSpeechRecognitionActive,
    },
  } = useContext(HomeContext);

  const {
    audioStream,
    isMicrophoneDisabled,
    startListening,
    stopListening,
  } = useAzureStt();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const byteArray = useRef<Uint8Array>(new Uint8Array());

  const draw = useCallback((node: AnalyserNode): void => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d') as CanvasRenderingContext2D;
    const largestValue = getLargestValue(byteArray.current);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      ctx.canvas.width / 2,
      ctx.canvas.height / 2,
      ((ctx.canvas.width - 2) / 2) * (largestValue / 255),
      0,
      2 * Math.PI
    );
    ctx.stroke();

    node.getByteFrequencyData(byteArray.current);
    requestAnimationFrame(() => draw(node));
  }, []);

  useEffect(() => {
    if (audioStream) {
      const audioContext = new window.AudioContext();
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 32;
      const audioSource = audioContext.createMediaStreamSource(audioStream);
      audioSource.connect(analyserNode);
      byteArray.current = new Uint8Array(analyserNode.frequencyBinCount);

      animationFrameId.current = requestAnimationFrame(() => draw(analyserNode));
    }

    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [audioStream, draw]);

  const handleClick = async (): Promise<void> => {
    if (isSpeechRecognitionActive) {
      stopListening();
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    } else {
      if (user && user.token) {
        await startListening(user.token);
      } else {
        toast.error('You must be signed in to use this feature.');
      }
    }
  };

  return (
    <>
      <div
        className="relative w-9 h-9 z-[1100] dark:bg-[#343541] rounded-full"
      >
        <div className="relative">
          <canvas
            className="w-full h-full"
            width="36"
            height="36"
            ref={canvasRef}
          />
          <button
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-transparent"
            onClick={handleClick}
          >
            {isMicrophoneDisabled ? (
              <IconMicrophoneOff
                className="dark:bg-[#343541] rounded-full opacity-50"
                size={18}
              />
            ) : (
              <IconMicrophone
                className="dark:bg-[#343541] rounded-full"
                size={18}
              />
            )}
          </button>
          {isSpeechRecognitionActive && (
            <div className="absolute w-1.5 h-1.5 m-1.5 top-0 right-0 bg-green-500 rounded-full" />
          )}
        </div>
      </div>
    </>
  );
};


export default VoiceInputButton;
