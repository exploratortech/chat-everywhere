import { Dialog, Transition } from '@headlessui/react';
import { IconCircleCheck } from '@tabler/icons-react';
import { FC, Fragment, useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';
import { event } from 'nextjs-google-analytics';

import { trackEvent } from '@/utils/app/eventTracking';
import { FeatureItem, PlanDetail } from '@/utils/app/ui';

import HomeContext from '@/pages/api/home/home.context';

import { ReferralCodeEnter } from './ReferralCodeEnter';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(LocalizedFormat);

type Props = {
  onClose: () => void;
};

export const ProfileUpgradeModel: FC<Props> = ({ onClose }) => {
  const { t } = useTranslation('model');
  const {
    state: { user, isPaidUser },
    handleUserLogout,
    dispatch,
  } = useContext(HomeContext);
  const [displayReferralCodeEnterer, setDisplayReferralCodeEnterer] =
    useState(false);

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

    window.open(
      `${paymentLink}?prefilled_email=${userEmail}&client_reference_id=${userId}`,
      '_blank',
    );
  };

  const upgradeForOneMonthLinkOnClick = () => {
    const paymentLink =
      process.env.NEXT_PUBLIC_ENV === 'production'
        ? 'https://buy.stripe.com/3csbMH7Y62Ch77O005'
        : 'https://buy.stripe.com/test_bIY6pTcvq52O60E4gh';
    const userEmail = user?.email;
    const userId = user?.id;

    event('One month upgrade button clicked', {
      category: 'Engagement',
      label: 'Upgrade',
      userEmail: userEmail || 'N/A',
    });
    trackEvent('Upgrade (one-month only) button clicked');

    window.open(
      `${paymentLink}?prefilled_email=${userEmail}&client_reference_id=${userId}`,
      '_blank',
    );
  };

  const changePasswordOnClick = () => {
    dispatch({ field: 'showProfileModel', value: false });
    dispatch({ field: 'showLoginSignUpModel', value: true });
  };

  const subscriptionManagementLink = () =>
    process.env.NEXT_PUBLIC_ENV === 'production'
      ? 'https://billing.stripe.com/p/login/5kAbMj0wt5VF6AwaEE'
      : 'https://billing.stripe.com/p/login/test_28o4jFe6GaqK1UY5kk';

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} open>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md md:max-w-lg transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all bg-neutral-800 text-white">
                <Dialog.Description>
                  <div className="rounded-2xl flex flex-col">
                    {!isPaidUser && (
                      <span className="text-sm mb-2">
                        {t(
                          'Unlock all the amazing features by upgrading to our Pro plan, cancel anytime! Please make sure you registered before upgrading to avoid wait time.',
                        )}
                      </span>
                    )}
                    {isPaidUser && user?.hasReferrer && (
                      <div className="text-xs leading-5 text-neutral-400 flex gap-2 mb-3 items-center">
                        <IconCircleCheck className="text-green-500" size={19} />
                        <p className="flex items-center">
                          {t(
                            'Enjoy our pro plan experience during your trial!',
                          )}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row justify-evenly mb-3">
                      <div className="flex flex-col border rounded-lg p-4 text-neutral-400 border-neutral-400 md:w-1/2">
                        <span className="text-2xl font-bold">Free</span>
                        <div className="text-xs leading-5">
                          {PlanDetail.free.features.map((feature, index) => (
                            <FeatureItem key={index} featureName={t(feature)} />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col border rounded-lg p-4 mt-4 md:mt-0 md:ml-2 md:w-1/2">
                        <span className="text-2xl font-bold">Pro</span>
                        <span className="text-sm mb-2">
                          {t('USD$9.99 / month')}
                        </span>
                        <div className="text-xs leading-5">
                          <FeatureItem
                            featureName={t('Everything in free plan')}
                          />
                          <FeatureItem
                            featureName={t('Priority response time')}
                          />
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
                            <a
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => upgradeForOneMonthLinkOnClick()}
                              className="px-4 py-2 text-xs border rounded-lg bg-neutral-300 shadow border-none text-neutral-700 hover:bg-white focus:outline-none mt-2 text-center cursor-pointer"
                            >
                              {t(
                                'Upgrade for one month only (active in 24 hours)',
                              )}
                            </a>
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
                      {user?.plan === 'pro' && !user?.hasReferrer && (
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
                </Dialog.Description>

                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 border rounded-lg shadow text-black bg-slate-200 hover:bg-slate-300 focus:outline-none"
                    onClick={onClose}
                  >
                    {t('Okay')}
                  </button>

                  {user && (
                    <div className="flex flex-row items-center">
                      {!isPaidUser && (
                        <span
                          className="pr-2 text-neutral-500 hover:text-neutral-700 focus:outline-none cursor-pointer text-xs"
                          onClick={() =>
                            setDisplayReferralCodeEnterer(
                              !displayReferralCodeEnterer,
                            )
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
                      <button
                        type="button"
                        className="px-4 py-2 border rounded-lg shadow border-neutral-500 text-neutral-200 hover:bg-neutral-700 focus:outline-none"
                        onClick={handleUserLogout}
                      >
                        {t('Sign Out')}
                      </button>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
