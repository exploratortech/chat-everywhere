import type { FC } from 'react';
import { useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';
import { event } from 'nextjs-google-analytics';

import { trackEvent } from '@/utils/app/eventTracking';
import { FeatureItem, PlanDetail } from '@/utils/app/ui';

import type { Prompt } from '@/types/prompt';

import HomeContext from '@/components/home/home.context';

import { FootNoteMessage } from './FootNoteMessage';
import { RolePlayPrompts } from './RolePlayPrompts';
import { SamplePrompts } from './SamplePrompts';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// Use the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

type Props = {
  promptOnClick: (prompt: string) => void;
  customInstructionOnClick: (customInstructionPrompt: Prompt) => void;
};

const getEventMinuteCountDown = () => {
  const eventTimezone = 'Asia/Taipei';
  const eventDate = dayjs.tz('2024-05-04T13:00:00', eventTimezone);
  const currentDate = dayjs();

  const timeDifference = eventDate.diff(currentDate, 'minute');
  const minutesUntilEvent = Math.floor(timeDifference);

  return minutesUntilEvent;
};

const getEventDisplayMessage = (t: any) => {
  const minutesUntilEvent = getEventMinuteCountDown();
  if (minutesUntilEvent > 60) {
    return t('Join our event in {{hours}} hours!', {
      hours: Math.floor(minutesUntilEvent / 60),
    });
  }

  if (minutesUntilEvent < 0) {
    return t('Event is now live!');
  }

  return t('Join our event in {{minutes}} minutes!', {
    minutes: minutesUntilEvent,
  });
};

export const NewConversationMessagesContainer: FC<Props> = ({
  promptOnClick,
  customInstructionOnClick,
}) => {
  const { t } = useTranslation('chat');
  const { t: modelTranslate } = useTranslation('model');
  const {
    state: { user, isUltraUser, isPaidUser },
    dispatch,
  } = useContext(HomeContext);

  const [rolePlayMode, setRolePlayMode] = useState(true);

  const switchButtonOnClick = () => {
    setRolePlayMode(!rolePlayMode);
  };

  const roleOnClick = (roleName: string, roleContent: string) => {
    promptOnClick(roleContent);

    event('interaction', {
      category: 'New Conversation',
      label: roleName,
    });
  };

  const bannerOnClick = () => {
    dispatch({ field: 'showSettingsModel', value: true });

    event('Support banner clicked', {
      category: 'Engagement',
      label: 'Banner',
    });
    trackEvent('Promotional banner clicked');
  };

  const featureOnClick = () => {
    dispatch({ field: 'showFeaturesModel', value: true });
    dispatch({ field: 'showFeaturePageOnLoad', value: null });
    event('Feature banner clicked', {
      category: 'Engagement',
      label: 'feature_introduction_banner',
    });
    trackEvent('Feature introduction opened');
  };

  const eventBannerOnClick = () => {
    dispatch({ field: 'showEventModel', value: true });
    trackEvent('Event promotional banner on click');
  };

  return (
    <div className="font-normal">
      <a
        href="https://intro.chateverywhere.app"
        target="_blank"
        rel="noopener noreferrer"
        className={`select-none font-serif font-semibold underline ${
          isUltraUser
            ? 'mr-0 rounded bg-gray-700 bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] pb-[3px] pr-[3px] text-white dark:from-[#fd68a6] dark:to-[#6c62f7] dark:text-[#343541]'
            : ''
        }`}
        style={
          isUltraUser
            ? {
                WebkitBackgroundClip: 'text',
                WebkitTextStrokeWidth: '3px',
                WebkitTextStrokeColor: 'transparent',
                fontSize: '2.25rem',
              }
            : {}
        }
      >
        Chat Everywhere {isUltraUser ? 'Ultra' : ''}
      </a>

      {/* Ask for support banner */}
      {(!user || user?.plan === 'free') && (
        <div
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-md border border-neutral-200 bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] p-2 dark:border-neutral-600"
          onClick={bannerOnClick}
        >
          <span className="flex flex-row flex-wrap items-center justify-center text-sm font-semibold leading-4">
            {modelTranslate(
              'Unlock all the features by upgrading to our Pro plan with only USD$9.99/month',
            )}
          </span>
          <div className="flex flex-row flex-wrap items-center justify-center pt-2 text-xs font-light">
            {PlanDetail.combinedSimplify.map((feature, index) => (
              <FeatureItem key={index} featureName={modelTranslate(feature)} />
            ))}
          </div>
        </div>
      )}

      {getEventMinuteCountDown() > -60 && (
        <div
          className="mt-4 flex cursor-pointer items-center justify-center rounded-md border border-neutral-200 p-2 dark:bg-none"
          onClick={eventBannerOnClick}
        >
          <span className="flex flex-row flex-wrap items-center justify-center text-sm leading-4">
            {getEventDisplayMessage(t)} 🎉
          </span>
        </div>
      )}

      {isPaidUser && (
        <div className="mt-4 flex cursor-pointer items-center justify-center rounded-md border border-red-500 bg-red-100 p-2 dark:border-red-700 dark:bg-red-200">
          <span className="flex flex-row flex-wrap items-center justify-center px-2 text-sm font-semibold leading-4 text-red-700">
            {t(`You may experience interruptions in GPT-4, AI Painter, AI Image modes due to Microsoft Azure service interruption. We are working on restoring
            these features as soon as possible. Sorry for the inconvenience.`)}
          </span>
        </div>
      )}

      <div
        className="mt-4 flex cursor-pointer items-center justify-center rounded-md border border-neutral-200 p-2 dark:border-neutral-600 dark:bg-none"
        onClick={featureOnClick}
      >
        <span className="flex flex-row flex-wrap items-center justify-center text-sm leading-4">
          {t('Features introduction page is now available!')}
        </span>
      </div>

      {rolePlayMode ? (
        <RolePlayPrompts
          roleOnClick={roleOnClick}
          customInstructionOnClick={customInstructionOnClick}
        />
      ) : (
        <SamplePrompts promptOnClick={promptOnClick} />
      )}
      <button
        className="mb-3 rounded-md border border-neutral-600 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200 dark:text-gray-100 dark:hover:bg-transparent"
        onClick={switchButtonOnClick}
      >
        {rolePlayMode
          ? t('Switch to Sample Prompts')
          : t('Switch to Role Play')}
      </button>
      <FootNoteMessage displayV2Link={user?.isInReferralTrial || false} />
    </div>
  );
};
