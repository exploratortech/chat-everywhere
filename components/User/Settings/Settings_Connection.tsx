import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Image from 'next/image';

import HomeContext from '@/pages/api/home/home.context';
import dayjs from 'dayjs';
import { didPairCodeExpire } from '@/utils/server/pairing';

export default function Settings_Connection() {
  const { t } = useTranslation('model');

  const {
    state: { user },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [pairCodeData, setPairCodeData] = useState<any>(null);

  const fetchPairCodeData = useCallback(async () => {
    if (!user) return;
    const res = await fetch('/api/getPairCode', {
      headers: { 'user-token': user.token },
    });
    setPairCodeData(await res.json());
  }, [user]);

  useEffect(() => {
    fetchPairCodeData();
  }, [fetchPairCodeData]);

  return (
    <div>
      <h1 className="font-bold mb-4">{t("Connections")}</h1>
      <div className="flex flex-col mb-4 p-3 border rounded-lg">
        {pairCodeData && !didPairCodeExpire(pairCodeData.pairCodeExpiresAt) ? (
          <>
            <h1 className="font-mono text-center text-xl font-bold">{pairCodeData.pairCode}</h1>
            <p className="text-center">
              {t(`Use "/pair <email> <code>" to pair your account`)} | <Trans i18nKey="Expires in" t={t} defaults="Expires in {{time}}" values={{ time: dayjs(pairCodeData.pairCodeExpiresAt).fromNow() }} />
            </p>
          </>
        ) : (
          <p className="text-center">{t(`Use "/pair <email>" to generate a new pair code`)}</p>
        )}
      </div>
      <div className="grid grid-cols-3 mobile:grid-cols-1 mobile:px-20 gap-10">
        <Connection
          name="LINE"
          image="/assets/images/line_icon.png"
          qrCode="/assets/images/line_qr_code.png"
        />
        <Connection
          name="LINE"
          image="/assets/images/line_icon.png"
          qrCode="/assets/images/line_qr_code.png"
        />
        <Connection
          name="LINE"
          image="/assets/images/line_icon.png"
          qrCode="/assets/images/line_qr_code.png"
        />
        <Connection
          name="LINE"
          image="/assets/images/line_icon.png"
          qrCode="/assets/images/line_qr_code.png"
        />
        <Connection
          name="LINE"
          image="/assets/images/line_icon.png"
          qrCode="/assets/images/line_qr_code.png"
        />
      </div>
    </div>
  );
}

type ConnectionProps = {
  name: string;
  image: string;
  qrCode: string;
}

function Connection({ name, image, qrCode }: ConnectionProps): JSX.Element {
  const { t } = useTranslation('model');

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center mb-2">
        <h1 className="m-0 mr-2">
          {t(`Connect with ${name}`)}
        </h1>
        <Image
          src={image}
          alt={`Icon of ${name}`}
          width="32"
          height="32"
          className="rounded-lg"
        />
      </div>
      <div className="relative w-full aspect-square">
        <Image
          src={qrCode}
          alt="LINE QR Code"
          fill
        />
      </div>
    </div>
  );
}
