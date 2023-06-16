import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { IconMicrophone } from '@tabler/icons-react';
import HomeContext from '@/pages/api/home/home.context';
import { useAzureStt } from '../Hooks/useAzureStt';

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
    },
  } = useContext(HomeContext);

  const {
    audioStream,
    isListening,
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

  useEffect((): void => {
    if (audioStream) {
      const audioContext = new window.AudioContext();
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 32;
      const audioSource = audioContext.createMediaStreamSource(audioStream);
      audioSource.connect(analyserNode);
      byteArray.current = new Uint8Array(analyserNode.frequencyBinCount);

      animationFrameId.current = requestAnimationFrame(() => draw(analyserNode));
    }
  }, [audioStream, draw]);

  const handleClick = async (): Promise<void> => {
    if (isListening) {
      stopListening();
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    } else {
      if (user && user.token) {
        await startListening(user.token);
      }
    }
  };

  return (
    <div
      className="relative w-9 h-9"
    >
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
        <IconMicrophone
          className="dark:bg-[#343541] rounded-full"
          size={18}
        />
      </button>
      {isListening && (
        <div className="absolute w-1.5 h-1.5 m-1.5 top-0 right-0 bg-green-500 rounded-full" />
      )}
    </div>
  );
};


export default VoiceInputButton;
