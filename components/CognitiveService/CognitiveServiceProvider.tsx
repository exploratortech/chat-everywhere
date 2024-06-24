import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { voiceMap } from '@/utils/app/i18n';
import { trackEvent } from '@/utils/app/eventTracking';
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
  isConversationModeActive: boolean;
  isConversing: boolean;
  setIsConversationModeActive: (value: boolean) => void;
  currentSpeaker: Speaker | null;
  setSendMessage: (func: Function) => void;
  toggleConversation: () => void;

  getSpeechConfig: () => SpeechConfigType;
  setSpeechSpeed: (speechSpeed: SpeechSpeedType) => void;

  // Tts
  playMessage: (message: string, speechId: string) => Promise<void>;
  queueMessage: (message: string) => void;
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

type Speaker = 'model' | 'user';

const CognitiveServiceContext =
  createContext<CognitiveServiceContextType | null>(null);

const useCognitiveService = () => useContext(CognitiveServiceContext)!;

const CognitiveServiceProvider = ({ children }: React.PropsWithChildren) => {
  const { t } = useTranslation('common');

  const {
    state: { user, speechRecognitionLanguage },
  } = useContext(HomeContext);

  const speechRegion = useRef<string>();
  const speechToken = useRef<string>();
  const speechTokenExpiresAt = useRef<Dayjs>(dayjs());

  // Conversation mode
  const [isConversationModeActive, setIsConversationModeActive] =
    useState<boolean>(false);
  const [isConversing, setIsConversing] = useState<boolean>(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const speechSynthesizerTimeout = useRef<NodeJS.Timeout>();
  const sendMessage = useRef<Function>();

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

  const setSpeechSpeed = useCallback((speechSpeed: SpeechSpeedType) => {
    localStorage.setItem(
      'speechConfig',
      JSON.stringify({ speechSpeed: speechSpeed }),
    );
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

  const supabase = useSupabaseClient();
  const fetchSpeechToken = useCallback(async () => {
    const now = dayjs();

    if (speechToken.current && speechTokenExpiresAt.current.isAfter(now))
      return;

    const accessToken = (await supabase.auth.getSession())?.data.session
      ?.access_token;
    if (!accessToken) {
      alert('Please sign in to continue');
      return;
    }
    try {
      const response = await fetch('/api/getSpeechToken', {
        headers: {
          'user-token': accessToken,
        },
      });
      const responseJson = await response.json();
      speechToken.current = responseJson.token;
      speechRegion.current = responseJson.region;
    } catch (error) {
      console.error('Error fetching token');
      return Promise.reject(error);
    }

    // Speech token expires in 10 minutes
    speechTokenExpiresAt.current = now.add(9, 'minutes');
    return Promise.resolve();
  }, [user]);

  const setSendMessage = useCallback((func: Function) => {
    sendMessage.current = func;
  }, []);

  const initSpeechSynthesizer = useCallback(async () => {
    try {
      if (loadingTts) return;

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
      speechConfig.speechSynthesisVoiceName =
        voiceMap[speechRecognitionLanguage];

      player.current = new SpeakerAudioDestination();

      player.current.onAudioStart = () => {
        setLoadingTts(false);
        setPlayingSpeech(true);
      };

      player.current.onAudioEnd = () => {
        setLoadingTts(false);
        setPlayingSpeech(false);

        if (isConversationModeActive) {
          setCurrentSpeaker('user');
        }
      };

      const audioConfig = AudioConfig.fromSpeakerOutput(player.current);

      speechSynthesizer.current = new SpeechSynthesizer(
        speechConfig,
        audioConfig,
      );

      return Promise.resolve();
    } catch (error) {
      displayErrorToast();
      console.error(error);
      return Promise.reject(error);
    }
  }, [
    loadingTts,
    fetchSpeechToken,
    speechRecognitionLanguage,
    isConversationModeActive,
    displayErrorToast,
  ]);

  const closeSpeechSynthesizer = useCallback((): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!speechSynthesizer.current) {
        resolve();
        return;
      }
      speechSynthesizer.current.close(
        () => resolve(),
        (error) => reject(error),
      );
      speechSynthesizer.current = undefined;
    });
  }, []);

  const closePlayer = useCallback((): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!player.current) {
        resolve();
        return;
      }

      const { internalAudio } = player.current;
      // https://html.spec.whatwg.org/multipage/media.html#best-practices-for-authors-using-media-elements
      internalAudio.removeAttribute('src');
      internalAudio.load();
      player.current.close(
        () => resolve(),
        (error) => reject(error),
      );
      setPlayingSpeech(false);
    });
  }, []);

  // Play a one-off message.
  const playMessage = useCallback(
    async (message: string, speechId: string) => {
      try {
        await Promise.all([closePlayer(), closeSpeechSynthesizer()]);
        await initSpeechSynthesizer();
        setCurrentSpeechId(speechId);

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
            closeSpeechSynthesizer();
            setLoadingTts(false);
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
  const queueMessage = useCallback(
    (message: string) => {
      if (!speechSynthesizer.current) {
        return;
      }

      if (!message) return;

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
          // Delay closing the speech synthesizer, otherwise, it will close before we get
          // the chance to queue another message.
          // Note: synthesizer needs to be closed in order for the player.onAudioEnd event
          // to occur.
          clearTimeout(speechSynthesizerTimeout.current);
          speechSynthesizerTimeout.current = setTimeout(
            closeSpeechSynthesizer,
            2500,
          );
        },
        (error) => {
          closeSpeechSynthesizer();
          setLoadingTts(false);
          console.error(error);
        },
      );
    },
    [speechRecognitionLanguage, getSpeechSpeedInSsml, closeSpeechSynthesizer],
  );

  const getMicrophone = useCallback(async () => {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }, []);

  const stopSpeechRecognition = useCallback(async (): Promise<void> => {
    speechRecognizer.current?.stopContinuousRecognitionAsync(
      () => {
        setAudioStream((audioStream) => {
          audioStream?.getTracks().forEach((track) => track.stop());
          return undefined;
        });
        setLoadingStt(false);
        setIsSpeechRecognitionActive(false);
        speechRecognizer.current?.close();
        speechRecognizer.current = undefined;
      },
      (error) => {
        displayErrorToast();
        console.error(error);
      },
    );
  }, [displayErrorToast]);

  const startSpeechRecognition = useCallback(async () => {
    try {
      if (loadingStt) return;

      setLoadingStt(true);

      await fetchSpeechToken();

      let audioStream: MediaStream | null;
      try {
        audioStream = await getMicrophone();
        setAudioStream(audioStream);
        setIsMicrophoneDisabled(false);
      } catch (error) {
        setIsMicrophoneDisabled(true);
        toast.error(t('Unable to access microphone'));
        console.error(error);
        return;
      }

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

      speechRecognizer.current = new SpeechRecognizer(
        speechConfig,
        audioConfig,
      );

      // For keeping track of previously recognized speech. Prevents speechContent from
      // being cleared when the user stops speaking and starts again.
      let lastSpeechContent = '';

      speechRecognizer.current.sessionStarted = () => {
        setLoadingStt(false);
        setIsSpeechRecognitionActive(true);
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
          lastSpeechContent = `${lastSpeechContent} ${text}`.trim();
          setSpeechContent(lastSpeechContent);
        }
      };

      speechRecognizer.current.speechEndDetected = () => {
        if (isConversationModeActive) {
          stopSpeechRecognition();
        }
      };

      speechRecognizer.current.canceled = (_, event) => {
        stopSpeechRecognition();
        if (event.reason == CancellationReason.Error) {
          displayErrorToast();
          console.error(event.errorDetails);
        }
      };

      speechRecognizer.current.sessionStopped = () => {
        // This event doesn't get called when stopContinueRecognitionAsync() is called.
        // Get's called when the user is no longer speaking.
        if (isConversationModeActive) {
          sendMessage.current && sendMessage.current(true);
          setCurrentSpeaker('model');
          trackEvent('Voice conversation turnaround');
        }
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
    } catch (error) {
      displayErrorToast();
      console.error(error);
    }
  }, [
    loadingStt,
    isConversationModeActive,
    fetchSpeechToken,
    getMicrophone,
    speechRecognitionLanguage,
    stopSpeechRecognition,
    displayErrorToast,
    t,
  ]);

  // Starts/stops conversation
  const toggleConversation = useCallback(async () => {
    if (isConversing) {
      setCurrentSpeaker(null);
      await Promise.all([
        stopSpeechRecognition(),
        closePlayer(),
        closeSpeechSynthesizer(),
      ]);
    } else {
      // Will execute a useEffect callback that invokes startSpeechRecognition().
      setSpeechContent('');
      setCurrentSpeaker('user');
    }

    setIsConversing(!isConversing);
  }, [
    isConversing,
    stopSpeechRecognition,
    closePlayer,
    closeSpeechSynthesizer,
  ]);

  useEffect(() => {
    if (!isConversing) return;
    if (currentSpeaker === 'model' && !speechSynthesizer.current) {
      initSpeechSynthesizer();
    } else if (currentSpeaker === 'user' && !speechRecognizer.current) {
      startSpeechRecognition();
    }
  }, [
    isConversing,
    currentSpeaker,
    initSpeechSynthesizer,
    startSpeechRecognition,
  ]);

  return (
    <CognitiveServiceContext.Provider
      value={{
        isConversationModeActive,
        isConversing,
        setIsConversationModeActive,
        currentSpeaker,
        setSendMessage,
        toggleConversation,

        getSpeechConfig,
        setSpeechSpeed,

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
