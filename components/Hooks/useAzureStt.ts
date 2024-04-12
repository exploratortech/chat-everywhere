import { useContext, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/components/home/home.context';

import {
  AudioConfig,
  CancellationReason,
  PropertyId,
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
  const speechRecognizingTimeout = useRef<NodeJS.Timeout>();

  const fetchTokenAndRegion = async (userToken: string): Promise<any> => {
    const response = await fetch('/api/getSpeechToken', {
      headers: { 'user-token': userToken },
    });
    return await response.json();
  };

  const startSpeechRecognition = async (
    userToken: string,
    options: { isConversationModeActive: boolean } = {
      isConversationModeActive: false,
    },
  ): Promise<void> => {
    setIsLoading(true);

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

    // A duration (ms) of detected silence in speech, after which a final recognized result will be
    // generated. The result can be accessed in the "recognized" event of the Recognizer.
    speechConfig.setProperty(
      PropertyId.Speech_SegmentationSilenceTimeoutMs,
      '2000',
    );

    const audioConfig = AudioConfig.fromStreamInput(stream);

    // Perform speech recognition from the microphone
    speechRecognizer.current = new SpeechRecognizer(speechConfig, audioConfig);

    let speechContent = '';
    let speechBuffer = '';

    speechRecognizer.current.sessionStarted = (sender, event) => {
      setIsLoading(false);
      dispatch({ field: 'isSpeechRecognitionActive', value: true });
      dispatch({ field: 'speechContent', value: '' });
      dispatch({ field: 'isSpeechRecognizing', value: true });
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
        dispatch({ field: 'isSpeechRecognizing', value: true });
        clearTimeout(speechRecognizingTimeout.current);
      }
    };

    speechRecognizer.current.recognized = (sender, event) => {
      if (event.result.reason === ResultReason.RecognizedSpeech) {
        speechBuffer = event.result.text;
        speechContent = `${speechContent} ${speechBuffer}`;
      }
      dispatch({ field: 'speechContent', value: speechContent.trim() });

      // Clear speech content, otherwise, it'll show up in subsequent dialogue
      // during conversation mode.
      speechContent = '';

      // This ensures that the ChatInput's content get's updated before the message
      // is sent to the model during conversation mode. Without it, the content will contain
      // the 'speechBuffer' (the unprocessed speech). There's likely a better way of doing this.
      speechRecognizingTimeout.current = setTimeout(() => {
        dispatch({ field: 'isSpeechRecognizing', value: false });
      }, 500);
    };

    speechRecognizer.current.canceled = (sender, event) => {
      stopSpeechRecognition();
      setIsLoading(false);
      dispatch({ field: 'isSpeechRecognitionActive', value: false });
      stream?.getTracks().forEach((mediaTrack) => mediaTrack.stop());
      setAudioStream(null);
      speechRecognizer.current?.close();

      if (event.reason == CancellationReason.Error) {
        toast.error(
          t(
            'The speech service is unavailable at the moment, please try again later',
          ),
        );
        console.log(event.errorDetails);
      }
    };

    speechRecognizer.current.sessionStopped = (sender, event) => {
      clearTimeout(speechRecognizingTimeout.current);
      dispatch({ field: 'isSpeechRecognizing', value: false });
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
