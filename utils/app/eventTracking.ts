import {
  clearLocalUserId,
  getOrGenerateUserId,
} from '@/utils/data/taggingHelper';

import type { Conversation } from '@/types/chat';
import type { FolderInterface } from '@/types/folder';
import type {
  MjButtonCommandRequest,
  MjImageGenRequest,
  MjJob,
} from '@/types/mjJob';
import type { Prompt } from '@/types/prompt';

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
  'Voice conversation turnaround', // This even is used to measure when a user finish speaking, and machine start speaking
  'AI speech play button clicked',
  'Referral code redemption success',
  'Referral code redemption failed',
  'Referral code redemption button clicked',
  'Regenerate referral code clicked',
  'Event promotional banner on click',

  // Detail message usages
  'Online mode message',
  'Default mode message',
  'GPT4 mode message',
  'MQTT mode message',
  'AI image generation',
  'AI image to prompt',
  'AI image button clicked',
  'Image to prompt',
  'DallE image generation',
  'Chat with doc message',

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
  'Join LINE group button clicked',

  // Error tracing
  'Error',
  'v2 Error',

  // MJ Queue
  'MJ Image Gen Completed',
  'MJ Image Gen Failed',

  // MJ Queue Cleanup Monitor (for cron job)
  'MJ Queue Cleanup Completed / Failed Job',
  'MJ Queue Cleanup Processing Job',
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

  // Image Generation
  usedOnDemandCredit?: boolean;
  lastUsedKey?: MjJob['lastUsedKey'];

  // MJ Queue
  mjImageGenType?: MjImageGenRequest['type'] | MjButtonCommandRequest['type'];
  mjImageGenButtonCommand?: string;
  mjImageGenTotalDurationInSeconds?: number;
  mjImageGenTotalWaitingInQueueTimeInSeconds?: number;
  mjImageGenTotalProcessingTimeInSeconds?: number;
  mjImageGenErrorMessage?: string;

  // MJ Queue Cleanup Monitor (for cron job)
  mjQueueCleanupCompletedFailedJobEnqueuedAt?: string;
  mjQueueCleanupProcessingJobEnqueuedAt?: string;
  mjQueueCleanupExecutedAt?: string;
  mjQueueCleanupJobEnqueuedAt?: string;
  mjQueueCleanupJobOneWeekAgo?: string;
  mjQueueCleanupJobFiveMinutesAgo?: string;
  mjQueueJobDetail?: MjJob;

};

export interface UserPostHogProfile {
  id: string;
  email: string;
  plan: string;
  isTeacherAccount: boolean;
  isTempUser: boolean;
  associatedTeacherId: string | undefined;
  tempUserUniqueId: string | undefined;
}

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

export const isFeatureEnabled = (featureName: string) => {
  return !!posthog.isFeatureEnabled(featureName);
};

export const updateUserInfo = (userProfile: UserPostHogProfile) => {
  if (!enableTracking) return;
  posthog.identify(userProfile.id, {
    email: userProfile.email,
    plan: userProfile.plan,
    env: process.env.NEXT_PUBLIC_ENV,
    isTeacherAccount: userProfile.isTeacherAccount,
    isTempUser: userProfile.isTempUser,
    associatedTeacherId: userProfile.associatedTeacherId,
    tempUserUniqueId: userProfile.tempUserUniqueId,
  });

  if (
    (userProfile.isTempUser || userProfile.isTeacherAccount) &&
    userProfile.associatedTeacherId
  ) {
    posthog.group('teacher-group', userProfile.associatedTeacherId, {
      associatedTeacherId: userProfile.associatedTeacherId,
      tempUserUniqueId: userProfile.tempUserUniqueId,
    });
  }

  posthog.alias(userProfile.id, getOrGenerateUserId());
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
  if (!enableTracking) return;
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

export const serverSideTrackSystemEvent = async (
  eventName: EventNameTypes,
  additionalPayload?: PayloadType,
) => {
  if (!enableTracking) return;
  try {
    const response = await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        api_key: POSTHOG_KEY,
        distinct_id: 'system',
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
    if (!enableTracking) return;
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
