import mixpanel from 'mixpanel-browser';

const EventNames = [
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
  'Regenerate referral code clicked'
];

type EventNameTypes = (typeof EventNames)[number];
type PayloadType = {
  Length?: number;
  PluginId?: string | null;
  LargeContextModel?: boolean;
  ReferralCode?: string;
};

export const enableTracking = process.env.NEXT_PUBLIC_ENV === 'production';

export const initializeMixpanel = () => {
  if (!enableTracking) return;
  mixpanel.init('4a378d158509c05295af13dc46eb3f1a');
};

export const trackEvent = (
  eventName: EventNameTypes,
  additionalPayload?: PayloadType,
) => {
  if (!enableTracking) return;
  mixpanel.track(eventName, additionalPayload);
};
