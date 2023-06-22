import mixpanel from 'mixpanel-browser';

const EventNames = [
  'Landed',
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
];

type EventNameTypes = (typeof EventNames)[number];
type PayloadType = {
  length?: number;
  pluginId?: string | null;
};

export const initializeMixpanel = () => {
  if (process.env.NEXT_PUBLIC_ENV === 'production') {
    mixpanel.init('4a378d158509c05295af13dc46eb3f1a');
    trackEvent('Landed');
  }
};

export const trackEvent = (
  eventName: EventNameTypes,
  additionalPayload?: PayloadType,
) => {
  mixpanel.track(eventName, additionalPayload);
};
