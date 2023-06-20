import { useContext, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import {
  AudioConfig,
  ResultReason,
  SpeechConfig,
  SpeechRecognizer,
} from 'microsoft-cognitiveservices-speech-sdk';

export const useAzureStt = () => {
  const { t } = useTranslation('common');

  const {
    state: { speechRecognitionLanguage },
    dispatch,
  } = useContext(HomeContext);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMicrophoneDisabled, setIsMicrophoneDisabled] =
    useState<boolean>(false);
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

  const startSpeechRecognition = async (userToken: string): Promise<void> => {
    setIsLoading(true);
    dispatch({ field: 'isSpeechRecognitionActive', value: true });

    // Prompt for permission to use microphone
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      setAudioStream(stream);
      setIsMicrophoneDisabled(false);
    } catch (error) {
      setIsLoading(false);
      setIsMicrophoneDisabled(true);
      dispatch({ field: 'isSpeechRecognitionActive', value: false });
      toast.error(t('Unable to access microphone'));
      return;
    }

    try {
      if (!token.current || !region.current) {
        const data = await fetchTokenAndRegion(userToken);
        token.current = data.token;
        region.current = data.region;
      }
    } catch (error) {
      setIsLoading(false);
      dispatch({ field: 'isSpeechRecognitionActive', value: false });
      toast.error(
        t(
          'The speech service is unavailable at the moment, please try again later',
        ),
      );
      console.error(error);
    }

    const speechConfig = SpeechConfig.fromAuthorizationToken(
      token.current,
      region.current,
    );
    speechConfig.speechRecognitionLanguage =
      speechRecognitionLanguage || 'en-US';

    const audioConfig = AudioConfig.fromStreamInput(stream);

    // Perform speech recognition from the microphone
    speechRecognizer.current = new SpeechRecognizer(speechConfig, audioConfig);

    let speechContent = '';
    let speechBuffer = '';

    speechRecognizer.current.sessionStarted = (sender, event) => {
      setIsLoading(false);
      dispatch({ field: 'speechContent', value: '' });
    };

    speechRecognizer.current.recognizing = (sender, event) => {
      const reasons = [
        ResultReason.RecognizedSpeech,
        ResultReason.RecognizingSpeech,
      ];
      if (reasons.includes(event.result.reason)) {
        speechBuffer = event.result.text;
        dispatch({
          field: 'speechContent',
          value: `${speechContent} ${speechBuffer} ...`.trim(),
        });
      }
    };

    speechRecognizer.current.recognized = (sender, event) => {
      if (event.result.reason === ResultReason.RecognizedSpeech) {
        speechBuffer = event.result.text;
        speechContent = `${speechContent} ${speechBuffer}`;
      }
      dispatch({ field: 'speechContent', value: speechContent.trim() });
    };

    speechRecognizer.current.canceled = (sender, event) => {
      stopSpeechRecognition();
      setIsLoading(false);
      dispatch({ field: 'isSpeechRecognitionActive', value: false });
    };

    speechRecognizer.current.sessionStopped = (sender, event) => {
      dispatch({ field: 'isSpeechRecognitionActive', value: false });
      stream?.getTracks().forEach((mediaTrack) => mediaTrack.stop());
      setAudioStream(null);
      speechRecognizer.current?.close();
    };

    speechRecognizer.current.startContinuousRecognitionAsync(
      () => {},
      (error) => {
        setIsLoading(false);
        setIsMicrophoneDisabled(true);
        dispatch({ field: 'isSpeechRecognitionActive', value: false });
        toast.error(
          t(
            'The speech service is unavailable at the moment, please try again later',
          ),
        );
        console.error(error);
      },
    );
  };

  const stopSpeechRecognition = async (): Promise<void> => {
    if (!speechRecognizer.current) return;
    speechRecognizer.current.stopContinuousRecognitionAsync(
      () => {},
      (error) => {
        toast.error(
          t(
            'The speech service is unavailable at the moment, please try again later',
          ),
        );
        console.error(error);
      },
    );
  };

  return {
    audioStream,
    isLoading,
    isMicrophoneDisabled,
    startSpeechRecognition,
    stopSpeechRecognition,
  };
};
