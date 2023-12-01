import { useSession } from '@supabase/auth-helpers-react';
import { IconCircleCheck } from '@tabler/icons-react';
import React, { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Image from 'next/image';
import { event } from 'nextjs-google-analytics';

import { trackEvent } from '@/utils/app/eventTracking';
import { FeatureItem, PlanDetail } from '@/utils/app/ui';

import HomeContext from '@/pages/api/home/home.context';

import { ReferralCodeEnter } from '../ReferralCodeEnter';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(LocalizedFormat);

export default function Settings_Account() {
  const { t } = useTranslation('model');
  const [displayReferralCodeEnterer, setDisplayReferralCodeEnterer] =
    useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const {
    state: { user, isPaidUser },
    dispatch,
  } = useContext(HomeContext);

  const session = useSession();

  const changePasswordOnClick = () => {
    dispatch({ field: 'showSettingsModel', value: false });
    dispatch({ field: 'showLoginSignUpModel', value: true });
  };

  const upgradeLinkOnClick = () => {
    const paymentLink =
      process.env.NEXT_PUBLIC_ENV === 'production'
        ? 'https://buy.stripe.com/8wM8Av2DM0u99fWfZ1'
        : 'https://buy.stripe.com/test_4gw4hLcvq52Odt6fYY';
    const userEmail = user?.email;
    const userId = user?.id;

    event('Upgrade button clicked', {
      category: 'Engagement',
      label: 'Upgrade',
      userEmail: userEmail || 'N/A',
    });
    trackEvent('Upgrade button clicked');

    if (!user) {
      toast.error('Please sign-up before upgrading to pro plan');
    } else {
      window.open(
        `${paymentLink}?prefilled_email=${userEmail}&client_reference_id=${userId}`,
        '_blank',
      );
    }
  };

  const subscriptionManagementLink = () =>
    process.env.NEXT_PUBLIC_ENV === 'production'
      ? 'https://billing.stripe.com/p/login/5kAbMj0wt5VF6AwaEE'
      : 'https://billing.stripe.com/p/login/test_28o4jFe6GaqK1UY5kk';

  const lineConnectOnClick = () => {
    const clientId = process.env.NEXT_PUBLIC_LINE_NOTIFY_CLIENT_ID;
    const redirectUrl =
      process.env.NEXT_PUBLIC_ENV === 'production'
        ? 'https://chateverywhere.app/api/webhooks/line-notify-connect'
        : `${window.location.protocol}//${window.location.host}/api/webhooks/line-notify-connect`;
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
      field: 'user',
      value: {
        isConnectedWithLine: false,
      },
    });
    toast.success('Successfully disconnected with LINE');
    setDisconnecting(false);
  };

  return (
    <div>
      <h1 className="font-bold mb-4">{t('Account')}</h1>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl flex flex-col">
          {!isPaidUser && (
            <span className="text-sm mb-2">
              {t(
                'Unlock all the amazing features by upgrading to our Pro plan, cancel anytime!',
              )}
            </span>
          )}
          {isPaidUser && user?.isInReferralTrial && (
            <div className="text-xs leading-5 text-neutral-400 flex gap-2 mb-3 items-center">
              <IconCircleCheck className="text-green-500" size={19} />
              <p className="flex items-center">
                {t('Enjoy our pro plan experience during your trial!')}
              </p>
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-center gap-4 mb-3">
            <div className="flex flex-col  border rounded-lg p-4 text-neutral-400 border-neutral-400 md:w-1/2">
              <span className="text-2xl font-bold">Free</span>
              <div className="text-xs leading-5">
                {PlanDetail.free.features.map((feature, index) => (
                  <FeatureItem key={index} featureName={t(feature)} />
                ))}
              </div>
            </div>
            <div className="flex flex-col  border rounded-lg p-4 mt-4 md:mt-0 md:ml-2 md:w-1/2">
              <span className="text-2xl font-bold">Pro</span>
              <span className="text-sm mb-2">{t('USD$9.99 / month')}</span>
              <div className="text-xs leading-5">
                <FeatureItem featureName={t('Everything in free plan')} />
                <FeatureItem featureName={t('Priority response time')} />
                {PlanDetail.pro.features.map((feature, index) => (
                  <FeatureItem key={index} featureName={t(feature)} />
                ))}
              </div>
              {(!user || !isPaidUser) && (
                <div className="flex flex-col">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => upgradeLinkOnClick()}
                    className="px-4 py-2 border rounded-lg bg-white shadow border-none text-white font-semibold focus:outline-none mt-4 text-center text-sm cursor-pointer bg-gradient-to-r from-[#fd68a6] to-[#6c62f7]"
                  >
                    {t('Upgrade')}
                  </a>
                  <p className="text-xs text-neutral-400 mt-2">
                    {t('No Strings Attached - Cancel Anytime!')}
                  </p>
                </div>
              )}
              {user?.plan === 'pro' && user.proPlanExpirationDate && (
                <div className="text-left text-neutral-500 p-2 text-xs">
                  {`${t('Expires on')}: 
                            ${dayjs(user.proPlanExpirationDate).format(
                              'll',
                            )}`}{' '}
                </div>
              )}
            </div>
          </div>
          {displayReferralCodeEnterer && <ReferralCodeEnter />}
          <div>
            {user?.plan === 'pro' && !user?.isInReferralTrial && (
              <p className="text-xs text-neutral-400">
                {t(
                  'Thank you for supporting us! If you want to cancel your subscription, please visit ',
                )}
                <a
                  href={subscriptionManagementLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="underline cursor-pointer"
                >
                  {t('here')}
                </a>
                {t(' and cancel your subscription.')}
              </p>
            )}

            <p className="text-xs text-neutral-400 mt-2">
              {t('If you have any questions, please contact us at ')}
              <a
                target="_blank"
                rel="noreferrer"
                className="underline cursor-pointer"
                href="mailto:jack@exploratorlabs.com"
              >
                jack@exploratorlabs.com
              </a>
            </p>
            {user && (
              <p className="text-xs text-neutral-400 mt-2">
                {t('Your registration email is')} {user?.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          {user && (
            <div className="flex flex-row items-center">
              {!isPaidUser && (
                <span
                  className="pr-2 text-neutral-500 hover:text-neutral-700 focus:outline-none cursor-pointer text-xs"
                  onClick={() =>
                    setDisplayReferralCodeEnterer(!displayReferralCodeEnterer)
                  }
                >
                  {t('Referral code')}
                </span>
              )}

              <span
                className="px-4 text-neutral-500 hover:text-neutral-700 focus:outline-none cursor-pointer mr-2 text-xs"
                onClick={changePasswordOnClick}
              >
                {t('Change password')}
              </span>
            </div>
          )}
        </div>
        <div className="inline-flex items-center justify-center w-full">
          <hr className="w-64 h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
          <span className="absolute px-3 text-white -translate-x-1/2 left-1/2 bg-[#171717]">
            {t('Integrations (pro plan)')}
          </span>
        </div>
        <div className="flex items-center">
          <Image
            src="/assets/line-icon.webp"
            alt="Line icon"
            className="inline-block"
            width="50"
            height="50"
          />
          {user?.isConnectedWithLine ? (
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
      </div>
    </div>
  );
}
