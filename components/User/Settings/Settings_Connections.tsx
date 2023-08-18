import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Image from 'next/image';
import { IconCircleCheckFilled, IconDots, IconExternalLink, IconPlugConnectedX, IconRefresh } from '@tabler/icons-react';
import dayjs from 'dayjs';

import HomeContext from '@/pages/api/home/home.context';
import { didPairCodeExpire, unpair } from '@/utils/server/pairing';
import { toast } from 'react-hot-toast';
import { SidebarButton } from '@/components/Sidebar/SidebarButton';
import { PairPlatforms } from '@/types/pair';

export default function Settings_Connections() {
  const { t } = useTranslation('model');

  const {
    state: { user },
  } = useContext(HomeContext);

  const [loading, setLoading] = useState<boolean>(false);
  const [pairCodeData, setPairCodeData] = useState<any>(null);

  const fetchPairCodeData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetch('/api/connections', {
      headers: { 'user-token': user.token },
      method: 'GET',
    });
    setLoading(false);
    if (res.ok) {
      setPairCodeData(await res.json());
    }
  }, [user]);

  const disconnect = useCallback(async (app: PairPlatforms): Promise<void> => {
    try {
      if (!user) throw new Error('Not signed in.');

      const res = await fetch(`/api/connections?app=${app}`, {
        headers: { 'user-token': user.token },
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      setPairCodeData({
        ...pairCodeData,
        [`${app}Id`]: null,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Unable to disconnect. Please try again later.');
      }
    }
  }, [pairCodeData, user]);

  useEffect(() => {
    fetchPairCodeData();
  }, [fetchPairCodeData]);

  return (
    <div>
      <h1 className="font-bold mb-4">{t("Connections")}</h1>
      <div className="flex flex-col items-center mb-4 p-3 border border-white/50 rounded-lg text-sm">
        {pairCodeData && !didPairCodeExpire(pairCodeData.pairCodeExpiresAt) ? (
          <>
            <div className="flex flex-row items-center gap-2">
              <h1 className="font-mono text-center text-xl font-bold">{pairCodeData.pairCode}</h1>
              <RefreshButton loading={loading} onClick={fetchPairCodeData} />
            </div>
            <p className="text-center text-neutral-400">
              {t(`Use "/pair <email> <code>" to pair your account`)} | <Trans i18nKey="Expires in" t={t} defaults="Expires {{time}}" values={{ time: dayjs(pairCodeData.pairCodeExpiresAt).fromNow() }} />
            </p>
          </>
        ) : (
          <div className="flex flex-row items-center">
            {user == null ? (
              <p className="text-center text-neutral-400">{t('Sign in and pair your account to access your conversations from other platforms.')}</p>
            ) : (
              <>
                <p className="text-center text-neutral-400">{t(`Use "/pair <email>" to generate a new pair code`)}</p>
                <RefreshButton loading={loading} onClick={fetchPairCodeData} />
              </>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 mobile:grid-cols-1 gap-10">
        <Connection
          name="Line"
          image="/assets/images/line_icon.png"
          qrCode="/assets/images/line_qr_code.png"
          onDisconnect={() => disconnect('line')}
          connected={pairCodeData?.lineId}
          link={`https://line.me/R/ti/p/${encodeURIComponent('@829axojl')}`}
        />
      </div>
    </div>
  );
}

type RefreshButtonProps = {
  loading: boolean;
  onClick: () => void;
}

function RefreshButton({ loading, onClick }: RefreshButtonProps): JSX.Element {
  return (
    <button
      className="p-2"
      disabled={loading}
      onClick={() => {
        if (!loading) onClick();
      }}
    >
      {loading ? (
        <IconDots size={20} />
      ) : (
        <IconRefresh size={20} />
      )}
    </button>
  );
}

type ConnectionProps = {
  name: string;
  image: string;
  qrCode: string;
  onDisconnect: () => void;
  connected?: boolean;
  link?: string;
}

function Connection({
  name,
  image,
  qrCode,
  onDisconnect,
  connected = false,
  link,
}: ConnectionProps): JSX.Element {
  const {
    state: { user },
  } = useContext(HomeContext);

  const { t } = useTranslation('model');

  return (
    <div className="flex flex-col border border-white/50 rounded-lg">
      <div className="flex flex-row justify-between items-center p-3">
        <div className="flex flex-row items-center">
          <Image
            src={image}
            alt={`Icon of ${name}`}
            width="32"
            height="32"
            className="rounded-lg"
          />
          <h1 className="m-0 ml-3 mr-2">{name}</h1>
        </div>
        {connected && (<IconCircleCheckFilled className="text-green-400" size={24} />)}
      </div>
      <div className="relative w-full aspect-square">
        <Image
          src={qrCode}
          alt={`${name} QR Code`}
          fill
        />
      </div>
      <div className="flex flex-row items-center p-2">
        {user && (
          <>
            {connected ? (
              <SidebarButton
                icon={<IconPlugConnectedX size={18} />}
                onClick={onDisconnect}
                text={t('Disconnect')}
              />
            ) : (
              <p className="flex-grow p-3 text-sm">{t('Not Connected')}</p>
            )}
          </>
        )}
        {link && (
          <SidebarButton
            className="flex-shrink w-auto ml-2"
            icon={<IconExternalLink size={24} />}
            onClick={() => {
              window.open(link, '_blank')?.focus();
            }}
          />
        )}
      </div>
    </div>
  );
}
