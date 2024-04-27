import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { voiceMap } from '@/utils/app/i18n';

import HomeContext from '../home/home.context';

import dayjs, { Dayjs } from 'dayjs';
import {
  AudioConfig,
  CancellationReason,
  PropertyId,
  ResultReason,
  SpeakerAudioDestination,
  SpeechConfig,
  SpeechRecognizer,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk';

type CognitiveServiceContextType = {
  // Tts
  playMessage: (message: string, speechId: string) => Promise<void>;
  queueMessage: () => Promise<void>;
  initSpeechSynthesizer: () => Promise<void>;
  closeSpeechSynthesizer: () => void;
  closePlayer: () => void;
  playingSpeech: boolean;
  currentSpeechId?: string;
  loadingTts: boolean;

  // Stt
  startSpeechRecognition: () => Promise<void>;
  stopSpeechRecognition: () => Promise<void>;
  speechContent: string;
  audioStream?: MediaStream;
  isSpeechRecognitionActive: boolean;
  isMicrophoneDisabled: boolean;
  loadingStt: boolean;
};

export type SpeechSpeedType = 'slow' | 'normal' | 'fast';

type SpeechConfigType = {
  speechSpeed: SpeechSpeedType;
};

const CognitiveServiceContext =
  createContext<CognitiveServiceContextType | null>(null);

const useCognitiveService = () => useContext(CognitiveServiceContext)!;

const CognitiveServiceProvider = ({ children }: React.PropsWithChildren) => {
  const { t } = useTranslation('common');

  const {
    state: { user, speechRecognitionLanguage },
    dispatch,
  } = useContext(HomeContext);

  const speechRegion = useRef<string>();
  const speechToken = useRef<string>();
  const speechTokenExpiresAt = useRef<Dayjs>(dayjs());

  // Text-to-speech
  const speechSynthesizer = useRef<SpeechSynthesizer>();
  const player = useRef<SpeakerAudioDestination>();
  const [playingSpeech, setPlayingSpeech] = useState<boolean>(false);
  const [currentSpeechId, setCurrentSpeechId] = useState<string>();
  const [loadingTts, setLoadingTts] = useState<boolean>(false);

  // Speech-to-text
  const speechRecognizer = useRef<SpeechRecognizer>();
  const [speechContent, setSpeechContent] = useState<string>('');
  const [audioStream, setAudioStream] = useState<MediaStream>();
  const [isSpeechRecognitionActive, setIsSpeechRecognitionActive] =
    useState<boolean>(false);
  const [isMicrophoneDisabled, setIsMicrophoneDisabled] =
    useState<boolean>(false);
  const [loadingStt, setLoadingStt] = useState<boolean>(false);

  const getSpeechConfig = useCallback((): SpeechConfigType => {
    const speechConfig = localStorage.getItem('speechConfig');
    const defaultSpeechConfig: SpeechConfigType = { speechSpeed: 'normal' };

    if (!speechConfig) return defaultSpeechConfig;

    try {
      return JSON.parse(speechConfig);
    } catch {
      return defaultSpeechConfig;
    }
  }, []);

  const getSpeechSpeedInSsml = useCallback((): string => {
    const { speechSpeed } = getSpeechConfig();
    switch (speechSpeed) {
      case 'slow':
        return '0.9';
      case 'normal':
        return '1.1';
      case 'fast':
        return '1.25';
      default:
        return '1.1';
    }
  }, [getSpeechConfig]);

  const displayErrorToast = useCallback(
    () =>
      toast.error(
        t(
          'This feature is not available at the moment. Please try again later',
        ),
      ),
    [t],
  );

  const fetchSpeechToken = useCallback(async () => {
    const now = dayjs();

    if (speechToken.current && speechTokenExpiresAt.current.isAfter(now))
      return;

    try {
      const response = await fetch('/api/getSpeechToken', {
        headers: {
          'user-token': user?.token || '',
        },
      });
      const responseJson = await response.json();
      speechToken.current = responseJson.token;
      speechRegion.current = responseJson.region;
    } catch (error) {
      displayErrorToast();
      console.error('Error fetching token:', error);
    }

    // Speech token expires in 10 minutes
    speechTokenExpiresAt.current = now.add(9, 'minutes');
  }, [user, displayErrorToast]);

  const initSpeechSynthesizer = useCallback(async () => {
    setLoadingTts(true);

    await fetchSpeechToken();

    if (!speechToken.current || !speechRegion.current) {
      setLoadingTts(false);
      return;
    }

    const speechConfig = SpeechConfig.fromAuthorizationToken(
      speechToken.current,
      speechRegion.current,
    );

    // Default to use Mandarin voice, since it can also handle English fairly well
    speechConfig.speechSynthesisVoiceName = voiceMap[speechRecognitionLanguage];

    player.current = new SpeakerAudioDestination();

    player.current.onAudioStart = () => {
      setLoadingTts(false);
      setPlayingSpeech(true);
    };

    player.current.onAudioEnd = () => {
      setLoadingTts(false);
      setPlayingSpeech(false);
    };

    const audioConfig = AudioConfig.fromSpeakerOutput(player.current);

    speechSynthesizer.current = new SpeechSynthesizer(
      speechConfig,
      audioConfig,
    );
  }, [fetchSpeechToken, speechRecognitionLanguage]);

  const closeSpeechSynthesizer = useCallback(() => {
    speechSynthesizer.current?.close();
    speechSynthesizer.current = undefined;
  }, []);

  const closePlayer = useCallback(() => {
    if (!player.current) return;
    const { internalAudio } = player.current;
    // https://html.spec.whatwg.org/multipage/media.html#best-practices-for-authors-using-media-elements
    internalAudio.removeAttribute('src');
    internalAudio.load();
    player.current.close();
    setPlayingSpeech(false);
  }, []);

  // Play a one-off message.
  const playMessage = useCallback(
    async (message: string, speechId: string) => {
      try {
        closePlayer();
        closeSpeechSynthesizer();
        setCurrentSpeechId(speechId);

        await initSpeechSynthesizer();

        const ssml = `
          <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
            <voice name="${voiceMap[speechRecognitionLanguage]}">
              <prosody rate="${getSpeechSpeedInSsml()}">
              ${message}
              </prosody>
            </voice>
          </speak>
        `;

        speechSynthesizer.current?.speakSsmlAsync(
          ssml,
          () => {
            closeSpeechSynthesizer();
          },
          (error) => {
            setLoadingTts(false);
            closeSpeechSynthesizer();
            console.error(error);
          },
        );
      } catch (error) {
        displayErrorToast();
        console.error(error);
      }
    },
    [
      closePlayer,
      initSpeechSynthesizer,
      closeSpeechSynthesizer,
      speechRecognitionLanguage,
      getSpeechSpeedInSsml,
      displayErrorToast,
    ],
  );

  // Used in conversation mode. Call initSpeechSynthesizer() before calling queueMessage.
  const queueMessage = useCallback(async () => {}, []);

  const getMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsMicrophoneDisabled(false);
      return stream;
    } catch (error) {
      setIsMicrophoneDisabled(true);
      toast.error(t('Unable to access microphone'));
      return null;
    }
  }, [t]);

  const stopSpeechRecognition = useCallback(async (): Promise<void> => {
    speechRecognizer.current?.stopContinuousRecognitionAsync(
      () => {
        audioStream?.getTracks().forEach((track) => track.stop());
        setAudioStream(undefined);
        setLoadingStt(false);
        setIsSpeechRecognitionActive(false);
      },
      (error) => {
        displayErrorToast();
        console.error(error);
      },
    );
  }, [audioStream, displayErrorToast]);

  const startSpeechRecognition = useCallback(async () => {
    setLoadingStt(true);

    await fetchSpeechToken();
    const audioStream = await getMicrophone();

    if (!speechToken.current || !speechRegion.current || !audioStream) {
      setLoadingStt(false);
      return;
    }

    const speechConfig = SpeechConfig.fromAuthorizationToken(
      speechToken.current,
      speechRegion.current,
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

    const audioConfig = AudioConfig.fromStreamInput(audioStream);

    speechRecognizer.current = new SpeechRecognizer(speechConfig, audioConfig);

    // For keeping track of previously recognized speech. Prevents speechContent from
    // being cleared when the user stops speaking and starts again.
    let lastSpeechContent = '';

    speechRecognizer.current.sessionStarted = () => {
      setLoadingStt(false);
      setIsSpeechRecognitionActive(true);
      dispatch({ field: 'isMicrophoneMuted', value: false });
    };

    speechRecognizer.current.recognizing = (_, event) => {
      const { reason, text } = event.result;
      if (
        reason === ResultReason.RecognizedSpeech ||
        reason === ResultReason.RecognizingSpeech
      ) {
        setSpeechContent(`${lastSpeechContent} ${text} ...`.trim());
      }
    };

    speechRecognizer.current.recognized = (_, event) => {
      const { reason, text } = event.result;
      if (reason === ResultReason.RecognizedSpeech) {
        lastSpeechContent = `${lastSpeechContent} ${text}`;
        setSpeechContent(lastSpeechContent);
      }
    };

    speechRecognizer.current.speechEndDetected = () => {};

    speechRecognizer.current.canceled = (_, event) => {
      stopSpeechRecognition();
      if (event.reason == CancellationReason.Error) {
        displayErrorToast();
        console.error(event.errorDetails);
      }
    };

    speechRecognizer.current.sessionStopped = () => {
      stopSpeechRecognition();
    };

    speechRecognizer.current.startContinuousRecognitionAsync(
      () => {},
      (error) => {
        setLoadingStt(false);
        setIsSpeechRecognitionActive(false);
        displayErrorToast();
        console.error(error);
      },
    );
  }, [
    fetchSpeechToken,
    getMicrophone,
    speechRecognitionLanguage,
    stopSpeechRecognition,
    dispatch,
    displayErrorToast,
  ]);

  return (
    <CognitiveServiceContext.Provider
      value={{
        // Tts
        playMessage,
        queueMessage,
        initSpeechSynthesizer,
        closeSpeechSynthesizer,
        closePlayer,
        playingSpeech,
        currentSpeechId,
        loadingTts,

        // Stt
        startSpeechRecognition,
        stopSpeechRecognition,
        speechContent,
        audioStream,
        isSpeechRecognitionActive,
        loadingStt,
        isMicrophoneDisabled,
      }}
    >
      {children}
    </CognitiveServiceContext.Provider>
  );
};

export {
  CognitiveServiceProvider,
  CognitiveServiceContext,
  useCognitiveService,
};
