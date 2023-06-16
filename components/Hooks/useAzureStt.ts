import { useRef, useState } from 'react';
import {
  AudioConfig,
  SpeechConfig,
  SpeechRecognizer,
} from 'microsoft-cognitiveservices-speech-sdk';
import { toast } from 'react-hot-toast';

export const useAzureStt = () => {
  const [isListening, setIsListening] = useState(false);

  const audioStream = useRef<MediaStream>();

  const token = useRef<string>('');
  const region = useRef<string>('');
  const speechRecognizer = useRef<SpeechRecognizer>();

  const fetchTokenAndRegion = async (userToken: string): Promise<any> => {
    const response = await fetch('/api/getSpeechToken', {
      headers: { 'user-token': userToken },
    });
    return await response.json();
  };

  const startListening = async (userToken: string): Promise<void> => {
    // Prompt for permission to use microphone
    audioStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    try {
      if (!token.current || !region.current) {
        const data = await fetchTokenAndRegion(userToken);
        token.current = data.token;
        region.current = data.region;
      }
    } catch (error) {
      toast.error('Unable to fetch token.');
      console.error(error);
    }

    const speechConfig = SpeechConfig.fromAuthorizationToken(
      token.current,
      region.current,
    );

    const audioConfig = AudioConfig.fromStreamInput(
      audioStream.current
    );

    // Perform speech recognition from the microphone
    speechRecognizer.current = new SpeechRecognizer(
      speechConfig,
      audioConfig,
    );

    speechRecognizer.current.startContinuousRecognitionAsync(() => {
      setIsListening(true);
    }, (error) => {
      toast.error('Unable to begin speech recognition.');
      console.error(error);
    });
  };

  const stopListening = async (): Promise<void> => {
    if (!speechRecognizer.current) return;
    speechRecognizer.current.stopContinuousRecognitionAsync(() => {
      setIsListening(false);
      audioStream.current
        ?.getTracks()
        .forEach((mediaTrack) => mediaTrack.stop());
    }, (error) => {
      toast.error('Unable to stop speech recognition.');
      console.error(error);
    });
  };

  return {
    audioStream: audioStream.current,
    isListening,
    startListening,
    stopListening,
  };
};
