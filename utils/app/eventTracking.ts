import {
  clearLocalUserId,
  getOrGenerateUserId,
} from '@/utils/data/taggingHelper';

import { Conversation } from '@/types/chat';
import { FolderInterface } from '@/types/folder';
import { Prompt } from '@/types/prompt';
import { User } from '@/types/user';

import posthog from 'posthog-js';

export const EventNames = [
  'Send message',
  'Switch plugin',
  'Click on Account',
  'Share conversation clicked',
  'Share conversation loaded',
  'Import conversation clicked',
  'Export conversation clicked',
  'Clear conversation clicked',
  'Sign in button clicked',
  'Account button clicked',
  'Latest updates clicked',
  'Usages & credit clicked',
  'Feature introduction opened',
  'Promotional banner clicked',
  'Upgrade button clicked',
  'Upgrade (one-month only) button clicked',
  'Voice input button clicked',
  'AI speech play button clicked',
  'Referral code redemption success',
  'Referral code redemption failed',
  'Referral code redemption button clicked',
  'Regenerate referral code clicked',

  // Detail message usages
  'Online mode message',
  'Default mode message',
  'GPT4 mode message',
  'MQTT mode message',
  'AI image generation',
  'AI image to prompt',
  'AI image button clicked',
  'Image to prompt',

  // Payment
  'Payment success',
  'New paying customer',

  // Email tracking
  'Trial end email sent',
  'Trial end email opened',

  // Integration
  'LINE share button clicked',
  'LINE Notify connected',
  'Share to Line',
  'Disconnect LINE Notify',
  'MQTT trigger connection',
  'Helper function triggered',
  'MQTT retrieval connection',

  // V2
  'v2 Retrieve messages',
  'v2 Send message',
  'v2 Create conversation',
  'v2 Image generation request',
  'v2 Image generation processed',
  'v2 Update Metadata of message',
  'v2 Trial redemption success',
  'v2 Payment link clicked',
  'v2 Referral code redemption failed',

  // Teacher portal
  'Teacher portal clicked',
  'Teacher portal generate code',
  'Teacher portal remove temp account',
  'One-time code redeemed',
  'Temp account message submission',

  // Error tracing
  'Error',
  'v2 Error',
];

export type EventNameTypes = (typeof EventNames)[number];

export type PayloadType = {
  Length?: number;
  PluginId?: string | null;
  LargeContextModel?: boolean;
  ReferralCode?: string;
  promptTokenLength?: number;
  completionTokenLength?: number;
  generationLengthInSecond?: number;
  imageGenerationFailed?: string;
  imageGenerationErrorMessage?: string;
  imageGenerationPrompt?: string;
  aiImageButtonCommand?: string;

  // Detail error trace
  currentConversation?: string;
  messageToSend?: string;
  errorMessage?: string;

  // Payment
  paymentDetail?: string;

  // V2
  v2ThreadId?: string;
  v2MessageId?: string;
  v2runId?: string;
  v2ImageGenerationUrl?: string;
  v2ImageGenerationDurationInMS?: number;

  // Integration
  helperFunctionName?: string;

  // Performance tracking
  timeToFirstTokenInMs?: number;
  tokenPerSecond?: number;
  endpoint?: string;

  // Teacher portal
  tempAccountName?: string;
};

const POSTHOG_KEY = 'phc_9n85Ky3ZOEwVZlg68f8bI3jnOJkaV8oVGGJcoKfXyn1';
export const enableTracking = process.env.NEXT_PUBLIC_ENV === 'production';

export const initializePosthog = () => {
  if (!enableTracking) return;
  posthog.init(POSTHOG_KEY, {
    api_host: '/ingest',
    autocapture: false,
  });

  posthog.identify(getOrGenerateUserId(), {
    env: process.env.NEXT_PUBLIC_ENV,
  });
};

export const updateUserInfo = (user: User) => {
  if (!enableTracking) return;
  posthog.identify(user.id, {
    email: user.email,
    plan: user.plan,
    env: process.env.NEXT_PUBLIC_ENV,
    isTeacherAccount: user.isTeacherAccount,
    isTempUser: user.isTempUser,
  });

  posthog.alias(user.id, getOrGenerateUserId());
};

export const clearUserInfo = () => {
  if (!enableTracking) return;
  posthog.reset();
  clearLocalUserId();
};

export const trackEvent = (
  eventName: EventNameTypes,
  additionalPayload?: PayloadType,
) => {
  if (!enableTracking) return;
  posthog.capture(eventName, additionalPayload);
};

export const serverSideTrackEvent = async (
  userId: string, // Either userID from signup or generated userID
  eventName: EventNameTypes,
  additionalPayload?: PayloadType,
) => {
  try {
    const response = await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        api_key: POSTHOG_KEY,
        distinct_id: userId,
        properties: additionalPayload,
      }),
    });
    const data = await response.json();
    console.log('Event captured', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

export const logUsageSnapshot = (
  folders: FolderInterface[] | [],
  conversations: Conversation[],
  promptTemplates: Prompt[],
) => {
  try {
    const numberOfConversationFolders = folders.filter(
      (folder) => folder.type === 'chat' && !folder.deleted,
    ).length;

    const numberOfPromptTemplatesFolders = folders.filter(
      (folder) => folder.type === 'prompt' && !folder.deleted,
    ).length;

    const numberOfConversations = conversations.filter(
      (conversation) => !conversation.deleted,
    ).length;

    const numberOfPromptTemplates = promptTemplates.filter(
      (promptTemplate) => !promptTemplate.deleted,
    ).length;

    const usageSnapshot = {
      conversations: numberOfConversations,
      conversationFolders: numberOfConversationFolders,
      promptTemplates: numberOfPromptTemplates,
      promptTemplatesFolders: numberOfPromptTemplatesFolders,
      env: process.env.NEXT_PUBLIC_ENV,
    };

    posthog.identify(getOrGenerateUserId(), usageSnapshot);
  } catch (error) {
    console.log(error);
  }
};
