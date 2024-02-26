import {
  IconArrowBack,
  IconBuildingBroadcastTower,
  IconInfoSquareRounded,
  IconMessages,
  IconPrompt,
  IconRating12Plus,
  IconTags,
} from '@tabler/icons-react';
import React, { cloneElement, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Image from 'next/image';
import { useRouter } from 'next/router';

import { trackEvent } from '@/utils/app/eventTracking';

import { Button } from '@/components/ui/button';

import { TeacherPortalContext } from './teacher-portal.context';

type Props = {
  className?: string;
  disableFooterItems?: boolean;
};

type sideBarItemType = {
  icon: JSX.Element;
  name: string;
  value: string;
  callback: () => void;
};

export default function Sidebar({ className = '' }: Props) {
  const {
    state: { showing },
    dispatch,
  } = useContext(TeacherPortalContext);
  const { t } = useTranslation('model');
  const router = useRouter();
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/');
  };
  const iconClass = 'h-[18px] tablet:h-[22px] tablet:w-[36px]';
  const items: sideBarItemType[] = [
    {
      icon: <IconRating12Plus />,
      name: t('One-time code'),
      value: 'one-time-code',
      callback: () => {
        trackEvent('One-time code button clicked');
        dispatch({
          field: 'showing',
          value: 'one-time-code',
        });
      },
    },
    {
      icon: <IconBuildingBroadcastTower />,
      name: t('Shared messages'),
      value: 'shared-message',
      callback: () => {
        trackEvent('Share message button clicked');
        dispatch({
          field: 'showing',
          value: 'shared-message',
        });
      },
    },
    {
      icon: <IconTags />,
      name: t('Tags'),
      value: 'tags',
      callback: () => {
        trackEvent('Tags button clicked');
        dispatch({
          field: 'showing',
          value: 'tags',
        });
      },
    },
    {
      icon: <IconPrompt />,
      name: t('Teacher Prompt'),
      value: 'teacher-prompt',
      callback: () => {
        trackEvent('teacher-prompt button clicked');
        dispatch({
          field: 'showing',
          value: 'teacher-prompt',
        });
      },
    },
  ];

  const getRenderItems = (itemsArray: sideBarItemType[]) =>
    itemsArray.map((item, i) => (
      <a
        key={`${i} ${item.name}`}
        href="#"
        className={`outline-none py-2 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 tablet:px-2 tablet:py-4 
          ${showing === item.value ? 'bg-neutral-900 text-neutral-100' : ''}
          `}
        onClick={item.callback}
      >
        <div className="flex gap-2 items-center ">
          {cloneElement(item.icon, {
            className: iconClass,
          })}
          <div className="tablet:hidden"> {item.name}</div>
        </div>
      </a>
    ));

  const joinLINEGroupOnClick = (e: React.MouseEvent) => {
    e.preventDefault();
    trackEvent('Join LINE group button clicked');
    toast(
      (tInstance) => (
        <div className="flex flex-col items-center">
          <Image
            src="/assets/teacher_portal_qrcode.jpg"
            alt="QR Code"
            width={200}
            height={200}
          />
          <p className="text-center mb-5">
            {t('Scan the QR code or')}
            <a
              href="https://line.me/R/ti/g/cR6EoQ_ggL"
              target="_blank"
              className="underline"
            >
              {' '}
              {t('click here')}{' '}
            </a>
            {t('to join our focus group to share your feedback.')}
          </p>
          <Button
            variant="secondary"
            onClick={() => toast.dismiss(tInstance.id)}
          >
            {t('Close')}
          </Button>
        </div>
      ),
      {
        duration: 60000,
      },
    );
  };

  return (
    <div className={`${className} flex justify-between flex-col`}>
      <div>
        <b className="pt-6 px-6 block select-none tablet:hidden">
          {t('Teacher Portal')} (Beta)
        </b>
        <div className="py-6 flex flex-col">{getRenderItems(items)}</div>
      </div>

      <div className="flex flex-col">
        <a
          className={`outline-none py-2 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 flex gap-2 items-center tablet:px-2`}
          target="_blank"
          href="https://explorator.notion.site/a68dbc8f3df241a49b62add843a8d364"
        >
          <IconInfoSquareRounded className={iconClass} />
          <div className="tablet:hidden">{t('Instructions')}</div>
        </a>
        <a
          href="#"
          className={`outline-none py-2 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 flex gap-2 items-center tablet:px-2`}
          onClick={joinLINEGroupOnClick}
        >
          <IconMessages className={iconClass} />
          <div className="tablet:hidden">{t('Join research group')}</div>
        </a>

        <a
          href="#"
          className="outline-none py-5 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 flex gap-2 items-center tablet:px-2"
          onClick={handleBackClick}
        >
          <IconArrowBack className={iconClass} />

          <div className="tablet:hidden">{t('Back')}</div>
        </a>
      </div>
    </div>
  );
}
