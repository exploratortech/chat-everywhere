import { createContext } from 'react';

export interface VoiceInputContextProps {
  audioStream: MediaStream | null;
  isLoading: boolean;
  isMicrophoneDisabled: boolean;
  setAudioStream: (audioStream: MediaStream | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsMicrophoneDisabled: (disabled: boolean) => void;
  startSpeechRecognition: (userToken: string) => void;
  stopSpeechRecognition: () => void;
}

const VoiceInputContext = createContext<VoiceInputContextProps>(undefined!);

export default VoiceInputContext;
