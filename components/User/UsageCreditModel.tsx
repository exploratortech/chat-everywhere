import { Dialog, Transition } from '@headlessui/react';
import type { FC } from 'react';
import { Fragment, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { DefaultMonthlyCredits } from '@/utils/config';

import { PluginID } from '@/types/plugin';

import HomeContext from '@/components/home/home.context';

type Props = {
  onClose: () => void;
};

const gpt4CreditPurchaseLinks = {
  '50': 'https://buy.stripe.com/28o03Z0vE3Glak09AJ',
  '150': 'https://buy.stripe.com/cN2dUP6U2dgV0JqcMW',
  '300': 'https://buy.stripe.com/dR6g2Xemu5Otcs83cn',
};
const aiImageCreditPurchaseLinks = {
  '100': 'https://buy.stripe.com/fZeg2Xdiq4Kp8bS9AT',
  '500': 'https://buy.stripe.com/8wMg2XcemccR2Ry8wQ',
};

export const UsageCreditModel: FC<Props> = ({ onClose }) => {
  const { t } = useTranslation('model');

  const {
    state: { user, creditUsage },
  } = useContext(HomeContext);

  const gpt4Credit = creditUsage && creditUsage[PluginID.GPT4].remainingCredits;
  const aiImageCredit =
    creditUsage && creditUsage[PluginID.IMAGE_GEN].remainingCredits;

  const userEmail = user?.email;

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
              <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-2xl bg-neutral-800 p-6 text-left align-middle text-neutral-200 shadow-xl transition-all">
                <div className="mb-3">
                  {t(
                    'As a Pro plan customer, you will receive the monthly credits on the 1st day of every month to use our custom modes. If you need more credits, you can purchase them below.',
                  )}
                </div>

                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                  <table className="w-full text-center text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          {t('Custom Mode')}
                        </th>
                        <th scope="col" className="px-6 py-3">
                          {t('Monthly credit')}
                        </th>
                        <th scope="col" className="px-6 py-3">
                          {t('Balance')}
                        </th>
                        <th scope="col" className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-white dark:border-gray-700 dark:bg-gray-900">
                        <th
                          scope="row"
                          className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                        >
                          GPT-4
                        </th>
                        <td className="px-6 py-4">
                          {DefaultMonthlyCredits[PluginID.GPT4]}
                        </td>
                        <td
                          className={`px-6 py-4 ${
                            gpt4Credit === 0 ? 'font-semibold text-red-400' : ''
                          }`}
                        >
                          {gpt4Credit === null
                            ? DefaultMonthlyCredits[PluginID.GPT4]
                            : gpt4Credit}
                        </td>
                        <td className="flex flex-col px-6 py-4 text-left">
                          {Object.entries(gpt4CreditPurchaseLinks).map(
                            ([key, value]) => (
                              <a
                                href={`${value}?prefilled_email=${userEmail}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mb-1.5 font-medium text-blue-600 hover:underline dark:text-blue-500"
                                key={key}
                              >
                                {t('Buy')} {key} {t('credit')}
                              </a>
                            ),
                          )}
                        </td>
                      </tr>
                      <tr className="border-b bg-white dark:border-gray-700 dark:bg-gray-900">
                        <th
                          scope="row"
                          className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                        >
                          {t('AI Image')}
                        </th>
                        <td className="px-6 py-4">
                          {DefaultMonthlyCredits[PluginID.IMAGE_GEN]}
                        </td>
                        <td
                          className={`px-6 py-4 ${
                            aiImageCredit === 0
                              ? 'font-semibold text-red-400'
                              : ''
                          }`}
                        >
                          {aiImageCredit === null
                            ? DefaultMonthlyCredits[PluginID.IMAGE_GEN]
                            : aiImageCredit}
                        </td>
                        <td className="flex flex-col px-6 py-4 text-left">
                          {Object.entries(aiImageCreditPurchaseLinks).map(
                            ([key, value]) => (
                              <a
                                href={`${value}?prefilled_email=${userEmail}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mb-1.5 font-medium text-blue-600 hover:underline dark:text-blue-500"
                                key={key}
                              >
                                {t('Buy')} {key} {t('credit')}
                              </a>
                            ),
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 text-xs leading-4 text-neutral-400">
                  {t(
                    'You will receive an email notification when your credits are ready. You can also check your credit balance in the dashboard.',
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
