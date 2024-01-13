import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { voiceMap } from '@/utils/app/i18n';

import {
  AudioConfig,
  SpeakerAudioDestination,
  SpeechConfig,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk';

export type SpeechSpeedType = 'slow' | 'normal' | 'fast';
type SpeechConfigType = {
  speechSpeed: SpeechSpeedType;
};

export const useAzureTts = () => {
  const { t } = useTranslation('common');

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeechId, setCurrentSpeechId] = useState<string | null>(null);
  const token = useRef();
  const region = useRef();
  const player = useRef(new SpeakerAudioDestination());

  player.current.onAudioStart = () => {
    setIsPlaying(true);
    setIsLoading(false);
  };

  player.current.onAudioEnd = () => {
    setIsPlaying(false);
    setIsLoading(false);
  };

  const getSpeechConfig = (): SpeechConfigType => {
    const storedSpeechConfig = localStorage.getItem('speechConfig');
    const defaultSpeechConfig: SpeechConfigType = {
      speechSpeed: 'normal',
    };

    if (storedSpeechConfig) {
      try {
        return JSON.parse(storedSpeechConfig);
      } catch {
        return defaultSpeechConfig;
      }
    }

    return defaultSpeechConfig;
  };

  const getSpeechSpeed = () => {
    return getSpeechConfig().speechSpeed;
  };

  const setSpeechSpeed = (speechSpeed: SpeechSpeedType) => {
    localStorage.setItem(
      'speechConfig',
      JSON.stringify({ speechSpeed: speechSpeed }),
    );
  };

  const getSpeechSpeedInSsml = (): string => {
    switch (getSpeechSpeed()) {
      case 'slow':
        return '0.9';
      case 'normal':
        return '1.1';
      case 'fast':
        return '1.25';
      default:
        return '1.1';
    }
  };

  const fetchTokenIfNeeded = async (userToken: string) => {
    if (!token.current || !region.current) {
      try {
        const response = await fetch('/api/getSpeechToken', {
          headers: {
            'user-token': userToken,
          },
        });
        const responseJson = await response.json();
        token.current = responseJson.token;
        region.current = responseJson.region;
      } catch (error) {
        setIsLoading(false);
        console.error('Error fetching token:', error);
      }
    }
  };

  const stopPlaying = () => {
    player.current.pause();
    player.current.close();
    player.current = new SpeakerAudioDestination();
    setIsPlaying(false);
  };

  const displayErrorToast = () =>
    toast.error(
      t('This feature is not available at the moment. Please try again later'),
    );

  const speak = async (
    text: string,
    speechId: string,
    userToken: string,
    language: string,
  ) => {
    try {
      stopPlaying();

      setCurrentSpeechId(speechId);
      setIsLoading(true);

      await fetchTokenIfNeeded(userToken);

      const toUseToken = token.current;
      const toUseRegion = region.current;

      if (!toUseToken || !toUseRegion) {
        displayErrorToast();
        return;
      }

      const audioConfig = AudioConfig.fromSpeakerOutput(player.current);
      const speechConfig = SpeechConfig.fromAuthorizationToken(
        toUseToken,
        toUseRegion,
      );

      // Default to use Mandarin voice, since it can also handle English fairly well
      speechConfig.speechSynthesisVoiceName = voiceMap[language];
      const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

      let ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
          <voice name="${voiceMap[language]}">
            <prosody rate="${getSpeechSpeedInSsml()}">
            ${text}
            </prosody>
          </voice>
        </speak>
      `;

      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result) {
            synthesizer.close();
          }
        },
        (error) => {
          setIsLoading(false);
          console.error(error);
          synthesizer.close();
          displayErrorToast();
        },
      );
    } catch (error) {
      console.log(error);
      displayErrorToast();
    }
  };

  return {
    isLoading,
    isPlaying,
    currentSpeechId,
    getSpeechSpeed,
    speak,
    stopPlaying,
    setSpeechSpeed,
  };
};
