import { useContext, useRef, useState } from 'react';
import {
  AudioConfig,
  SpeechConfig,
  SpeechRecognizer,
} from 'microsoft-cognitiveservices-speech-sdk';
import { toast } from 'react-hot-toast';
import HomeContext from '@/pages/api/home/home.context';

export const useAzureStt = () => {
  const { dispatch } = useContext(HomeContext);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMicrophoneDisabled, setIsMicrophoneDisabled] = useState<boolean>(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

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
    setIsLoading(true);
    dispatch({ field: 'isSpeechRecognitionActive', value: true });

    // Prompt for permission to use microphone
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      stream.getTracks().forEach((track, index) => {
        console.log(`Track ${track}:`, track);
      });
      setAudioStream(stream);
      setIsMicrophoneDisabled(false);
    } catch (error) {
      setIsMicrophoneDisabled(true);
      toast.error('Unable to access microphone.');
      return;
    }

    if (!stream) {
      toast.error('Unable to access microphone');
      return;
    }

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

    const audioConfig = AudioConfig.fromStreamInput(stream);

    // Perform speech recognition from the microphone
    speechRecognizer.current = new SpeechRecognizer(
      speechConfig,
      audioConfig,
    );

    speechRecognizer.current.sessionStarted = (sender, event) => {
      setIsLoading(false);
    };

    speechRecognizer.current.canceled = (sender, event) => {
      stopListening();
    };

    speechRecognizer.current.sessionStopped = (sender, event) => {
      dispatch({ field: 'isSpeechRecognitionActive', value: false });
      stream
        ?.getTracks()
        .forEach((mediaTrack) => mediaTrack.stop());
      setAudioStream(null);
      speechRecognizer.current?.close();
    }
    
    speechRecognizer.current.startContinuousRecognitionAsync(() => {
    }, (error) => {
      setIsMicrophoneDisabled(true);
      toast.error('Unable to begin speech recognition.');
      console.error(error);
    });
  };

  const stopListening = async (): Promise<void> => {
    if (!speechRecognizer.current) return;
    speechRecognizer.current.stopContinuousRecognitionAsync(() => {}, (error) => {
      toast.error('Unable to stop speech recognition.');
      console.error(error);
    });
  };

  return {
    audioStream,
    isLoading,
    isMicrophoneDisabled,
    startListening,
    stopListening,
  };
};
