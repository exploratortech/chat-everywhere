import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconLoader, IconMessageCircleUp } from '@tabler/icons-react';
import React, { FC, useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'react-tooltip';

import HomeContext from '@/pages/api/home/home.context';

interface LineShareButtonProps {
  className?: string;
  messageContent: string;
}

export const LineShareButton: FC<LineShareButtonProps> = ({
  className = '',
  messageContent,
}) => {
  const { t } = useTranslation('chat');
  const {
    state: { user },
  } = useContext(HomeContext);
  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();

  const { dispatch: homeDispatch } = useContext(HomeContext);

  const shareOnClick = async () => {
    if (!user || user.plan === 'free') {
      toast.error(
        "This is a Pro only feature. Please sign-up to use it if you don't have an account.",
      );
      return;
    }

    if (!user.isConnectedWithLine) {
      toast.error('Please connect with your Line account first.');
      homeDispatch({ field: 'showSettingsModel', value: true });
      return;
    }

    setLoading(true);
    const payload = {
      accessToken: (await supabase.auth.getSession()).data.session
        ?.access_token,
      messageContent: messageContent,
    };

    try {
      const response = await fetch('/api/share-to-line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 400 || response.status === 500 || !response.ok) {
        toast.error('Failed to share message, please try again later');
        setLoading(false);
        return;
      }

      if (response.status === 401) {
        toast.error(
          'Your Line connection has expired, please re-connect on the setting page',
        );
        setLoading(false);
        return;
      }

      toast.success('Message shared successfully');
      setLoading(false);
    } catch (error) {
      console.error(
        'There has been a problem with your fetch operation:',
        error,
      );
      toast.error('Failed to share message, please try again later');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        data-tooltip-id="share-line-tooltip"
        data-tooltip-content={t('Share to LINE') || ''}
        data-tooltip-place="bottom"
        className={`translate-x-[1000px] text-[#4CC764] hover:text-[#17ff44] focus:translate-x-0 group-hover:translate-x-0 h-fit ${className} ${
          loading ? '!translate-x-0' : ''
        }`}
        onClick={shareOnClick}
      >
        {loading ? (
          <IconLoader size={18} className="animate-spin" />
        ) : (
          <IconMessageCircleUp size={18} />
        )}
      </button>
      <Tooltip id="share-line-tooltip" />
    </>
  );
};
