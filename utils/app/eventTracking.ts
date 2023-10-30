import {
  clearLocalUserId,
  getOrGenerateUserId,
} from '@/utils/data/taggingHelper';

import { Conversation } from '@/types/chat';
import { FolderInterface } from '@/types/folder';
import { Prompt } from '@/types/prompt';
import { User } from '@/types/user';

import mixpanel from 'mixpanel-browser';
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
  'AI image generation',
  'Image to prompt',
];

export type EventNameTypes = (typeof EventNames)[number];

type PayloadType = {
  Length?: number;
  PluginId?: string | null;
  LargeContextModel?: boolean;
  ReferralCode?: string;
  promptTokenLength?: number;
  completionTokenLength?: number;
};

const POSTHOG_KEY = 'phc_9n85Ky3ZOEwVZlg68f8bI3jnOJkaV8oVGGJcoKfXyn1';
export const enableTracking =
  process.env.NEXT_PUBLIC_ENV === 'production' || true;

export const initializeMixpanel = () => {
  if (!enableTracking) return;
  mixpanel.init('4a378d158509c05295af13dc46eb3f1a');
};

export const initializePosthog = () => {
  if (!enableTracking) return;
  posthog.init(POSTHOG_KEY, {
    api_host: '/ingest',
    autocapture: false,
  });

  posthog.identify(getOrGenerateUserId());
};

export const updateUserInfo = (user: User) => {
  if (!enableTracking) return;
  posthog.identify(user.id, {
    email: user.email,
    plan: user.plan,
    env: process.env.NEXT_PUBLIC_ENV,
  });

  posthog.alias(user.id, getOrGenerateUserId());

  console.log('updating user info ...');
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
  mixpanel.track(eventName, additionalPayload);
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
    const usageSnapshot = {
      conversationFolders: folders.filter((folder) => folder.type === 'chat').length,
      conversations: conversations.length,
      promptTemplates: folders.filter((folder) => folder.type === 'prompt')
        .length,
      promptTemplatesFolders: promptTemplates.length,
    };

    posthog.identify(getOrGenerateUserId(), usageSnapshot);
  } catch (error) {
    console.log(error);
  }
};
