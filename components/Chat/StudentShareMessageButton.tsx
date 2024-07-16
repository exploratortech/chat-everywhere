import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconBallpen, IconLoader } from '@tabler/icons-react';
import type { FC } from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'react-tooltip';

import { trackEvent } from '@/utils/app/eventTracking';
import { truncateText } from '@/utils/data/truncateText';

interface StudentShareMessageBtnProps {
  className?: string;
  messageContent?: string;
  imageFileUrl?: string;
  size?: number;
  isSelectedText?: boolean;
}

const StudentShareMessageButton: FC<StudentShareMessageBtnProps> = ({
  className = '',
  messageContent = '',
  imageFileUrl = '',
  size = 18,
  isSelectedText = false,
}) => {
  const { t } = useTranslation('feature');

  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();

  const shareOnClick = async () => {
    setLoading(true);
    const payload = {
      accessToken: (await supabase.auth.getSession()).data.session
        ?.access_token,
      messageContent: messageContent,
      imageFileUrl,
    };
    try {
      const response = await fetch('/api/create-message-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.status !== 200 || !response.ok) {
        toast.error(t('Failed to share message, please try again later'));
        setLoading(false);
        return;
      }
      toast.success(t('Message shared successfully'));
      setLoading(false);
      trackEvent('Temp account message submission');
    } catch (error) {
      console.error(
        'There has been a problem with your fetch operation:',
        error,
      );
      toast.error(t('Failed to share message, please try again later'));
      setLoading(false);
    }
  };

  return (
    <>
      <button
        data-tooltip-id="share-line-tooltip"
        data-tooltip-content={`${t(`Share to Teacher`)}${isSelectedText ? ': ' + truncateText(messageContent, 15) : ''}`}
        data-tooltip-place="bottom"
        className={`h-fit translate-x-[9999px] text-[#4c75c7] hover:text-[#89adf4] focus:translate-x-0 group-hover:translate-x-0 ${className} ${loading ? '!translate-x-0' : ''}`}
        onClick={shareOnClick}
      >
        {loading ? (
          <IconLoader size={size} className="animate-spin" />
        ) : (
          <IconBallpen size={size} />
        )}
      </button>
      <Tooltip id="share-line-tooltip" className="max-w-md break-words" />
    </>
  );
};

export default StudentShareMessageButton;
