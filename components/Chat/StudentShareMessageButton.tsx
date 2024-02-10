import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconBallpen, IconLoader } from '@tabler/icons-react';
import React, { FC, useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'react-tooltip';

import HomeContext from '@/pages/api/home/home.context';

import { encode } from 'base64-arraybuffer';

interface StudentShareMessageBtnProps {
  className?: string;
  messageContent?: string;
  imageFileUrl?: string;
  size?: number;
}

const StudentShareMessageButton: FC<StudentShareMessageBtnProps> = ({
  className = '',
  messageContent = '',
  imageFileUrl = '',
  size = 18,
}) => {
  const { t } = useTranslation('feature');
  const {
    state: { user },
  } = useContext(HomeContext);
  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();

  const { dispatch: homeDispatch } = useContext(HomeContext);
  let imageFileInBase64: String | null = null;

  const shareOnClick = async () => {
    setLoading(true);
    if (imageFileUrl) {
      const response = await fetch(imageFileUrl);
      const blob = await response.arrayBuffer();
      imageFileInBase64 = encode(blob);
    }
    const payload = {
      accessToken: (await supabase.auth.getSession()).data.session
        ?.access_token,
      messageContent: messageContent,
      imageFile: imageFileInBase64,
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
        data-tooltip-content={t('Share to Teacher') || ''}
        data-tooltip-place="bottom"
        className={`translate-x-[9999px] text-[#4c75c7] hover:text-[#89adf4] focus:translate-x-0 group-hover:translate-x-0 h-fit ${className} ${
          loading ? '!translate-x-0' : ''
        }`}
        onClick={shareOnClick}
      >
        {loading ? (
          <IconLoader size={size} className="animate-spin" />
        ) : (
          <IconBallpen size={size} />
        )}
      </button>
      <Tooltip id="share-line-tooltip" />
    </>
  );
};

export default StudentShareMessageButton;
