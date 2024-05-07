import { Conversation, Message } from '@/types/chat';
import { DragData } from '@/types/drag';
import { ErrorMessage } from '@/types/error';
import { FolderInterface } from '@/types/folder';
import { OpenAIModelID } from '@/types/openai';
import { Prompt, TeacherPromptForTeacherPortal } from '@/types/prompt';
import { TeacherSettings } from '@/types/teacher-settings';
import { CreditUsage, User } from '@/types/user';

import { SupabaseClient } from '@supabase/supabase-js';

export interface HomeInitialState {
  loading: boolean;
  lightMode: 'light' | 'dark';
  messageIsStreaming: boolean;
  modelError: ErrorMessage | null;
  folders: FolderInterface[];
  conversations: Conversation[];
  selectedConversation: Conversation | undefined;
  currentMessage: Message | undefined;
  prompts: Prompt[];
  temperature: number;
  showChatbar: boolean;
  showPromptbar: boolean;
  currentFolder: FolderInterface | undefined;
  messageError: boolean;
  searchTerm: string;
  defaultModelId: OpenAIModelID | undefined;
  outputLanguage: string;
  currentDrag: DragData | undefined;

  // Supabase / Cloud Sync
  supabaseClient: SupabaseClient | null;
  conversationLastSyncAt: number | null;
  conversationLastUpdatedAt: number | null;
  forceSyncConversation: boolean;
  replaceRemoteData: boolean;
  syncingConversation: boolean;
  syncSuccess: boolean | null; // null = not yet synced

  // User Auth
  showSettingsModel: boolean;
  showFilePortalModel: boolean;
  showLoginSignUpModel: boolean;
  showOneTimeCodeLoginModel: boolean;
  showReferralModel: boolean;
  showUsageModel: boolean;
  showSurveyModel: boolean;
  showNewsModel: boolean;
  showFeaturesModel: boolean;
  showEventModel: boolean;
  showClearConversationsModal: boolean;
  showClearPromptsModal: boolean;
  showFeaturePageOnLoad: string | null;
  user: User | null;
  isPaidUser: boolean;
  isUltraUser: boolean;
  isSurveyFilled: boolean;
  isTempUser: boolean;
  isTeacherAccount: boolean;

  // Plugins Utils
  creditUsage: CreditUsage | null;
  hasMqttConnection: boolean;
  isConnectedWithLine: boolean;

  // Text to Speech
  currentSpeechId: null | string;
  speechToken: null | string;
  speechRegion: null | string;
  isPlaying: boolean;
  isLoading: boolean;

  // Speech to Text
  speechContent: string;
  isSpeechRecognitionActive: boolean;
  speechRecognitionLanguage: string;

  // Teacher Portal
  teacherPrompts: TeacherPromptForTeacherPortal[];
  teacherSettings: TeacherSettings;

  // Posthog feature flags
  featureFlags: {
    'enable-chat-with-doc': boolean;
  };
}

export const initialState: HomeInitialState = {
  loading: false,
  lightMode: 'dark',
  messageIsStreaming: false,
  modelError: null,
  folders: [],
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  prompts: [],
  temperature: 1,
  showPromptbar: false,
  showChatbar: true,
  currentFolder: undefined,
  messageError: false,
  searchTerm: '',
  defaultModelId: undefined,
  outputLanguage: '',
  currentDrag: undefined,

  // Supabase / Cloud Sync
  supabaseClient: null,
  conversationLastSyncAt: null,
  conversationLastUpdatedAt: null,
  forceSyncConversation: true, // Sync on first load
  replaceRemoteData: false,
  syncingConversation: false,
  syncSuccess: null,

  // User Auth
  showSettingsModel: false,
  showFilePortalModel: false,
  showLoginSignUpModel: false,
  showOneTimeCodeLoginModel: false,
  showReferralModel: false,
  showUsageModel: false,
  showSurveyModel: false,
  showNewsModel: false,
  showFeaturesModel: false,
  showEventModel: false,
  showClearConversationsModal: false,
  showClearPromptsModal: false,
  showFeaturePageOnLoad: null,
  user: null,
  isPaidUser: false,
  isUltraUser: false,
  isSurveyFilled: false,
  isTempUser: false,
  isTeacherAccount: false,

  // Plugins Utils
  creditUsage: null,
  hasMqttConnection: false,
  isConnectedWithLine: false,

  // Text to Speech
  currentSpeechId: null,
  speechToken: null,
  speechRegion: null,
  isPlaying: false,
  isLoading: false,

  // Speech to Text
  speechContent: '',
  isSpeechRecognitionActive: false,
  speechRecognitionLanguage: 'en-US',

  // Teacher Portal
  teacherPrompts: [],
  teacherSettings: {
    allow_student_use_line: false,
    hidden_chateverywhere_default_character_prompt: false,
  },

  // Posthog feature flags
  featureFlags: {
    'enable-chat-with-doc': false,
  },
};
