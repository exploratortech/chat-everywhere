import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import React, {
  Fragment,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import type { ChatEverywhereFeatures } from '@/types/notion';

import HomeContext from '@/components/home/home.context';

import Spinner from '../Spinner/Spinner';
import FeaturesPage from './FeaturePage';
import TierTag from './TierTag';

import dayjs from 'dayjs';

function formatDatetime(dateString: string) {
  return dayjs(dateString).format('YYYY/MM/DD');
}

type Props = {
  className?: string;
  open: boolean;
  onClose: () => void;
};

const FeaturesModel = memo(({ className = '', open, onClose }: Props) => {
  const {
    state: { showFeaturePageOnLoad },
  } = useContext(HomeContext);
  const { t } = useTranslation('features');

  const [featuresList, setFeaturesList] = useState<ChatEverywhereFeatures[]>(
    [],
  );
  const observerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectPageId, setSelectedPageId] = useState<string | null>(null);

  const changeSelectPageId = (pageId: string) => {
    setSelectedPageId(pageId);
  };

  const { i18n } = useTranslation();

  const fetchLatestFeatures = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/notion/features', window.location.origin);
      if (/^zh/.test(i18n.language)) url.searchParams.append('lang', 'zh');
      const response = await fetch(url);
      const { featuresList } = await response.json();
      setFeaturesList(featuresList);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestFeatures();
  }, []);

  // Load specified page and remove specified page after page being loaded
  useEffect(() => {
    setSelectedPageId(showFeaturePageOnLoad);
  }, [showFeaturePageOnLoad]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className={`${className} relative z-50`}
        onClose={onClose}
        open={open}
      >
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
          <div className="flex min-h-full items-center justify-center text-center mobile:block">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="grid h-[80vh] w-full max-w-3xl grid-rows-[max-content_1fr] overflow-hidden rounded-2xl bg-neutral-800 p-6 text-left align-middle text-neutral-200 shadow-xl transition-all mobile:h-dvh mobile:!max-w-[unset] mobile:!rounded-none tablet:max-w-[90vw]">
                <div className="mb-3 flex flex-row items-center justify-between">
                  <h1>{t('Feature Introduction')}</h1>

                  {!selectPageId ? (
                    <button className="min-h-[34px] w-max" onClick={onClose}>
                      <IconX></IconX>
                    </button>
                  ) : (
                    <button
                      className="w-max rounded-lg border border-neutral-800 border-opacity-50 bg-white px-4 py-1 text-black shadow hover:bg-neutral-300 focus:outline-none "
                      onClick={() => setSelectedPageId(null)}
                    >
                      {t('Back')}
                    </button>
                  )}
                </div>

                <ul
                  className={`${
                    selectPageId || isLoading ? 'hidden' : ''
                  } cursor-pointer list-outside list-disc overflow-y-auto`}
                >
                  {featuresList.map((featureItem, index) => (
                    <li
                      className="mb-3 rounded-md p-3 hover:bg-black/50"
                      key={`${featureItem.id} ${index}`}
                      onClick={() => setSelectedPageId(featureItem.id)}
                    >
                      <div className="flex justify-between gap-2">
                        <h3 className="text-sm font-medium leading-5">
                          {featureItem.title}{' '}
                          {featureItem.tier.length > 0 &&
                            featureItem.tier.map((tier) => (
                              <TierTag
                                key={`${featureItem.id} ${index} ${tier}`}
                                tier={tier}
                              />
                            ))}
                        </h3>
                        <label className="text-xs italic">
                          {formatDatetime(featureItem.lastEditedTime)}
                        </label>
                      </div>
                    </li>
                  ))}

                  <div className="h-1" ref={observerRef}></div>
                </ul>

                {selectPageId && (
                  <FeaturesPage
                    pageId={selectPageId}
                    internalLinkOnClick={changeSelectPageId}
                  />
                )}
                {isLoading && (
                  <div className="mt-[50%] flex">
                    <Spinner size="16px" className="mx-auto" />
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});

FeaturesModel.displayName = 'FeaturesModel ';

export default FeaturesModel;
