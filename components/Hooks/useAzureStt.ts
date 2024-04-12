import { useContext, useEffect, useRef, useState } from 'react';
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
    state: {
      speechRecognitionLanguage,
      isConversationModeActive,
      isMicrophoneMuted,
    },
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

  // Mute/unmute microphone in conversation mode.
  useEffect(() => {
    if (!isConversationModeActive) return;
    console.log('MIC MUTED?', isMicrophoneMuted);
    audioStream
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !isMicrophoneMuted));
  }, [isConversationModeActive, isMicrophoneMuted, audioStream]);

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
      '750',
    );

    // A duration (ms) of detected silence in speech, after which the "speechEndDetected" event will
    // be signaled. Should be larger than the duration for "Speech_SegmentationSilenceTimeoutMs".
    speechConfig.setProperty(
      PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
      '1750',
    );

    const audioConfig = AudioConfig.fromStreamInput(stream);

    // Perform speech recognition from the microphone
    speechRecognizer.current = new SpeechRecognizer(speechConfig, audioConfig);

    let speechBuffer = '';

    speechRecognizer.current.sessionStarted = (sender, event) => {
      setIsLoading(false);
      dispatch({ field: 'isSpeechRecognitionActive', value: true });
      dispatch({ field: 'speechContent', value: '' });
      dispatch({ field: 'isSpeechRecognizing', value: true });
      dispatch({ field: 'isMicrophoneMuted', value: false });
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
          value: `${speechBuffer} ...`.trim(),
        });
        dispatch({ field: 'isSpeechRecognizing', value: true });
        clearTimeout(speechRecognizingTimeout.current);
      }
    };

    speechRecognizer.current.recognized = (sender, event) => {
      if (event.result.reason === ResultReason.RecognizedSpeech) {
        speechBuffer = event.result.text;
        dispatch({ field: 'speechContent', value: speechBuffer.trim() });
      }
    };

    speechRecognizer.current.speechEndDetected = (sender, event) => {
      if (options.isConversationModeActive) return;
      dispatch({ field: 'isSpeechRecognizing', value: false });
      dispatch({ field: 'isMicrophoneMuted', value: true });
    };

    speechRecognizer.current.canceled = (sender, event) => {
      stopSpeechRecognition();
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
      stopSpeechRecognition();
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
      () => {
        audioStream?.getTracks().forEach((mediaTrack) => mediaTrack.stop());
        setAudioStream(null);
        setIsLoading(false);
        clearTimeout(speechRecognizingTimeout.current);
        dispatch({ field: 'isSpeechRecognitionActive', value: false });
        dispatch({ field: 'isSpeechRecognizing', value: false });
      },
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
