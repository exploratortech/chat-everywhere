import { useSession } from '@supabase/auth-helpers-react';
import React, { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getHomeUrl } from '@/utils/app/api';

import Image from 'next/image';

import HomeContext from '@/pages/api/home/home.context';

export const LineConnectionButton = () => {
  const {
    state: { user, isPaidUser, isConnectedWithLine },
    dispatch,
  } = useContext(HomeContext);
  const { t } = useTranslation('model');
  const [disconnecting, setDisconnecting] = useState(false);
  const session = useSession();

  const lineConnectOnClick = () => {
    const clientId = process.env.NEXT_PUBLIC_LINE_NOTIFY_CLIENT_ID;
    let redirectUrl = `${getHomeUrl()}/api/webhooks/line-notify-connect`;
    const lineConnectLink = `https://notify-bot.line.me/oauth/authorize?response_type=code&client_id=${clientId}&scope=notify&state=${session?.access_token}&redirect_uri=${redirectUrl}`;
    window.location.href = lineConnectLink;
  };

  const lineDisconnectOnClick = async () => {
    setDisconnecting(true);

    const response = await fetch('/api/disconnect-with-line', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken: session?.access_token }),
    });

    if (!response.ok) {
      toast.error('Unable to disconnect with LINE, please try again later');
      setDisconnecting(false);
      return;
    }

    dispatch({
      field: 'isConnectedWithLine',
      value: false,
    });
    toast.success('Successfully disconnected with LINE');
    setDisconnecting(false);
  };
  return (
    <div className="flex items-center">
      <Image
        src="/assets/line-icon.webp"
        alt="Line icon"
        className="inline-block"
        width="50"
        height="50"
      />
      {isConnectedWithLine ? (
        <div className="flex items-center">
          <p className="text-xs text-neutral-400 cursor-default">
            {t('Connected with LINE')}
          </p>
          <button
            className="border border-neutral-600 hover:bg-gray-200 text-gray-800 p-1 rounded-sm text-xs dark:text-gray-100 dark:hover:bg-transparent ml-2"
            onClick={lineDisconnectOnClick}
            disabled={disconnecting}
          >
            {disconnecting ? '...' : t('Disconnect')}
          </button>
        </div>
      ) : (
        <button
          className={`border border-neutral-600 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm dark:text-gray-100 dark:hover:bg-transparent ${
            !user || (!isPaidUser && '!text-gray-400')
          }`}
          onClick={lineConnectOnClick}
          disabled={!user || !isPaidUser}
        >
          {t('Connect with LINE')}
        </button>
      )}
    </div>
  );
};
