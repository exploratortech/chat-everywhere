import { IconThumbDown, IconThumbUp } from '@tabler/icons-react';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

import { TFunction, useTranslation } from 'next-i18next';

import { Conversation } from '@/types/chat';

import { trackError } from '@/utils/app/azureTelemetry';

type FeedbackContainerProps = {
  conversation: Conversation;
};

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({
  conversation,
}) => {
  const [isThumbsUp, setIsThumbsUp] = useState<boolean | null>();
  const opinionRef = React.useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation('chat');

  const submitFeedback = async (isPositiveFeedback: boolean) => {
    const response = await fetch('/api/conversation-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation,
        positive: isPositiveFeedback,
        opinion: opinionRef.current?.value || '',
      }),
    });

    if (!response.ok) {
      toast.error(t('Something went wrong. Please try again later.'));
      //Log error to Azure App Insights
      trackError(response.statusText);
      return;
    }

    toast.remove('feedback-toast');
    toast.success(t('Thank you for your feedback!'), { duration: 3000 });
  };

  const thumbButtonOnClick = (t: TFunction, isPositiveFeedback: boolean) => {
    toast.custom(
      () => (
        <div
          className={`pointer-events-auto flex w-full max-w-md rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-neutral-500`}
        >
          <div className="flex flex-col p-4 text-sm">
            <p>
              {t(
                'Thank you for your feedback! Can we upload your current conversation to our server for product improvement purposes? We will never share your data with anyone.',
              )}
            </p>
            <label className="mt-3">{t('Feedback (Optional)')}</label>
            <textarea
              className="w-full rounded-md border border-gray-300 p-2"
              ref={opinionRef}
            />
            <div className="mt-2 flex flex-row justify-between">
              <button
                type="button"
                className="rounded-md border border-green-300 px-2 py-1 text-neutral-900 bg-green-200 shadow hover:bg-green-300 focus:outline-none"
                onClick={() => submitFeedback(isPositiveFeedback)}
              >
                {t('Sure!')}
              </button>
              <button
                type="button"
                className="rounded-md border px-2 py-1 text-neutral-900 hover:bg-neutral-100 focus:outline-none"
                onClick={() => toast.remove('feedback-toast')}
              >
                {t('No Thanks')}
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: 999999,
        id: 'feedback-toast',
      },
    );
  };

  return (
    <div className="flex flex-row">
      <button
        className={`cursor-pointer text-gray-500 hover:text-gray-300 ${
          isThumbsUp === true ? 'text-transparent hover:text-transparent' : ''
        }`}
        onClick={() => {
          setIsThumbsUp(true);
          thumbButtonOnClick(t, true);
        }}
      >
        <IconThumbUp
          size={18}
          fill={isThumbsUp === true ? 'lightgray' : 'none'}
        />
      </button>
      <button
        className={`ml-2 cursor-pointer text-gray-500 hover:text-gray-300 ${
          isThumbsUp === false ? 'text-transparent hover:text-transparent' : ''
        }`}
        onClick={() => {
          setIsThumbsUp(false);
          thumbButtonOnClick(t, false);
        }}
      >
        <IconThumbDown
          size={18}
          fill={isThumbsUp === false ? 'lightgray' : 'none'}
        />
      </button>
    </div>
  );
};
