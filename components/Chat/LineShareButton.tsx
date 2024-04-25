import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconLoader, IconMessageCircleUp } from '@tabler/icons-react';
import React, { FC, useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'react-tooltip';

import { trackEvent } from '@/utils/app/eventTracking';

import HomeContext from '@/components/home/home.context';

import { encode } from 'base64-arraybuffer';

import { truncateText } from '@/utils/data/truncateText';

interface LineShareButtonProps {
  displayInProgressToast?: boolean;
  className?: string;
  messageContent?: string;
  imageFileUrl?: string;
  size?: number;
  isSelectedText? : boolean
}

export const LineShareButton: FC<LineShareButtonProps> = ({
  displayInProgressToast = false,
  className = '',
  messageContent = '',
  imageFileUrl = '',
  size = 18,
  isSelectedText = false,
}) => {
  const { t } = useTranslation('feature');
  const {
    state: { user, isConnectedWithLine, isTempUser, teacherSettings },
  } = useContext(HomeContext);
  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();

  const { dispatch: homeDispatch } = useContext(HomeContext);
  let imageFileInBase64: String | null = null;

  const shareOnClick = async () => {
    trackEvent('LINE share button clicked');

    if (!user || user.plan === 'free') {
      toast.error(
        t(
          "This is a Pro only feature. Please sign-up to use it if you don't have an account.",
        ),
      );
      return;
    }

    if (!isConnectedWithLine) {
      toast.error(t('Please connect with your Line account first.'));
      homeDispatch({ field: 'showSettingsModel', value: true });
      return;
    }

    setLoading(true);

    if (imageFileUrl) {
      const response = await fetch(imageFileUrl);
      const blob = await response.arrayBuffer();
      imageFileInBase64 = encode(blob);
    }

    if (displayInProgressToast) {
      toast(t('Sharing message to LINE...'));
    }
    const payload = {
      accessToken: (await supabase.auth.getSession()).data.session
        ?.access_token,
      messageContent: messageContent,
      imageFile: imageFileInBase64,
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
        toast.error(t('Failed to share message, please try again later'));
        setLoading(false);
        return;
      }

      if (response.status === 401) {
        toast.error(
          t(
            'Your Line connection has expired, please re-connect on the setting page',
          ),
        );
        setLoading(false);
        return;
      }

      toast.success(t('Message shared successfully'));
      setLoading(false);
    } catch (error) {
      console.error(
        'There has been a problem with your fetch operation:',
        error,
      );
      toast.error(t('Failed to share message, please try again later'));
      setLoading(false);
    }
  };
  const isStudentAccount = isTempUser;
  const lineButtonDisplayCondition =
    !isStudentAccount ||
    (isStudentAccount && teacherSettings.allow_student_use_line);

  if (!lineButtonDisplayCondition) return null;
  return (
    <>
      <button
        data-tooltip-id="share-line-tooltip"
        data-tooltip-content={`${t(`Share to LINE`)}${isSelectedText? ': ' + truncateText(messageContent, 15) : ''}`}
        data-tooltip-place="bottom"
        className={`translate-x-[9999px] text-[#4CC764] hover:text-[#17ff44] focus:translate-x-0 group-hover:translate-x-0 h-fit ${className} ${
          loading ? '!translate-x-0' : ''
        }`}
        onClick={shareOnClick}
      >
        {loading ? (
          <IconLoader size={size} className="animate-spin" />
        ) : (
          <IconMessageCircleUp size={size} />
        )}
      </button>
      <Tooltip id="share-line-tooltip" />
    </>
  );
};
